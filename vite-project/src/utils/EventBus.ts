type Handler<T = unknown> = (data: T) => void;

class TypedEventBus {
  private handlers = new Map<string, Set<Handler<unknown>>>();

  on<T>(event: string, handler: Handler<T>): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler as Handler<unknown>);
  }

  off<T>(event: string, handler: Handler<T>): void {
    this.handlers.get(event)?.delete(handler as Handler<unknown>);
  }

  emit<T>(event: string, data?: T): void {
    for (const h of this.handlers.get(event) ?? []) h(data);
  }

  once<T>(event: string, handler: Handler<T>): void {
    const wrapped: Handler<T> = (data) => { handler(data); this.off(event, wrapped); };
    this.on(event, wrapped);
  }
}

export const EventBus = new TypedEventBus();
