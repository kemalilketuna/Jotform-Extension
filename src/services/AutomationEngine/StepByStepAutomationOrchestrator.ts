import { LoggingService } from '@/services/LoggingService';
import { APIService } from '@/services/APIService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { StorageService } from '@/services/StorageService';
import { MessageHandler } from './MessageHandler';
import { ElementActionExecutor } from './ElementActionExecutor';
import { AutomationLifecycleManager } from './AutomationLifecycleManager';
import { SessionCoordinator } from './SessionCoordinator';
import { DOMAnalyzer } from './DOMAnalyzer';
import { ActionProcessor } from './ActionProcessor';
import { ExecutionController } from './ExecutionController';

/**
 * Orchestrates step-by-step automation using AI guidance with proper DOM detection and error handling
 * Refactored to use smaller, focused components
 */
export class StepByStepAutomationOrchestrator {
  private readonly executionController: ExecutionController;

  constructor(
    logger: LoggingService,
    apiService: APIService,
    domDetectionService: DOMDetectionService,
    storageService: StorageService,
    messageHandler: MessageHandler,
    elementActionExecutor: ElementActionExecutor,
    lifecycleManager: AutomationLifecycleManager
  ) {
    // Create focused components
    const sessionCoordinator = new SessionCoordinator(
      logger,
      apiService,
      storageService
    );
    const domAnalyzer = new DOMAnalyzer(logger, domDetectionService);
    const actionProcessor = new ActionProcessor(logger, elementActionExecutor);

    // Create execution controller with all components
    this.executionController = new ExecutionController(
      logger,
      lifecycleManager,
      messageHandler,
      sessionCoordinator,
      domAnalyzer,
      actionProcessor
    );
  }

  /**
   * Execute step-by-step automation using AI guidance with proper DOM detection and error handling
   */
  async execute(objective: string, sessionId?: string): Promise<void> {
    return this.executionController.execute(objective, sessionId);
  }
}
