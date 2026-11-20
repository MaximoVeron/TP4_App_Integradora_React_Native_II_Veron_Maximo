import { StyleSheet, Text, View } from 'react-native';
import { colores, espaciado, tipografia } from '@/constants/tema';

/**
 * Pantalla de carga con mensaje.
 * Se muestra mientras se obtienen datos.
 */
export function PantallaCarga({ mensaje = 'Cargando...' }: { mensaje?: string }) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciado.lg,
  },
  texto: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
  },
});
