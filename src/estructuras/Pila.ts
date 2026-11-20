/**
 * Pila (LIFO: el último que entra es el primero que sale).
 * La usamos para "Vistos recientemente": el tope es el libro más reciente.
 *
 * `#items` es un campo privado de JavaScript: desde afuera de la clase
 * no se puede tocar el array, solo usar los métodos.
 */
export class Pila<T> {
  #items: T[];

  /** Permite crear una pila nueva a partir de los elementos de otra. */
  constructor(iniciales: T[] = []) {
    this.#items = [...iniciales];
  }

  /** Agrega un elemento en el tope. */
  apilar(elemento: T): void {
    this.#items.push(elemento);
  }

  /** Saca y devuelve el elemento del tope (undefined si está vacía). */
  desapilar(): T | undefined {
    return this.#items.pop();
  }

  /** Mira el tope sin sacarlo. */
  verTope(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  estaVacia(): boolean {
    return this.#items.length === 0;
  }

  get tamanio(): number {
    return this.#items.length;
  }

  /** Copia de los elementos, de la base al tope. */
  aArray(): T[] {
    return [...this.#items];
  }
}
