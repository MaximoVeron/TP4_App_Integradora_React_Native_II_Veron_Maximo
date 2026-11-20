import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { LIBROS } from '@/data/libros';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';

/**
 * Pantalla de confirmación de reserva.
 * Muestra si habrá préstamo o lista de espera.
 */
export default function Reservar() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const { reservar } = useApp();

  const libro = LIBROS.find((l) => l.isbn === isbn);

  if (!libro) {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.tituloError}>Libro no encontrado</Text>
        <Pressable
          style={estilos.boton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={estilos.textoBoton}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  // Realizar la reserva
  const resultado = reservar(libro);

  // Manejar el resultado
  const handleConfirmar = () => {
    // Navegar a Mis reservas sin poder volver atrás
    router.replace('/(tabs)/reservas');
  };

  let mensaje = '';
  let detalle = '';

  if (resultado.tipo === 'repetida') {
    mensaje = 'Ya reservaste este libro';
    detalle = 'No podés reservar el mismo libro dos veces.';
  } else if (resultado.tipo === 'prestamo') {
    const fecha = new Date(resultado.vence);
    mensaje = '¡Reserva exitosa!';
    detalle = `Tenés tiempo de devolverlo hasta el ${fecha.toLocaleDateString('es-AR')}.`;
  } else if (resultado.tipo === 'espera') {
    mensaje = 'Agregado a la lista de espera';
    detalle = `Tu posición es: ${resultado.posicion}`;
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>{libro.autor}</Text>

        <View style={estilos.divisor} />

        <Text style={estilos.mensaje}>{mensaje}</Text>
        <Text style={estilos.detalle}>{detalle}</Text>
      </View>

      <Pressable
        style={estilos.botonPrincipal}
        onPress={handleConfirmar}
        accessibilityRole="button"
      >
        <Text style={estilos.textoBotonPrincipal}>Ver mis reservas</Text>
      </Pressable>

      <Pressable
        style={estilos.botonSecundario}
        onPress={() => router.back()}
        accessibilityRole="button"
      >
        <Text style={estilos.textoBotonSecundario}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    padding: espaciado.lg,
    backgroundColor: colores.fondo,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    padding: espaciado.lg,
    marginBottom: espaciado.lg,
  },
  titulo: {
    fontSize: tipografia.titulo,
    fontWeight: '700',
    color: colores.texto,
    marginBottom: espaciado.sm,
  },
  autor: {
    fontSize: tipografia.subtitulo,
    color: colores.textoSecundario,
    marginBottom: espaciado.md,
  },
  divisor: {
    height: 1,
    backgroundColor: colores.borde,
    marginVertical: espaciado.md,
  },
  mensaje: {
    fontSize: tipografia.subtitulo,
    fontWeight: '600',
    color: colores.primario,
    marginBottom: espaciado.sm,
    textAlign: 'center',
  },
  detalle: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
  botonPrincipal: {
    backgroundColor: colores.primario,
    borderRadius: radios.sm,
    paddingVertical: espaciado.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: espaciado.md,
  },
  textoBotonPrincipal: {
    color: colores.primarioTexto,
    fontSize: tipografia.normal,
    fontWeight: '600',
  },
  botonSecundario: {
    borderRadius: radios.sm,
    paddingVertical: espaciado.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonSecundario: {
    color: colores.textoSecundario,
    fontSize: tipografia.normal,
  },
  estado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciado.lg,
  },
  tituloError: {
    fontSize: tipografia.subtitulo,
    fontWeight: '600',
    color: colores.error,
    marginBottom: espaciado.md,
  },
  boton: {
    backgroundColor: colores.primario,
    borderRadius: radios.sm,
    paddingVertical: espaciado.md,
    paddingHorizontal: espaciado.lg,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBoton: {
    color: colores.primarioTexto,
    fontSize: tipografia.normal,
    fontWeight: '600',
  },
});
