const EVENTS = ["UserPromptSubmit", "PreToolUse", "PostToolUse", "Stop"];

export class HookRegistry {
  constructor() {
    this.hooks = new Map(EVENTS.map((event) => [event, []]));
  }

  register(event, callback) {
    if (!this.hooks.has(event)) {
      throw new Error(`Unknown hook event: ${event}`);
    }
    this.hooks.get(event).push(callback);
    return () => this.unregister(event, callback);
  }

  unregister(event, callback) {
    const callbacks = this.hooks.get(event) || [];
    this.hooks.set(event, callbacks.filter((item) => item !== callback));
  }

  async trigger(event, ...args) {
    if (!this.hooks.has(event)) {
      throw new Error(`Unknown hook event: ${event}`);
    }
    for (const callback of this.hooks.get(event)) {
      const result = await callback(...args);
      if (result != null) return result;
    }
    return null;
  }
}

export const hooks = new HookRegistry();
