/**
 * Tema visual: todos los colores, tamaños y espaciados de la app viven acá.
 * Así, si mañana cambia el color institucional, se modifica en un solo lugar.
 */

export const colores: Record<string, string> = {
  primario: '#1F6FB2',
  primarioTexto: '#FFFFFF',
  fondo: '#F5F7FA',
  superficie: '#FFFFFF',
  texto: '#1B1F24',
  textoSecundario: '#5B6470',
  borde: '#D9DEE5',
  exito: '#1E7F4F',
  error: '#B3261E',
  aviso: '#FFF4D6',
  avisoTexto: '#6B4E00',
  inactivo: '#9AA3AE',
  camaraFondo: '#000000',
};

export const espaciado = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const tipografia = {
  chica: 13,
  normal: 16,
  subtitulo: 18,
  titulo: 22,
};

export const radios = {
  sm: 6,
  md: 12,
};

/** Área táctil mínima recomendada para accesibilidad (44 × 44). */
export const AREA_TACTIL_MINIMA = 44;

/** Alto del visor de la cámara en el escáner. */
export const ALTO_CAMARA = 320;
