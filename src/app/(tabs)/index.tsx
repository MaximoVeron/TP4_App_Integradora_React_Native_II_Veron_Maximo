import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLibros } from '@/hooks/useLibros';
import { useApp } from '@/context/AppContext';
import { TarjetaLibro } from '@/components/TarjetaLibro';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';
import type { Libro } from '@/types';

/**
 * Pantalla del Catálogo.
 * Muestra: Barra de búsqueda, Vistos recientemente (los 3 últimos), lista de libros con estados.
 */
export default function Catalogo() {
  const { libros, cargando, error, reintentar } = useLibros();
  const { recientes } = useApp();

  /**
   * Navegar a la pantalla de búsqueda.
   * Se llama al tocar la barra de búsqueda.
   */
  const handleBuscar = () => {
    router.push('/buscar');
  };

  // Renderizar barra de búsqueda
  const renderBarraBusqueda = () => {
    return (
      <Pressable
        style={estilos.barraBusqueda}
        onPress={handleBuscar}
        accessibilityRole="button"
        accessibilityLabel="Buscar libros por título o autor"
      >
        <Ionicons name="search" size={20} color={colores.textoSecundario} />
        <Text style={estilos.placeholderBusqueda}>Buscar por título o autor</Text>
      </Pressable>
    );
  };

  // Renderizar sección "Vistos recientemente"
  const renderRecientes = () => {
    if (recientes.length === 0) return null;

    return (
      <View style={estilos.seccionRecientes}>
        <Text style={estilos.tituloSeccion}>Vistos recientemente</Text>
        <View style={estilos.contenedorRecientes}>
          {recientes.map((libro) => (
            <Link key={libro.isbn} href={`/libro/${libro.isbn}`} asChild>
              <Pressable
                style={estilos.tarjetaReciente}
                accessibilityRole="button"
                accessibilityLabel={`Ver ${libro.titulo}`}
              >
                <Text style={estilos.tituloReciente} numberOfLines={2}>
                  {libro.titulo}
                </Text>
                <Text style={estilos.autorReciente} numberOfLines={1}>
                  {libro.autor}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    );
  };

  // Renderizar cada libro en la lista
  const renderItem = ({ item }: { item: Libro }) => <TarjetaLibro libro={item} />;

  // Estado de carga
  if (cargando) {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.textoEstado}>Cargando catálogo...</Text>
      </View>
    );
  }

  // Estado de error
  if (error) {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.textoError}>{error}</Text>
        <Pressable
          style={estilos.botonReintentar}
          onPress={reintentar}
          accessibilityRole="button"
          accessibilityLabel="Reintentar cargar catálogo"
        >
          <Text style={estilos.textoBoton}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  // Estado vacío
  if (libros.length === 0) {
    return (
      <View style={estilos.estado}>
        <Text style={estilos.textoEstado}>No hay libros en el catálogo</Text>
      </View>
    );
  }

  // Lista de libros
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={estilos.headerBotones}>
              <Pressable
                style={estilos.botonHeader}
                onPress={handleBuscar}
                accessibilityRole="button"
                accessibilityLabel="Buscar libros"
              >
                <Ionicons name="search" size={24} color={colores.primarioTexto} />
              </Pressable>
              <Link href="/escanear" asChild>
                <Pressable
                  style={estilos.botonHeader}
                  accessibilityRole="button"
                  accessibilityLabel="Escanear código de barras"
                >
                  <Ionicons name="barcode" size={24} color={colores.primarioTexto} />
                </Pressable>
              </Link>
              <Link href="/login" asChild>
                <Pressable
                  style={estilos.botonHeader}
                  accessibilityRole="button"
                  accessibilityLabel="Ingreso personal"
                >
                  <Ionicons name="person-circle" size={28} color={colores.primarioTexto} />
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
      <FlatList
        data={libros}
        renderItem={renderItem}
        keyExtractor={(item) => item.isbn}
        ListHeaderComponent={
          <>
            {renderBarraBusqueda()}
            {renderRecientes()}
          </>
        }
        ListEmptyComponent={
          <View style={estilos.estado}>
            <Text style={estilos.textoEstado}>No hay libros disponibles</Text>
          </View>
        }
        contentContainerStyle={estilos.lista}
      />
    </>
  );
}

const estilos = StyleSheet.create({
  lista: {
    paddingBottom: espaciado.md,
  },
  barraBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    padding: espaciado.md,
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  placeholderBusqueda: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    marginLeft: espaciado.sm,
    flex: 1,
  },
  seccionRecientes: {
    marginBottom: espaciado.md,
  },
  tituloSeccion: {
    fontSize: tipografia.subtitulo,
    fontWeight: '600',
    color: colores.texto,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
  },
  contenedorRecientes: {
    flexDirection: 'row',
    paddingHorizontal: espaciado.md,
    gap: espaciado.sm,
  },
  tarjetaReciente: {
    flex: 1,
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    padding: espaciado.sm,
    borderLeftWidth: 3,
    borderLeftColor: colores.primario,
    minHeight: 44,
  },
  tituloReciente: {
    fontSize: tipografia.chica,
    fontWeight: '600',
    color: colores.texto,
    marginBottom: 2,
  },
  autorReciente: {
    fontSize: 12,
    color: colores.textoSecundario,
  },
  estado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciado.lg,
  },
  textoEstado: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
  textoError: {
    fontSize: tipografia.normal,
    color: colores.error,
    textAlign: 'center',
    marginBottom: espaciado.md,
  },
  botonReintentar: {
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
  botonPersonal: {
    marginRight: espaciado.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBotones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.xs,
  },
  botonHeader: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espaciado.xs,
  },
});
