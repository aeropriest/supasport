type Listener<T> = (data: T) => void;

class EventEmitter<TEvents extends Record<string, any>> {
  private listeners: { [K in keyof TEvents]?: Listener<TEvents[K]>[] } = {};

  on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event]!.filter(l => l !== listener);
  }

  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event]!.forEach(listener => listener(data));
  }
}

export const errorEmitter = new EventEmitter<{ 'permission-error': any }>();
