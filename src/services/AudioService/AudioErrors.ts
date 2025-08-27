/**
 * Custom error class for audio-related errors
 */
export class AudioError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AudioError';
  }
}
