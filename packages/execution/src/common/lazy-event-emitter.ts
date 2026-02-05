import { EventEmitter } from 'events';

/**
 * EventEmitter with lazy event creation.
 * The callback is only called if there are listeners for the event.
 */
export class LazyEventEmitter extends EventEmitter {
  emitLazy<T>(eventName: string, createEvent: () => T): boolean {
    if (this.listenerCount(eventName) > 0) {
      return this.emit(eventName, createEvent());
    }
    return false;
  }
}
