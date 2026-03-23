import { describe, it, expect, vi } from "vitest";
import { createEventBus } from "../event-bus.js";

describe("EventBus", () => {
  it("should call handler when event is emitted", async () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on("test:event", handler);
    await bus.emit("test:event", { key: "value" });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ key: "value" });
  });

  it("should not call handler for a different event", async () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on("event:a", handler);
    await bus.emit("event:b", { key: "value" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should support multiple handlers on the same event", async () => {
    const bus = createEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on("test:event", handler1);
    bus.on("test:event", handler2);
    await bus.emit("test:event", "data");

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler1).toHaveBeenCalledWith("data");
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledWith("data");
  });

  it("should unsubscribe a handler with off()", async () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on("test:event", handler);
    await bus.emit("test:event", "first");
    expect(handler).toHaveBeenCalledTimes(1);

    bus.off("test:event", handler);
    await bus.emit("test:event", "second");
    expect(handler).toHaveBeenCalledTimes(1); // still 1, not called again
  });

  it("should only remove the specific handler on off()", async () => {
    const bus = createEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on("test:event", handler1);
    bus.on("test:event", handler2);

    bus.off("test:event", handler1);
    await bus.emit("test:event", "data");

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it("should not throw when emitting event with no handlers", async () => {
    const bus = createEventBus();

    // Should not throw
    await expect(bus.emit("no:handlers", {})).resolves.toBeUndefined();
  });

  it("should not throw when off() is called for unregistered event", () => {
    const bus = createEventBus();
    const handler = vi.fn();

    // Should not throw
    expect(() => bus.off("no:such:event", handler)).not.toThrow();
  });

  it("should be resilient when a synchronous handler throws", async () => {
    const bus = createEventBus();
    const badHandler = vi.fn(() => {
      throw new Error("sync handler error");
    });
    const goodHandler = vi.fn();

    bus.on("test:event", badHandler);
    bus.on("test:event", goodHandler);

    // Should not reject; errors are swallowed
    await expect(bus.emit("test:event", "data")).resolves.toBeUndefined();

    expect(badHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler).toHaveBeenCalledTimes(1);
  });

  it("should be resilient when an async handler rejects", async () => {
    const bus = createEventBus();
    const badHandler = vi.fn(async () => {
      throw new Error("async handler error");
    });
    const goodHandler = vi.fn();

    bus.on("test:event", badHandler);
    bus.on("test:event", goodHandler);

    // Promise.allSettled should swallow the rejection
    await expect(bus.emit("test:event", "data")).resolves.toBeUndefined();

    expect(badHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler).toHaveBeenCalledTimes(1);
  });

  it("should call handler multiple times for multiple emissions", async () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on("test:event", handler);
    await bus.emit("test:event", "first");
    await bus.emit("test:event", "second");
    await bus.emit("test:event", "third");

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler).toHaveBeenNthCalledWith(1, "first");
    expect(handler).toHaveBeenNthCalledWith(2, "second");
    expect(handler).toHaveBeenNthCalledWith(3, "third");
  });

  it("should handle different event names independently", async () => {
    const bus = createEventBus();
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    bus.on("event:a", handlerA);
    bus.on("event:b", handlerB);

    await bus.emit("event:a", "dataA");

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerA).toHaveBeenCalledWith("dataA");
    expect(handlerB).not.toHaveBeenCalled();

    await bus.emit("event:b", "dataB");

    expect(handlerB).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenCalledWith("dataB");
  });
});
