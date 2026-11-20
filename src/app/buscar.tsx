import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { buscarLibros } from '@/lib/api';
import { TarjetaLibro } from '@/components/TarjetaLibro';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';
import { MS_DEBOUNCE_BUSQUEDA } from '@/constants/biblioteca';
import type { Libro } from '@/types';

/**
 * Pantalla de búsqueda.
 * Lee el parámetro q de la URL, usa debounce y muestra resultados.
 */
export default function Buscar() {
  const params = useLocalSearchParams<{ q?: string }>();
  const router = useRouter();
  const [texto, setTexto] = useState(params.q || '');
  const [resultados, setResultados] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(false);

  // Efecto con debounce para buscar
  useEffect(() => {
    // Limpiar timeout anterior
    const timeoutId = setTimeout(() => {
      if (!texto.trim()) {
        setResultados([]);
        setCargando(false);
        return;
      }

      let activo = true;
      setCargando(true);

      buscarLibros(texto)
        .then((datos) => {
          if (activo) {
            setResultados(datos);
            setCargando(false);
          }
        })
        .catch(() => {
          if (activo) {
            setResultados([]);
            setCargando(false);
          }
        });

      return () => {
        activo = false;
      };
    }, MS_DEBOUNCE_BUSQUEDA);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [texto]);

  // Actualizar la URL cuando cambia el texto
  const handleChangeText = (nuevoTexto: string) => {
    setTexto(nuevoTexto);
    // Actualizar el parámetro q en la URL sin apilar pantallas
    router.setParams({ q: nuevoTexto || undefined });
  };

  // Renderizar cada resultado
  const renderItem = ({ item }: { item: Libro }) => <TarjetaLibro libro={item} />;

  // Componente para lista vacía
  const ListEmptyComponent = () => {
    if (cargando) {
      return (
        <View style={estilos.estado}>
          <Text style={estilos.textoEstado}>Buscando...</Text>
        </View>
      );
    }
    if (texto.trim() && resultados.length === 0) {
      return (
        <View style={estilos.estado}>
          <Text style={estilos.textoEstado}>
            No se encontraron libros para &ldquo;{texto}&rdquo;
          </Text>
        </View>
      );
    }
    return (
      <View style={estilos.estado}>
        <Text style={estilos.textoEstado}>
          Escribí un título o autor para buscar
        </Text>
      </View>
    );
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.inputContainer}>
        <TextInput
          style={estilos.input}
          value={texto}
          onChangeText={handleChangeText}
          placeholder="Buscar por título o autor"
          placeholderTextColor={colores.inactivo}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Buscar libros por título o autor"
        />
      </View>

      <FlatList
        data={resultados}
        renderItem={renderItem}
        keyExtractor={(item) => item.isbn}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={estilos.lista}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  inputContainer: {
    padding: espaciado.md,
    backgroundColor: colores.superficie,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  input: {
    backgroundColor: colores.fondo,
    borderRadius: radios.sm,
    padding: espaciado.md,
    fontSize: tipografia.normal,
    color: colores.texto,
    minHeight: 44,
  },
  lista: {
    flexGrow: 1,
    paddingVertical: espaciado.md,
  },
  estado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciado.lg,
    minHeight: 200,
  },
  textoEstado: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
});
