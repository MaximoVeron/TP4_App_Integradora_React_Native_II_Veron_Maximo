import { Pressable, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import type { Libro } from '@/types';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';

/**
 * Tarjeta con resumen de un libro, usada en listas.
 * Muestra título, autor y año. Presionable para ir al detalle.
 */
export function TarjetaLibro({ libro }: { libro: Libro }) {
  return (
    <Link href={`/libro/${libro.isbn}`} asChild>
      <Pressable
        style={estilos.tarjeta}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalle de ${libro.titulo}`}
      >
        <Text style={estilos.titulo} numberOfLines={2}>
          {libro.titulo}
        </Text>
        <Text style={estilos.autor} numberOfLines={1}>
          {libro.autor}
        </Text>
        <Text style={estilos.anio}>{libro.anio}</Text>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    padding: espaciado.md,
    marginHorizontal: espaciado.md,
    marginVertical: espaciado.xs,
    borderLeftWidth: 4,
    borderLeftColor: colores.primario,
    minHeight: 44,
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
    marginBottom: espaciado.xs,
  },
  anio: {
    fontSize: tipografia.chica,
    color: colores.inactivo,
  },
});
