/**
 * Centralized Configuration Management System
 * Exports all configuration classes for easy access
 */

import { TimingConfig } from './TimingConfig';
import { UIConfig } from './UIConfig';
import { DOMConfig } from './DOMConfig';
import { APIConfig } from './APIConfig';
import { AudioConfig } from './AudioConfig';
import { AutomationConfig } from './AutomationConfig';
import { LoggingConfig } from './LoggingConfig';
import { ExtensionConfig } from './ExtensionConfig';
import { ScreenshotConfig } from './ScreenshotConfig';

// Export all configuration classes
export {
  TimingConfig,
  UIConfig,
  DOMConfig,
  APIConfig,
  AudioConfig,
  AutomationConfig,
  LoggingConfig,
  ExtensionConfig,
  ScreenshotConfig,
};

// Shorthand exports for convenience
export const TIMING = TimingConfig;
export const UI = UIConfig;
export const DOM = DOMConfig;
export const API = APIConfig;
export const AUDIO = AudioConfig;
export const AUTOMATION = AutomationConfig;
export const LOGGING = LoggingConfig;
export const EXTENSION = ExtensionConfig;
export const SCREENSHOT = ScreenshotConfig;
