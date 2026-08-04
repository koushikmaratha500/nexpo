export class Container {
  private static singletons: Map<string, unknown> = new Map();
  private static bindings: Map<string, new (...args: unknown[]) => unknown> = new Map();
  private static factories: Map<string, () => unknown> = new Map();

  static bind<T = unknown>(token: string, implementation: new (...args: unknown[]) => T): void {
    this.bindings.set(token, implementation as new (...args: unknown[]) => unknown);
  }

  static bindFactory(token: string, factory: () => unknown): void {
    this.factories.set(token, factory);
  }

  static bindSingleton<T = unknown>(token: string, instance: T): void {
    this.singletons.set(token, instance);
  }

  static resolve<T = unknown>(token: string): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    if (this.factories.has(token)) {
      const instance = this.factories.get(token)!();
      return instance as T;
    }

    const Implementation = this.bindings.get(token);
    if (Implementation) {
      return new Implementation() as T;
    }

    throw new Error(`No binding found for token: ${String(token)}`);
  }

  static reset(): void {
    this.singletons.clear();
    this.bindings.clear();
    this.factories.clear();
  }
}
