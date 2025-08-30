import { LoggingService } from './LoggingService';

/**
 * Automation state enumeration
 */
export enum AutomationState {
  STOPPED = 'stopped',
  RUNNING = 'running',
  PAUSED = 'paused'
}

/**
 * Automation state change event
 */
export interface AutomationStateChangeEvent {
  previousState: AutomationState;
  currentState: AutomationState;
  timestamp: number;
}

/**
 * Automation state change listener
 */
export type AutomationStateChangeListener = (event: AutomationStateChangeEvent) => void;

/**
 * Service for managing automation state across components
 * Provides centralized state management for pause/start functionality
 */
export class AutomationStateManager {
  private static instance: AutomationStateManager;
  private readonly logger: LoggingService;
  private currentState: AutomationState = AutomationState.STOPPED;
  private listeners: Set<AutomationStateChangeListener> = new Set();

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): AutomationStateManager {
    if (!AutomationStateManager.instance) {
      AutomationStateManager.instance = new AutomationStateManager();
    }
    return AutomationStateManager.instance;
  }

  /**
   * Get current automation state
   */
  getState(): AutomationState {
    return this.currentState;
  }

  /**
   * Check if automation is currently running
   */
  isRunning(): boolean {
    return this.currentState === AutomationState.RUNNING;
  }

  /**
   * Check if automation is currently paused
   */
  isPaused(): boolean {
    return this.currentState === AutomationState.PAUSED;
  }

  /**
   * Check if automation is stopped
   */
  isStopped(): boolean {
    return this.currentState === AutomationState.STOPPED;
  }

  /**
   * Start automation
   */
  start(): void {
    this.setState(AutomationState.RUNNING);
  }

  /**
   * Pause automation
   */
  pause(): void {
    if (this.currentState === AutomationState.RUNNING) {
      this.setState(AutomationState.PAUSED);
    } else {
      this.logger.warn(
        `Cannot pause automation from state: ${this.currentState}`,
        'AutomationStateManager'
      );
    }
  }

  /**
   * Resume automation from paused state
   */
  resume(): void {
    if (this.currentState === AutomationState.PAUSED) {
      this.setState(AutomationState.RUNNING);
    } else {
      this.logger.warn(
        `Cannot resume automation from state: ${this.currentState}`,
        'AutomationStateManager'
      );
    }
  }

  /**
   * Stop automation
   */
  stop(): void {
    this.setState(AutomationState.STOPPED);
  }

  /**
   * Toggle between running and paused states
   */
  toggle(): void {
    switch (this.currentState) {
      case AutomationState.RUNNING:
        this.pause();
        break;
      case AutomationState.PAUSED:
        this.resume();
        break;
      case AutomationState.STOPPED:
        this.start();
        break;
    }
  }

  /**
   * Add state change listener
   */
  addStateChangeListener(listener: AutomationStateChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove state change listener
   */
  removeStateChangeListener(listener: AutomationStateChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Set automation state and notify listeners
   */
  private setState(newState: AutomationState): void {
    const previousState = this.currentState;
    
    if (previousState === newState) {
      return;
    }

    this.currentState = newState;
    
    const event: AutomationStateChangeEvent = {
      previousState,
      currentState: newState,
      timestamp: Date.now()
    };

    this.logger.info(
      `Automation state changed: ${previousState} -> ${newState}`,
      'AutomationStateManager'
    );

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.logger.error(
          `Error in automation state change listener: ${error}`,
          'AutomationStateManager'
        );
      }
    });
  }

  /**
   * Reset state manager (for testing)
   */
  reset(): void {
    this.currentState = AutomationState.STOPPED;
    this.listeners.clear();
  }
}