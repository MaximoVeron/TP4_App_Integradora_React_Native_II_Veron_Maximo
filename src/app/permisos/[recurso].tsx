import { Pressable, StyleSheet, Text, View, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { usePermiso } from '@/hooks/usePermiso';
import { TEXTOS_PERMISO } from '@/constants/biblioteca';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';
import type { Recurso } from '@/types';

/**
 * Pantalla previa a cada permiso.
 * Muestra el beneficio y un botón para continuar o abrir Ajustes.
 */
export default function Permiso() {
  const { recurso } = useLocalSearchParams<{ recurso: string }>();
  const tipo = (recurso || 'camara') as Recurso;
  const { estado, solicitar } = usePermiso(tipo);
  const textos = TEXTOS_PERMISO[tipo];

  // Si ya está concedido, volver
  if (estado === 'concedido') {
    router.back();
    return null;
  }

  // Si está cargando
  if (estado === 'cargando') {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.texto}>Verificando permiso...</Text>
      </View>
    );
  }

  // Manejar el botón principal
  const handleContinuar = async () => {
    if (estado === 'bloqueado') {
      // Abrir Ajustes del sistema
      await Linking.openSettings();
    } else {
      // Solicitar el permiso
      await solicitar();
    }
  };

  const textoBoton = estado === 'bloqueado' ? 'Abrir Ajustes' : 'Continuar';

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>{textos.titulo}</Text>
        <Text style={estilos.beneficio}>{textos.beneficio}</Text>
      </View>

      <Pressable
        style={estilos.boton}
        onPress={handleContinuar}
        accessibilityRole="button"
        accessibilityLabel={textoBoton}
      >
        <Text style={estilos.textoBoton}>{textoBoton}</Text>
      </Pressable>

      <Pressable
        style={estilos.botonCancelar}
        onPress={() => router.back()}
        accessibilityRole="button"
      >
        <Text style={estilos.textoCancelar}>Cancelar</Text>
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
    marginBottom: espaciado.md,
    textAlign: 'center',
  },
  beneficio: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    textAlign: 'center',
    lineHeight: 24,
  },
  boton: {
    backgroundColor: colores.primario,
    borderRadius: radios.sm,
    paddingVertical: espaciado.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: espaciado.md,
  },
  textoBoton: {
    color: colores.primarioTexto,
    fontSize: tipografia.normal,
    fontWeight: '600',
  },
  botonCancelar: {
    borderRadius: radios.sm,
    paddingVertical: espaciado.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCancelar: {
    color: colores.textoSecundario,
    fontSize: tipografia.normal,
  },
  estado: {
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
