import { Link, Stack, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';

/**
 * Pantalla 404: muestra la URL inexistente y un link al catálogo.
 */
export default function NotFoundScreen() {
  const pathname = usePathname();

  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Página no encontrada</Text>
        <Text style={estilos.texto}>
          La URL <Text style={estilos.url}>{pathname}</Text> no existe en la app.
        </Text>
        <Link href="/" asChild>
          <Pressable style={estilos.boton} accessibilityRole="button">
            <Text style={estilos.textoBoton}>Ir al catálogo</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciado.lg,
    backgroundColor: colores.fondo,
  },
  titulo: {
    fontSize: tipografia.titulo,
    fontWeight: '700',
    color: colores.texto,
    marginBottom: espaciado.md,
  },
  texto: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    textAlign: 'center',
    marginBottom: espaciado.lg,
    lineHeight: 22,
  },
  url: {
    fontFamily: 'monospace',
    color: colores.error,
    fontWeight: '600',
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
