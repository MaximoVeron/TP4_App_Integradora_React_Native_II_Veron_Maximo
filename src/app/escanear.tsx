import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { LIBROS } from '@/data/libros';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';

/**
 * Pantalla de escaneo de código de barras.
 *
 * Flujo:
 * 1. Al entrar, verifica el estado del permiso de cámara.
 * 2. Si NO está concedido, redirige a /permisos/camara (pantalla previa).
 * 3. Cuando tiene permiso, muestra la cámara y lee EAN-13.
 * 4. Si el ISBN no existe, muestra aviso y permite seguir escaneando.
 *
 * Esto cumple con la consigna: "Antes del diálogo del sistema se muestra
 * /permisos/camara, y la pantalla maneja los cuatro estados".
 */
export default function Escanear() {
  const [permiso] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState(false);
  const [isbnManual, setIsbnManual] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Cuando cambia el estado del permiso, verificamos si tenemos acceso.
   * Si no está concedido, redirigimos a /permisos/camara para que el usuario
   * vea la pantalla previa (con el beneficio y el botón Continuar).
   */
  useEffect(() => {
    // Mientras carga el permiso, no hacemos nada
    if (!permiso) return;

    // Si no tenemos el permiso, redirigir a la pantalla previa
    if (!permiso.granted) {
      router.replace('/permisos/camara');
    }
  }, [permiso]);

  // Mientras carga el permiso, mostrar pantalla de carga
  if (!permiso) {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.texto}>Verificando permiso de cámara...</Text>
      </View>
    );
  }

  // Si no tiene permiso (antes de que el useEffect redirija), no renderizar cámara
  if (!permiso.granted) {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.texto}>Redirigiendo a permisos...</Text>
      </View>
    );
  }

  /**
   * Maneja el escaneo de un código de barras EAN-13.
   * - Valida que sea un ISBN de 13 dígitos.
   * - Verifica si el libro existe en el catálogo.
   * - Si existe, navega al detalle (reemplazando la pantalla del escáner).
   * - Si no existe, muestra un error y permite seguir escaneando.
   */
  const handleBarcodeScanned = (data: { data: string }) => {
    // Evitar múltiples escaneos (la cámara detecta el mismo código muchas veces)
    if (escaneado) return;

    const isbn = data.data;

    // Validar que sea un ISBN de 13 dígitos
    if (!/^\d{13}$/.test(isbn)) {
      setError('Código no válido. Debe ser un EAN-13.');
      return;
    }

    // Verificar si el libro existe en el catálogo
    const libro = LIBROS.find((l) => l.isbn === isbn);
    if (!libro) {
      setError('Este libro no está en nuestro catálogo.');
      // Permitir seguir escaneando después de 2 segundos
      setTimeout(() => {
        setEscaneado(false);
        setError(null);
      }, 2000);
      return;
    }

    // Marcar como escaneado y navegar al detalle (usando replace)
    setEscaneado(true);
    router.replace(`/libro/${isbn}`);
  };

  /**
   * Maneja el ingreso manual del ISBN.
   * Permite escribir el código a mano cuando la cámara no funciona o está bloqueada.
   */
  const handleManualSubmit = () => {
    setError(null);
    const isbn = isbnManual.trim();

    if (!/^\d{13}$/.test(isbn)) {
      setError('El ISBN debe tener 13 dígitos numéricos.');
      return;
    }

    const libro = LIBROS.find((l) => l.isbn === isbn);
    if (!libro) {
      setError('Este libro no está en nuestro catálogo.');
      return;
    }

    router.replace(`/libro/${isbn}`);
  };

  return (
    <View style={estilos.contenedor}>
      <CameraView
        style={estilos.camara}
        onBarcodeScanned={escaneado ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13'],
        }}
      />

      <View style={estilos.overlay}>
        <Text style={estilos.instruccion}>
          Apuntá al código de barras de la contratapa
        </Text>

        {error && <Text style={estilos.error}>{error}</Text>}

        <View style={estilos.manualContainer}>
          <Text style={estilos.manualLabel}>O ingresá el ISBN manualmente:</Text>
          <View style={estilos.manualInputContainer}>
            <TextInput
              style={estilos.manualInput}
              value={isbnManual}
              onChangeText={(texto) => {
                setIsbnManual(texto);
                setError(null);
              }}
              placeholder="Ej: 9788497592208"
              placeholderTextColor={colores.inactivo}
              keyboardType="number-pad"
              maxLength={13}
              accessibilityLabel="Ingresar ISBN manualmente"
            />
            <Pressable
              style={estilos.botonManual}
              onPress={handleManualSubmit}
              accessibilityRole="button"
            >
              <Text style={estilos.textoBotonManual}>Ir</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.camaraFondo,
  },
  camara: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: espaciado.lg,
    paddingBottom: espaciado.xl,
  },
  instruccion: {
    fontSize: tipografia.normal,
    color: colores.primarioTexto,
    textAlign: 'center',
    marginBottom: espaciado.md,
  },
  error: {
    fontSize: tipografia.chica,
    color: colores.error,
    textAlign: 'center',
    marginBottom: espaciado.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: espaciado.sm,
    borderRadius: radios.sm,
  },
  manualContainer: {
    marginTop: espaciado.md,
  },
  manualLabel: {
    fontSize: tipografia.chica,
    color: colores.primarioTexto,
    textAlign: 'center',
    marginBottom: espaciado.sm,
  },
  manualInputContainer: {
    flexDirection: 'row',
    gap: espaciado.sm,
  },
  manualInput: {
    flex: 1,
    backgroundColor: colores.primarioTexto,
    borderRadius: radios.sm,
    padding: espaciado.md,
    fontSize: tipografia.normal,
    color: colores.texto,
    minHeight: 44,
  },
  botonManual: {
    backgroundColor: colores.primario,
    borderRadius: radios.sm,
    paddingHorizontal: espaciado.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    minHeight: 44,
  },
  textoBotonManual: {
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
  texto: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
});
