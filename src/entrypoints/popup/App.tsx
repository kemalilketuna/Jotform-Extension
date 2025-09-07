import React, { useState, useEffect } from 'react';
import { ServiceFactory } from '@/services/DIContainer';
import { ErrorMessages, PromptMessages } from '@/services/MessagesService';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { PopupHeader } from '@/components/PopupHeader';
import { StatusMessage } from '@/components/StatusMessage';
import { ActionButtons } from '@/components/ActionButtons';
import { TimingConfig } from '@/config';
import { PopupFooter } from '@/components/PopupFooter';
import { EventTypes, ExtensionEvent } from '@/events';

/**
 * Main popup component for the JotForm extension
 */
function App() {
  const [status, setStatus] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const serviceFactory = ServiceFactory.getInstance();
  const logger = serviceFactory.createLoggingService();
  const eventBus = serviceFactory.createEventBus();

  /**
   * Get the current active tab
   */
  const getCurrentTab = async () => {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.id) {
      throw new Error(ErrorMessages.getAll().NO_ACTIVE_TAB);
    }

    return tab;
  };

  /**
   * Handle listing visible interactive elements
   */
  const listInteractiveElements = async () => {
    try {
      setStatus('Detecting interactive elements...');
      logger.info(
        'Starting interactive elements detection from popup',
        'PopupApp'
      );

      const tab = await getCurrentTab();

      // Send message to content script to execute the detection
      await browser.tabs.sendMessage(tab.id!, {
        type: 'LIST_INTERACTIVE_ELEMENTS',
      });

      setStatus('Interactive elements logged to console');

      // Clear status after 2 seconds
      setTimeout(
        () => setStatus(''),
        TimingConfig.STATUS_MESSAGE_DISPLAY_DURATION
      );
    } catch (error) {
      logger.logError(error as Error, 'PopupApp');
      setStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Subscribe to events for real-time UI updates
  useEffect(() => {
    const handleEvent = (event: ExtensionEvent) => {
      switch (event.type) {
        case EventTypes.AUTOMATION_STARTED:
          setIsExecuting(true);
          setStatus('Automation started...');
          break;
        case EventTypes.AUTOMATION_STOPPED:
          setIsExecuting(false);
          setStatus('Automation completed');
          setTimeout(
            () => setStatus(''),
            TimingConfig.STATUS_MESSAGE_DISPLAY_DURATION
          );
          break;
        case EventTypes.AUTOMATION_STEP_COMPLETED:
          setStatus(`Step completed: ${event.stepIndex + 1}`);
          break;
        case EventTypes.AUTOMATION_ERROR:
          setIsExecuting(false);
          setStatus(`Error: ${event.error.message}`);
          break;
        case EventTypes.STATUS_UPDATE:
          setStatus(event.status);
          if (event.level !== 'error') {
            setTimeout(
              () => setStatus(''),
              TimingConfig.STATUS_MESSAGE_DISPLAY_DURATION
            );
          }
          break;
        case EventTypes.AUDIO_PLAY:
          // Visual feedback for audio events
          if (event.soundType === 'error') {
            setStatus('Audio feedback: Error sound played');
            setTimeout(() => setStatus(''), 1000);
          }
          break;
      }
    };

    // Subscribe to relevant events
    const subIdAutomationStarted = eventBus.on(
      EventTypes.AUTOMATION_STARTED,
      handleEvent
    );
    const subIdAutomationStopped = eventBus.on(
      EventTypes.AUTOMATION_STOPPED,
      handleEvent
    );
    const subIdAutomationStep = eventBus.on(
      EventTypes.AUTOMATION_STEP_COMPLETED,
      handleEvent
    );
    const subIdAutomationError = eventBus.on(
      EventTypes.AUTOMATION_ERROR,
      handleEvent
    );
    const subIdStatusUpdate = eventBus.on(
      EventTypes.STATUS_UPDATE,
      handleEvent
    );
    const subIdAudioPlay = eventBus.on(EventTypes.AUDIO_PLAY, handleEvent);

    // Cleanup subscriptions on unmount
    return () => {
      eventBus.off(subIdAutomationStarted);
      eventBus.off(subIdAutomationStopped);
      eventBus.off(subIdAutomationStep);
      eventBus.off(subIdAutomationError);
      eventBus.off(subIdStatusUpdate);
      eventBus.off(subIdAudioPlay);
    };
  }, [eventBus]);

  return (
    <div
      className={`w-[360px] h-fit max-h-[600px] gradient-jotform text-white font-sans flex flex-col ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS}`}
    >
      <PopupHeader />

      <div className="flex-1 p-5">
        <div className="mb-5">
          <p className="m-0 text-sm leading-relaxed opacity-90">
            {PromptMessages.getAll().EXTENSION_DESCRIPTION}
          </p>
        </div>

        <StatusMessage status={status} />

        <ActionButtons
          isExecuting={isExecuting}
          onListInteractiveElements={listInteractiveElements}
        />
      </div>

      <PopupFooter />
    </div>
  );
}

export default App;
