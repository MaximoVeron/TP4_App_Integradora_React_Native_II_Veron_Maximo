import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { LIBROS } from '@/data/libros';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';

/**
 * Mostrador del personal.
 *
 * Protección:
 * - Si no hay sesión activa, redirige automáticamente a /login.
 *
 * Funcionalidad:
 * - Muestra libros con lista de espera.
 * - "Entregar al siguiente": desencola a la persona del frente.
 *   Si esa persona es "Veron Maximo", le envía una notificación (si tiene permiso)
 *   o un aviso dentro de la app (si no).
 * - "Cerrar sesión": cierra la sesión y vuelve al Catálogo.
 */
export default function Mostrador() {
  const { listasEspera, sesionActiva, cerrarSesion, entregarAlSiguiente } = useApp();

  // Si no hay sesión activa, redirigir al login
  useEffect(() => {
    if (!sesionActiva) {
      router.replace('/login');
    }
  }, [sesionActiva]);

  // Filtrar libros con lista de espera
  const librosConEspera = Object.entries(listasEspera)
    .filter(([, cola]) => !cola.estaVacia())
    .map(([isbn, cola]) => {
      const libro = LIBROS.find((l) => l.isbn === isbn);
      const frente = cola.verFrente();
      return {
        isbn,
        libro,
        frente: frente || 'Sin persona',
        esperando: cola.tamanio,
      };
    });

  /**
   * Entregar el libro al siguiente en la lista de espera.
   * - Desencola a la persona del frente.
   * - Si es "Veron Maximo": notifica o agrega aviso (lo decide AppContext).
   */
  const handleEntregar = async (isbn: string) => {
    await entregarAlSiguiente(isbn);
  };

  /**
   * Cerrar sesión y volver al Catálogo.
   * Al cerrar sesión, esta pantalla ya no es accesible.
   */
  const handleCerrarSesion = () => {
    cerrarSesion();
    router.replace('/');
  };

  // Mientras redirige (si no hay sesión), no mostrar nada
  if (!sesionActiva) {
    return null;
  }

  // Renderizar cada libro con espera
  const renderItem = ({
    item,
  }: {
    item: { isbn: string; libro: (typeof LIBROS)[number] | undefined; frente: string; esperando: number };
  }) => (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{item.libro?.titulo || 'Libro desconocido'}</Text>
      <Text style={estilos.autor}>{item.libro?.autor || ''}</Text>

      <View style={estilos.divisor} />

      <Text style={estilos.info}>Al frente: {item.frente}</Text>
      <Text style={estilos.info}>Esperando: {item.esperando}</Text>

      <Pressable
        style={estilos.botonEntregar}
        onPress={() => handleEntregar(item.isbn)}
        accessibilityRole="button"
      >
        <Text style={estilos.textoBoton}>Entregar al siguiente</Text>
      </Pressable>
    </View>
  );

  // Estado vacío: no hay libros con lista de espera
  if (librosConEspera.length === 0) {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.textoEstado}>No hay libros con lista de espera</Text>
        <Pressable
          style={estilos.botonCerrarSesion}
          onPress={handleCerrarSesion}
          accessibilityRole="button"
        >
          <Text style={estilos.textoBotonCerrarSesion}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <FlatList
        data={librosConEspera}
        renderItem={renderItem}
        keyExtractor={(item) => item.isbn}
        contentContainerStyle={estilos.lista}
      />

      <Pressable
        style={estilos.botonCerrarSesion}
        onPress={handleCerrarSesion}
        accessibilityRole="button"
      >
        <Text style={estilos.textoBotonCerrarSesion}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  lista: {
    flexGrow: 1,
    padding: espaciado.md,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    padding: espaciado.md,
    marginBottom: espaciado.md,
    borderLeftWidth: 4,
    borderLeftColor: colores.primario,
  },
  titulo: {
    fontSize: tipografia.normal,
    fontWeight: '600',
    color: colores.texto,
    marginBottom: espaciado.xs,
  },
  autor: {
    fontSize: tipografia.chica,
    color: colores.textoSecundario,
    marginBottom: espaciado.sm,
  },
  divisor: {
    height: 1,
    backgroundColor: colores.borde,
    marginVertical: espaciado.sm,
  },
  info: {
    fontSize: tipografia.chica,
    color: colores.textoSecundario,
    marginBottom: espaciado.xs,
  },
  botonEntregar: {
    backgroundColor: colores.exito,
    borderRadius: radios.sm,
    paddingVertical: espaciado.sm,
    marginTop: espaciado.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBoton: {
    color: colores.primarioTexto,
    fontSize: tipografia.chica,
    fontWeight: '600',
  },
  estado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciado.lg,
  },
  textoEstado: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    textAlign: 'center',
    marginBottom: espaciado.lg,
  },
  botonCerrarSesion: {
    backgroundColor: colores.error,
    borderRadius: radios.sm,
    paddingVertical: espaciado.md,
    paddingHorizontal: espaciado.lg,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonCerrarSesion: {
    color: colores.primarioTexto,
    fontSize: tipografia.normal,
    fontWeight: '600',
  },
});
