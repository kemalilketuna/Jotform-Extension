import {
  AutomationSequence,
  AutomationAction,
} from '@/services/ActionsService/ActionTypes';

/**
 * Persistent automation state interface
 */
export interface AutomationState {
  isActive: boolean;
  currentSequence?: AutomationSequence;
  currentStepIndex: number;
  pendingActions: AutomationAction[];
  targetTabId?: number;
  lastUrl?: string;
}

/**
 * Automation state manager for handling state persistence and updates
 */
export class AutomationStateManager {
  private automationState: AutomationState;

  constructor() {
    this.automationState = {
      isActive: false,
      currentStepIndex: 0,
      pendingActions: [],
    };
  }

  /**
   * Initialize automation state with new sequence
   */
  initializeState(sequence: AutomationSequence, tabId: number): void {
    this.automationState = {
      isActive: true,
      currentSequence: sequence,
      currentStepIndex: 0,
      pendingActions: [...sequence.actions],
      targetTabId: tabId,
    };
  }

  /**
   * Update automation progress
   */
  updateProgress(completedStepIndex: number): void {
    if (this.automationState.isActive && this.automationState.currentSequence) {
      this.automationState.currentStepIndex = completedStepIndex + 1;
      this.automationState.pendingActions =
        this.automationState.currentSequence.actions.slice(
          completedStepIndex + 1
        );
    }
  }

  /**
   * Update last URL for navigation tracking
   */
  updateLastUrl(url: string): void {
    this.automationState.lastUrl = url;
  }

  /**
   * Get current automation state
   */
  getState(): AutomationState {
    return { ...this.automationState };
  }

  /**
   * Reset automation state
   */
  reset(): void {
    this.automationState = {
      isActive: false,
      currentStepIndex: 0,
      pendingActions: [],
    };
  }

  /**
   * Check if automation is active
   */
  isActive(): boolean {
    return this.automationState.isActive;
  }

  /**
   * Get current sequence
   */
  getCurrentSequence(): AutomationSequence | undefined {
    return this.automationState.currentSequence;
  }

  /**
   * Get pending actions
   */
  getPendingActions(): AutomationAction[] {
    return this.automationState.pendingActions;
  }

  /**
   * Get target tab ID
   */
  getTargetTabId(): number | undefined {
    return this.automationState.targetTabId;
  }
}
