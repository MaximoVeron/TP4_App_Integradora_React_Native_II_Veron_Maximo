import { useEffect, useState } from 'react';
import { obtenerLibros } from '../lib/api';
import type { Libro } from '../types';

/**
 * Hook que carga el catálogo de libros desde la API simulada.
 * Maneja los estados: cargando, error y datos.
 * La función reintentar() permite volver a pedir los libros.
 */
export function useLibros() {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    // Flag para saber si el efecto sigue activo (evita actualizar estado desmontado)
    let activo = true;

    obtenerLibros()
      .then((datos) => {
        if (activo) {
          setLibros(datos);
          setCargando(false);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (activo) {
          setError(err.message);
          setCargando(false);
        }
      });

    // Limpieza: cuando se desmonta o cambia `intento`, marcamos como inactivo
    return () => {
      activo = false;
    };
  }, [intento]);

  // Cambiar el intento dispara el efecto de nuevo
  const reintentar = () => setIntento((i) => i + 1);

  return { libros, cargando, error, reintentar };
}
