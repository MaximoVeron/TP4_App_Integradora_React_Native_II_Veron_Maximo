import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '@/constants/tema';

/**
 * Layout de pestañas: Catálogo y Mis reservas.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: String(colores.primario),
        tabBarInactiveTintColor: String(colores.inactivo),
        tabBarStyle: {
          backgroundColor: String(colores.superficie),
          borderTopColor: String(colores.borde),
        },
        headerStyle: { backgroundColor: String(colores.primario) },
        headerTintColor: String(colores.primarioTexto),
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={String(color ?? colores.inactivo)} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmarks" size={size} color={String(color ?? colores.inactivo)} />
          ),
        }}
      />
    </Tabs>
  );
}
