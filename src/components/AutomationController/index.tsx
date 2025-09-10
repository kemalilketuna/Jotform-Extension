import React, { useState, useEffect } from 'react';
import PodoLogo from '../PodoLogo';
import { AutomationDeletionButton } from './AutiomationDeletionButton';
import {
  EventTypes,
  AutomationStartedEvent,
  AutomationStoppedEvent,
} from '@/events/EventTypes';
import { ServiceFactory } from '@/services/DIContainer';
import { browser } from 'wxt/browser';

export const AutomationController: React.FC = () => {
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const serviceFactory = ServiceFactory.getInstance();
    const eventBus = serviceFactory.createEventBus();

    // Subscribe to automation started events
    const startedSubscriptionId = eventBus.on<AutomationStartedEvent>(
      EventTypes.AUTOMATION_STARTED,
      () => {
        setIsAutomationRunning(true);
      }
    );

    // Subscribe to automation stopped events
    const stoppedSubscriptionId = eventBus.on<AutomationStoppedEvent>(
      EventTypes.AUTOMATION_STOPPED,
      () => {
        setIsAutomationRunning(false);
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      eventBus.off(startedSubscriptionId);
      eventBus.off(stoppedSubscriptionId);
    };
  }, []);

  const handleDeleteAutomation = async () => {
    try {
      const serviceFactory = ServiceFactory.getInstance();
      const eventBus = serviceFactory.createEventBus();

      // Emit automation stopped event
      await eventBus.emit({
        type: EventTypes.AUTOMATION_STOPPED,
        timestamp: Date.now(),
        sessionId: 'current', // This should be the actual session ID
        reason: 'user_request',
        source: 'AutomationController',
      });

      // Send message to background script to stop automation
      await browser.runtime.sendMessage({
        type: 'STOP_AUTOMATION',
        payload: {},
      });
    } catch (error) {
      const logger = ServiceFactory.getInstance().createLoggingService();
      logger.error('Failed to stop automation', 'AutomationController', {
        error: String(error),
      });
    }
  };

  return (
    <div
      className="flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isAutomationRunning && isHovered ? (
        <AutomationDeletionButton size="md" onClick={handleDeleteAutomation} />
      ) : (
        <PodoLogo size="md" />
      )}
    </div>
  );
};

export default AutomationController;
