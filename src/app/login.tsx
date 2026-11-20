import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';

/**
 * Pantalla de login del personal de biblioteca.
 *
 * Protección:
 * - Si ya hay sesión activa, redirige automáticamente a /mostrador.
 * - Credenciales fijas: biblioteca / ipf2026
 *
 * Al iniciar sesión exitosamente:
 * - Se cierra el modal automáticamente (router.back()).
 * - El usuario puede acceder a /mostrador.
 */
export default function Login() {
  const { sesionActiva, iniciarSesion } = useApp();
  
  // Estado local para los campos del formulario
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión activa, redirigir al mostrador
  useEffect(() => {
    if (sesionActiva) {
      router.replace('/mostrador');
    }
  }, [sesionActiva]);

  /**
   * Manejar el inicio de sesión.
   * - Valida las credenciales.
   * - Si son correctas: inicia sesión y cierra el modal.
   * - Si son incorrectas: muestra mensaje de error.
   */
  const handleLogin = () => {
    setError(null);
    const exito = iniciarSesion(usuario, clave);
    if (exito) {
      // Cerrar el modal automáticamente
      router.back();
    } else {
      setError('Usuario o clave incorrectos');
    }
  };

  // Mientras redirige (si ya hay sesión), no mostrar nada
  if (sesionActiva) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.inner}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo}>Ingreso del personal</Text>

          <View style={estilos.campo}>
            <Text style={estilos.label}>Usuario</Text>
            <TextInput
              style={estilos.input}
              value={usuario}
              onChangeText={setUsuario}
              placeholder="Usuario"
              placeholderTextColor={colores.inactivo}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
              accessibilityLabel="Nombre de usuario"
            />
          </View>

          <View style={estilos.campo}>
            <Text style={estilos.label}>Clave</Text>
            <TextInput
              style={estilos.input}
              value={clave}
              onChangeText={setClave}
              placeholder="Clave"
              placeholderTextColor={colores.inactivo}
              secureTextEntry
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Contraseña"
            />
          </View>

          {error && <Text style={estilos.error}>{error}</Text>}
        </View>

        <Pressable
          style={estilos.boton}
          onPress={handleLogin}
          accessibilityRole="button"
        >
          <Text style={estilos.textoBoton}>Ingresar</Text>
        </Pressable>

        <Pressable
          style={estilos.botonCancelar}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={estilos.textoCancelar}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: espaciado.lg,
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
    marginBottom: espaciado.lg,
    textAlign: 'center',
  },
  campo: {
    marginBottom: espaciado.md,
  },
  label: {
    fontSize: tipografia.chica,
    fontWeight: '600',
    color: colores.textoSecundario,
    marginBottom: espaciado.xs,
  },
  input: {
    backgroundColor: colores.fondo,
    borderRadius: radios.sm,
    padding: espaciado.md,
    fontSize: tipografia.normal,
    color: colores.texto,
    minHeight: 44,
  },
  error: {
    fontSize: tipografia.chica,
    color: colores.error,
    marginTop: espaciado.sm,
    textAlign: 'center',
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
});
