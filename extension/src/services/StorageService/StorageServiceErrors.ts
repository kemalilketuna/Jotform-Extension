export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageQuotaExceededError extends StorageError {
  constructor() {
    super('Storage quota exceeded');
    this.name = 'StorageQuotaExceededError';
  }
}

export class StorageUnavailableError extends StorageError {
  constructor() {
    super('Browser storage is unavailable');
    this.name = 'StorageUnavailableError';
  }
}

export class InvalidStorageKeyError extends StorageError {
  constructor(key: string) {
    super(`Invalid storage key provided: ${key}`);
    this.name = 'InvalidStorageKeyError';
  }
}

export class StorageOperationError extends StorageError {
  constructor(operation: string, key: string, reason?: string) {
    const message = reason
      ? `Failed to ${operation} data for key '${key}': ${reason}`
      : `Failed to ${operation} data for key '${key}'`;
    super(message);
    this.name = 'StorageOperationError';
  }
}
