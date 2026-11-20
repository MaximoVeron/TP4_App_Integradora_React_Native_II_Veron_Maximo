import { Redirect } from 'expo-router';

/**
 * Redirect: /reserva → /reservas (URL vieja de la versión anterior).
 */
export default function ReservaRedirect() {
  return <Redirect href="/(tabs)/reservas" />;
}
