import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, Link, Stack } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { LIBROS } from '@/data/libros';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';

/**
 * Pantalla de detalle de un libro.
 * Valida que el ISBN tenga 13 dígitos y que el libro exista.
 */
export default function DetalleLibro() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const { agregarReciente, posicionEnEspera, prestamos } = useApp();

  // Buscar el libro
  const libro = LIBROS.find((l) => l.isbn === isbn);

  // Agregar a recientes cuando se monta
  useEffect(() => {
    if (libro) {
      agregarReciente(libro);
    }
  }, [libro, agregarReciente]);

  // Validar ISBN (debe tener 13 dígitos)
  const isbnValido = /^\d{13}$/.test(isbn || '');

  // ISBN inválido
  if (!isbnValido) {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.tituloError}>ISBN inválido</Text>
        <Text style={estilos.textoError}>
          El código del libro debe tener 13 dígitos numéricos.
        </Text>
        <Link href="/" asChild>
          <Pressable style={estilos.boton} accessibilityRole="button">
            <Text style={estilos.textoBoton}>Volver al catálogo</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  // Libro no encontrado
  if (!libro) {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.tituloError}>Libro no encontrado</Text>
        <Text style={estilos.textoError}>
          No existe un libro con ISBN {isbn} en nuestro catálogo.
        </Text>
        <Link href="/" asChild>
          <Pressable style={estilos.boton} accessibilityRole="button">
            <Text style={estilos.textoBoton}>Volver al catálogo</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  // Verificar si ya está reservado
  const yaReservado = prestamos.some((p) => p.isbn === isbn);
  const enEspera = posicionEnEspera(isbn) > 0;

  return (
    <>
      <Stack.Screen options={{ title: libro.titulo }} />
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo}>{libro.titulo}</Text>
          <Text style={estilos.autor}>{libro.autor}</Text>
          <Text style={estilos.anio}>Año: {libro.anio}</Text>
          <Text style={estilos.isbn}>ISBN: {libro.isbn}</Text>

          <View style={estilos.divisor} />

          <Text style={estilos.info}>
            Ejemplares disponibles: {libro.ejemplares}
          </Text>

          {enEspera && (
            <Text style={estilos.espera}>
              Posición en lista de espera: {posicionEnEspera(isbn)}
            </Text>
          )}

          {yaReservado && (
            <Text style={estilos.yaReservado}>Ya reservaste este libro</Text>
          )}
        </View>

        {!yaReservado && !enEspera && (
          <Link href={`/reservar/${isbn}`} asChild>
            <Pressable style={estilos.botonReservar} accessibilityRole="button">
              <Text style={estilos.textoBotonReservar}>Reservar</Text>
            </Pressable>
          </Link>
        )}
      </ScrollView>
    </>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    flexGrow: 1,
    padding: espaciado.md,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    padding: espaciado.lg,
    marginBottom: espaciado.md,
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
  anio: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    marginBottom: espaciado.xs,
  },
  isbn: {
    fontSize: tipografia.chica,
    color: colores.inactivo,
    marginBottom: espaciado.md,
  },
  divisor: {
    height: 1,
    backgroundColor: colores.borde,
    marginVertical: espaciado.md,
  },
  info: {
    fontSize: tipografia.normal,
    color: colores.texto,
    marginBottom: espaciado.sm,
  },
  espera: {
    fontSize: tipografia.normal,
    color: colores.avisoTexto,
    fontWeight: '600',
    marginTop: espaciado.sm,
  },
  yaReservado: {
    fontSize: tipografia.normal,
    color: colores.exito,
    fontWeight: '600',
    marginTop: espaciado.sm,
  },
  botonReservar: {
    backgroundColor: colores.primario,
    borderRadius: radios.sm,
    paddingVertical: espaciado.md,
    paddingHorizontal: espaciado.lg,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonReservar: {
    color: colores.primarioTexto,
    fontSize: tipografia.normal,
    fontWeight: '600',
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
    marginBottom: espaciado.sm,
    textAlign: 'center',
  },
  textoError: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    textAlign: 'center',
    marginBottom: espaciado.lg,
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
