import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppProvider } from '@/context/AppContext';
import { CANAL_PRESTAMOS } from '@/constants/biblioteca';
import { colores } from '@/constants/tema';

/**
 * Layout raíz de la app.
 * Envuelve todo con el AppProvider y configura notificaciones.
 */
export default function RootLayout() {
  useEffect(() => {
    // Crear canal de notificaciones para Android (prestamos)
    Notifications.setNotificationChannelAsync(CANAL_PRESTAMOS, {
      name: 'Préstamos',
      importance: 5, // HIGH
      lightColor: colores.primario,
    });
  }, []);

  return (
    <AppProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.primario },
          headerTintColor: colores.primarioTexto,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        {/* Pestañas (Catálogo + Mis reservas) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Búsqueda */}
        <Stack.Screen
          name="buscar"
          options={{ title: 'Buscar libro' }}
        />

        {/* Escáner */}
        <Stack.Screen
          name="escanear"
          options={{ title: 'Escanear código', presentation: 'modal' }}
        />

        {/* Reservar */}
        <Stack.Screen
          name="reservar/[isbn]"
          options={{ title: 'Confirmar reserva', presentation: 'modal' }}
        />

        {/* Permisos */}
        <Stack.Screen
          name="permisos/[recurso]"
          options={{ title: 'Permiso necesario', presentation: 'modal' }}
        />

        {/* Login del personal */}
        <Stack.Screen
          name="login"
          options={{ title: 'Ingreso personal', presentation: 'modal' }}
        />

        {/* Mostrador del personal */}
        <Stack.Screen
          name="mostrador"
          options={{ title: 'Mostrador' }}
        />

        {/* Redirect: /reserva → /reservas */}
        <Stack.Screen name="reserva" options={{ headerShown: false }} />

        {/* 404 */}
        <Stack.Screen name="+not-found" options={{ title: 'No encontrado' }} />
      </Stack>
    </AppProvider>
  );
}
