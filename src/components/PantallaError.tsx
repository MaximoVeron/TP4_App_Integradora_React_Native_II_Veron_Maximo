import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, espaciado, tipografia, radios } from '@/constants/tema';

/**
 * Pantalla de error con botón para reintentar o volver.
 */
export function PantallaError({
  mensaje,
  onAccion,
  textoAccion = 'Reintentar',
}: {
  mensaje: string;
  onAccion: () => void;
  textoAccion?: string;
}) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>{mensaje}</Text>
      <Pressable
        style={estilos.boton}
        onPress={onAccion}
        accessibilityRole="button"
        accessibilityLabel={textoAccion}
      >
        <Text style={estilos.textoBoton}>{textoAccion}</Text>
      </Pressable>
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
    color: colores.error,
    textAlign: 'center',
    marginBottom: espaciado.md,
  },
  boton: {
    backgroundColor: colores.primario,
    paddingHorizontal: espaciado.lg,
    paddingVertical: espaciado.md,
    borderRadius: radios.sm,
    minWidth: 44,
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
