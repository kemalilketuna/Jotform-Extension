/**
 * Error classes for Dependency Injection Container
 */

/**
 * Base error class for DI container related errors
 */
export class DIError extends Error {
  constructor(
    message: string,
    public readonly serviceType?: string
  ) {
    super(message);
    this.name = 'DIError';
  }
}

/**
 * Error thrown when a service is not registered in the container
 */
export class ServiceNotRegisteredError extends DIError {
  constructor(serviceType: string) {
    super(
      `Service '${serviceType}' is not registered in the DI container`,
      serviceType
    );
    this.name = 'ServiceNotRegisteredError';
  }
}

/**
 * Error thrown when circular dependencies are detected
 */
export class CircularDependencyError extends DIError {
  constructor(dependencyChain: string[]) {
    const chain = dependencyChain.join(' -> ');
    super(`Circular dependency detected: ${chain}`);
    this.name = 'CircularDependencyError';
  }
}

/**
 * Error thrown when service instantiation fails
 */
export class ServiceInstantiationError extends DIError {
  constructor(serviceType: string, cause: Error) {
    super(
      `Failed to instantiate service '${serviceType}': ${cause.message}`,
      serviceType
    );
    this.name = 'ServiceInstantiationError';
    this.cause = cause;
  }
}

/**
 * Error thrown when dependency resolution fails
 */
export class DependencyResolutionError extends DIError {
  constructor(serviceType: string, dependencyType: string, cause?: Error) {
    const message = cause
      ? `Failed to resolve dependency '${dependencyType}' for service '${serviceType}': ${cause.message}`
      : `Failed to resolve dependency '${dependencyType}' for service '${serviceType}'`;
    super(message, serviceType);
    this.name = 'DependencyResolutionError';
    if (cause) {
      this.cause = cause;
    }
  }
}
