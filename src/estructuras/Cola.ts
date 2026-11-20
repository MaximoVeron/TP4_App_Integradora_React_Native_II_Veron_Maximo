/**
 * Cola (FIFO: el primero que entra es el primero que sale).
 * La usamos para las listas de espera de cada libro.
 *
 * No usamos `shift()` porque mueve todos los elementos una posición (O(n)).
 * En su lugar guardamos los elementos en un objeto con dos índices:
 * `#inicio` apunta al frente y `#fin` al próximo lugar libre.
 * Encolar y desencolar son O(1).
 */
export class Cola<T> {
  #items: Record<number, T> = {};
  #inicio = 0;
  #fin = 0;

  /** Permite crear una cola nueva a partir de los elementos de otra. */
  constructor(iniciales: T[] = []) {
    iniciales.forEach((elemento) => this.encolar(elemento));
  }

  /** Agrega un elemento al final. */
  encolar(elemento: T): void {
    this.#items[this.#fin] = elemento;
    this.#fin++;
  }

  /** Saca y devuelve el elemento del frente (undefined si está vacía). */
  desencolar(): T | undefined {
    if (this.estaVacia()) {
      return undefined;
    }
    const elemento = this.#items[this.#inicio];
    delete this.#items[this.#inicio];
    this.#inicio++;
    return elemento;
  }

  /** Mira el frente sin sacarlo. */
  verFrente(): T | undefined {
    return this.estaVacia() ? undefined : this.#items[this.#inicio];
  }

  estaVacia(): boolean {
    return this.tamanio === 0;
  }

  get tamanio(): number {
    return this.#fin - this.#inicio;
  }

  /** Copia de los elementos, del frente al final. */
  aArray(): T[] {
    const resultado: T[] = [];
    for (let i = this.#inicio; i < this.#fin; i++) {
      resultado.push(this.#items[i]);
    }
    return resultado;
  }
}
