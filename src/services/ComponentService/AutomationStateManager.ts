import { LoggingService } from '../LoggingService';

/**
 * Manages automation state and session tracking
 */
export class AutomationStateManager {
  private readonly logger: LoggingService;
  private isAutomationRunning = false;
  private pendingPrompt: string | null = null;
  private currentSessionId: string | null = null;

  constructor(logger: LoggingService) {
    this.logger = logger;
  }

  /**
   * Set automation running state
   */
  setAutomationRunning(isRunning: boolean): void {
    this.isAutomationRunning = isRunning;
    this.logger.info(
      `Automation state changed: ${isRunning ? 'running' : 'stopped'}`,
      'AutomationStateManager'
    );
  }

  /**
   * Check if automation is currently running
   */
  isRunning(): boolean {
    return this.isAutomationRunning;
  }

  /**
   * Set pending prompt for queued automation
   */
  setPendingPrompt(prompt: string | null): void {
    this.pendingPrompt = prompt;
    if (prompt) {
      this.logger.info(
        'Pending prompt set for queued automation',
        'AutomationStateManager',
        { prompt }
      );
    } else {
      this.logger.info('Pending prompt cleared', 'AutomationStateManager');
    }
  }

  /**
   * Get pending prompt
   */
  getPendingPrompt(): string | null {
    return this.pendingPrompt;
  }

  /**
   * Clear pending prompt
   */
  clearPendingPrompt(): void {
    this.pendingPrompt = null;
    this.logger.info('Pending prompt cleared', 'AutomationStateManager');
  }

  /**
   * Set current session ID
   */
  setSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
    if (sessionId) {
      this.logger.info(
        `Session ID set: ${sessionId}`,
        'AutomationStateManager'
      );
    } else {
      this.logger.info('Session ID cleared', 'AutomationStateManager');
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Clear current session ID
   */
  clearSessionId(): void {
    this.currentSessionId = null;
    this.logger.info('Session ID cleared', 'AutomationStateManager');
  }

  /**
   * Handle automation started event
   */
  handleAutomationStarted(): void {
    this.setAutomationRunning(true);
  }

  /**
   * Handle automation stopped event
   */
  handleAutomationStopped(reason: string): string | null {
    this.setAutomationRunning(false);
    this.clearSessionId();

    this.logger.info(
      `Automation stopped - reason: ${reason}, session cleared`,
      'AutomationStateManager'
    );

    // Return pending prompt if any, and clear it
    const prompt = this.pendingPrompt;
    if (prompt) {
      this.clearPendingPrompt();
      this.logger.info(
        'Returning pending prompt for new automation',
        'AutomationStateManager',
        { prompt }
      );
    }

    return prompt;
  }

  /**
   * Handle automation error event
   */
  handleAutomationError(errorMessage: string): string | null {
    this.setAutomationRunning(false);
    this.clearSessionId();

    this.logger.error(
      `Automation error occurred: ${errorMessage}, session cleared`,
      'AutomationStateManager'
    );

    // Return pending prompt if any, and clear it
    const prompt = this.pendingPrompt;
    if (prompt) {
      this.clearPendingPrompt();
      this.logger.info(
        'Returning pending prompt for new automation after error',
        'AutomationStateManager',
        { prompt }
      );
    }

    return prompt;
  }

  /**
   * Queue a prompt if automation is running, or return false if can start immediately
   */
  queuePromptIfRunning(prompt: string): boolean {
    if (this.isAutomationRunning) {
      this.setPendingPrompt(prompt);
      return true; // Queued
    }

    this.clearPendingPrompt();
    return false; // Can start immediately
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.isAutomationRunning = false;
    this.pendingPrompt = null;
    this.currentSessionId = null;
    this.logger.info('Automation state reset', 'AutomationStateManager');
  }
}
