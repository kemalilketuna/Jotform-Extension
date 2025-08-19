import { LoggingService } from '../services/LoggingService';

/**
 * Background script for JotForm extension
 */
export default defineBackground(() => {
  const logger = LoggingService.getInstance();
  logger.info('JotForm Extension background script loaded', 'BackgroundScript');

  // Future: Add background script functionality here
  // - Handle cross-tab communication
  // - Manage persistent automation state
  // - Handle browser action clicks
});
