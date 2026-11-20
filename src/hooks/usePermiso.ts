import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useCameraPermissions } from 'expo-camera';
import type { EstadoPermiso, Recurso } from '../types';

/**
 * Hook para manejar los permisos de cámara y notificaciones.
 * Devuelve el estado actual del permiso y funciones para solicitarlo.
 * 
 * Estados posibles:
 * - cargando: todavía no sabemos el estado
 * - concedido: el usuario aceptó
 * - preguntable: podemos mostrar el diálogo del sistema
 * - bloqueado: ya no se puede pedir, hay que ir a Ajustes
 */
export function usePermiso(recurso: Recurso) {
  const [estado, setEstado] = useState<EstadoPermiso>('cargando');

  // Hook de expo-camera para cámara
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();

  // Cargar el estado inicial del permiso
  useEffect(() => {
    let activo = true;

    const cargarEstado = async () => {
      if (recurso === 'camara') {
        if (!permisoCamara) {
          setEstado('cargando');
          return;
        }
        if (permisoCamara.granted) {
          setEstado('concedido');
        } else if (permisoCamara.canAskAgain) {
          setEstado('preguntable');
        } else {
          setEstado('bloqueado');
        }
      } else if (recurso === 'notificaciones') {
        const { status } = await Notifications.getPermissionsAsync();
        if (!activo) return;
        
        if (status === 'granted') {
          setEstado('concedido');
        } else if (status === 'undetermined') {
          setEstado('preguntable');
        } else {
          // denied
          setEstado('bloqueado');
        }
      }
    };

    cargarEstado();
    return () => { activo = false; };
  }, [recurso, permisoCamara]);

  // Solicitar el permiso
  const solicitar = async () => {
    if (recurso === 'camara') {
      const { status } = await pedirPermisoCamara();
      if (status === 'granted') {
        setEstado('concedido');
      } else {
        // Después de pedir, verificar si podemos volver a preguntar
        if (permisoCamara?.canAskAgain) {
          setEstado('preguntable');
        } else {
          setEstado('bloqueado');
        }
      }
    } else if (recurso === 'notificaciones') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setEstado('concedido');
      } else if (status === 'undetermined') {
        setEstado('preguntable');
      } else {
        setEstado('bloqueado');
      }
    }
  };

  return { estado, solicitar };
}
