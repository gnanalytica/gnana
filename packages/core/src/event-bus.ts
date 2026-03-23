import type { EventBus, EventHandler } from "./types.js";

export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<EventHandler>>();

  return {
    async emit(event: string, data: unknown): Promise<void> {
      const set = handlers.get(event);
      if (!set) return;
      const promises = [...set].map((handler) => {
        try {
          return Promise.resolve(handler(data));
        } catch {
          // Swallow synchronous handler errors to not break the pipeline
          return Promise.resolve();
        }
      });
      await Promise.allSettled(promises);
    },

    on(event: string, handler: EventHandler): void {
      let set = handlers.get(event);
      if (!set) {
        set = new Set();
        handlers.set(event, set);
      }
      set.add(handler);
    },

    off(event: string, handler: EventHandler): void {
      handlers.get(event)?.delete(handler);
    },
  };
}
