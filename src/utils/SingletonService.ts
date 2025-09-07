/**
 * Utility class for managing singleton instances
 * Eliminates code duplication across all singleton services
 */
export class SingletonManager {
  private static instances = new Map<string, unknown>();

  /**
   * Get or create a singleton instance
   * @param className - The name of the class
   * @param factory - Factory function to create the instance
   * @returns The singleton instance
   */
  static getInstance<T>(className: string, factory: () => T): T {
    if (!SingletonManager.instances.has(className)) {
      SingletonManager.instances.set(className, factory());
    }
    return SingletonManager.instances.get(className) as T;
  }

  /**
   * Reset a singleton instance (useful for testing)
   * @param className - The name of the class
   */
  static resetInstance(className: string): void {
    SingletonManager.instances.delete(className);
  }

  /**
   * Check if an instance exists
   * @param className - The name of the class
   * @returns True if instance exists
   */
  static hasInstance(className: string): boolean {
    return SingletonManager.instances.has(className);
  }

  /**
   * Clear all singleton instances (useful for testing)
   */
  static clearAllInstances(): void {
    SingletonManager.instances.clear();
  }

  /**
   * Get the count of active singleton instances
   */
  static getInstanceCount(): number {
    return SingletonManager.instances.size;
  }
}

/**
 * Arguments type for constructor functions - must be any[] for mixin compatibility
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type ConstructorParameters = any[];

/**
 * Constructor type for classes that can be instantiated with flexible arguments
 */
type Constructor<T = Record<string, unknown>> = new (
  ...args: ConstructorParameters
) => T;

/**
 * Mixin function to add singleton behavior to a class
 * @param Base - The base class to add singleton behavior to
 * @returns A class with singleton behavior
 */
export function withSingleton<T extends Constructor>(Base: T) {
  return class extends Base {
    private static instance: InstanceType<T> | undefined;

    constructor(...args: ConstructorParameters) {
      super(...args);
    }

    static getInstance(...args: ConstructorParameters): InstanceType<T> {
      if (!this.instance) {
        this.instance = new this(...args) as InstanceType<T>;
      }
      return this.instance;
    }

    static resetInstance(): void {
      this.instance = undefined;
    }

    static hasInstance(): boolean {
      return !!this.instance;
    }
  };
}
