import type { Libro } from '../types';

/**
 * Catálogo de la biblioteca (datos locales).
 * Los dos primeros son los libros "a mano" para probar el escáner:
 * reemplazá su ISBN por el que figura en la contratapa de tus libros reales.
 * Algunos tienen 0 ejemplares para probar la lista de espera.
 */
export const LIBROS: Libro[] = [
  { isbn: '9788497592208', titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', anio: 1967, ejemplares: 2 },
  { isbn: '9788478887194', titulo: 'El principito', autor: 'Antoine de Saint-Exupéry', anio: 1943, ejemplares: 1 },
  { isbn: '9788499089508', titulo: 'Ficciones', autor: 'Jorge Luis Borges', anio: 1944, ejemplares: 0 },
  { isbn: '9788499089515', titulo: 'El Aleph', autor: 'Jorge Luis Borges', anio: 1949, ejemplares: 1 },
  { isbn: '9789875666474', titulo: 'El libro de arena', autor: 'Jorge Luis Borges', anio: 1975, ejemplares: 0 },
  { isbn: '9789500725361', titulo: 'Rayuela', autor: 'Julio Cortázar', anio: 1963, ejemplares: 2 },
  { isbn: '9788499890944', titulo: '1984', autor: 'George Orwell', anio: 1949, ejemplares: 0 },
  { isbn: '9788420412146', titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', anio: 1605, ejemplares: 3 },
  { isbn: '9780132350884', titulo: 'Clean Code', autor: 'Robert C. Martin', anio: 2008, ejemplares: 2 },
  { isbn: '9780134494166', titulo: 'Clean Architecture', autor: 'Robert C. Martin', anio: 2017, ejemplares: 1 },
  { isbn: '9780135957059', titulo: 'The Pragmatic Programmer', autor: 'David Thomas y Andrew Hunt', anio: 2019, ejemplares: 1 },
  { isbn: '9780201633610', titulo: 'Design Patterns', autor: 'Erich Gamma y otros', anio: 1994, ejemplares: 0 },
  { isbn: '9780134757599', titulo: 'Refactoring', autor: 'Martin Fowler', anio: 2018, ejemplares: 1 },
  { isbn: '9781593279509', titulo: 'Eloquent JavaScript', autor: 'Marijn Haverbeke', anio: 2018, ejemplares: 2 },
  { isbn: '9780262033848', titulo: 'Introduction to Algorithms', autor: 'Thomas H. Cormen y otros', anio: 2009, ejemplares: 1 },
  { isbn: '9781492053743', titulo: 'Effective TypeScript', autor: 'Dan Vanderkam', anio: 2019, ejemplares: 1 },
  { isbn: '9781492051725', titulo: 'Learning React', autor: 'Alex Banks y Eve Porcello', anio: 2020, ejemplares: 2 },
];

/**
 * Listas de espera con las que arranca la app (ISBN → personas en orden).
 * Se guardan aparte porque el tipo `Libro` es fijo y no tiene ese campo.
 */
export const ESPERAS_INICIALES: Record<string, string[]> = {
  '9788499089508': ['Lucía Gómez', 'Martín Ríos'],
  '9788499890944': ['Sofía Benítez'],
};
