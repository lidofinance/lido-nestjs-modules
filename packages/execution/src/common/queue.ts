export class Queue<T> {
  private _store: T[] = [];

  public enqueue(val: T) {
    this._store.push(val);
  }

  public dequeue(): T | undefined {
    return this._store.shift();
  }

  public get length() {
    return this._store.length;
  }

  public clear() {
    this._store = [];
  }

  public dequeueMultiple(batch: number): T[] {
    batch = (batch | 0) > 0 ? batch | 0 : 1;

    const buffer = [];

    for (let i = 0; i < batch; i++) {
      const value = this.dequeue();
      if (typeof value === 'undefined') {
        break;
      }
      buffer.push(value);
    }

    return buffer;
  }
}
