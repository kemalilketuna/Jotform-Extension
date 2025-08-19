import { VisualCursor } from './VisualCursor';
import { CursorPosition } from '../types/AutomationTypes';
import { LoggingService } from '../services/LoggingService';

/**
 * Visual demonstration utilities for testing the cursor animations
 */
export class VisualDemo {
    private static instance: VisualDemo;
    private readonly logger: LoggingService;
    private readonly visualCursor: VisualCursor;

    private constructor() {
        this.logger = LoggingService.getInstance();
        this.visualCursor = VisualCursor.getInstance();
    }

    static getInstance(): VisualDemo {
        if (!VisualDemo.instance) {
            VisualDemo.instance = new VisualDemo();
        }
        return VisualDemo.instance;
    }

    /**
     * Demonstrate cursor movement to random positions
     */
    async demonstrateCursorMovement(): Promise<void> {
        this.logger.info('Starting cursor movement demonstration', 'VisualDemo');

        this.visualCursor.initialize();
        this.visualCursor.show({ x: 100, y: 100 });

        const positions: CursorPosition[] = [
            { x: 300, y: 200 },
            { x: 600, y: 150 },
            { x: 400, y: 400 },
            { x: 200, y: 300 },
            { x: 500, y: 100 }
        ];

        for (const position of positions) {
            await this.moveToPosition(position);
            await this.wait(1000);
        }

        this.visualCursor.hide();
        setTimeout(() => {
            this.visualCursor.destroy();
        }, 1000);

        this.logger.info('Cursor movement demonstration completed', 'VisualDemo');
    }

    /**
     * Demonstrate clicking on all visible buttons
     */
    async demonstrateButtonClicking(): Promise<void> {
        this.logger.info('Starting button clicking demonstration', 'VisualDemo');

        this.visualCursor.initialize();
        this.visualCursor.show({ x: 100, y: 100 });

        const buttons = document.querySelectorAll('button, [role="button"], .btn, input[type="button"], input[type="submit"]');
        const visibleButtons = Array.from(buttons).filter(button => {
            const rect = button.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0;
        }).slice(0, 5); // Limit to first 5 buttons for demo

        for (const button of visibleButtons) {
            try {
                await this.visualCursor.moveToElement(button);
                await this.visualCursor.performClick();
                await this.wait(1500);
            } catch (error) {
                this.logger.warn('Failed to demonstrate click on button', 'VisualDemo', { error });
            }
        }

        this.visualCursor.hide();
        setTimeout(() => {
            this.visualCursor.destroy();
        }, 1000);

        this.logger.info('Button clicking demonstration completed', 'VisualDemo');
    }

    /**
     * Show cursor at specific element
     */
    async showCursorAtElement(selector: string): Promise<void> {
        const element = document.querySelector(selector);
        if (!element) {
            this.logger.warn(`Element not found: ${selector}`, 'VisualDemo');
            return;
        }

        this.visualCursor.initialize();
        this.visualCursor.show({ x: 100, y: 100 });

        await this.visualCursor.moveToElement(element);
        await this.visualCursor.performClick();

        setTimeout(() => {
            this.visualCursor.hide();
            setTimeout(() => {
                this.visualCursor.destroy();
            }, 1000);
        }, 2000);
    }

    /**
     * Move cursor to specific position
     */
    private async moveToPosition(position: CursorPosition): Promise<void> {
        // Create a temporary invisible element to simulate movement target
        const tempElement = document.createElement('div');
        tempElement.style.position = 'fixed';
        tempElement.style.left = `${position.x}px`;
        tempElement.style.top = `${position.y}px`;
        tempElement.style.width = '1px';
        tempElement.style.height = '1px';
        tempElement.style.pointerEvents = 'none';
        tempElement.style.opacity = '0';

        document.body.appendChild(tempElement);

        try {
            await this.visualCursor.moveToElement(tempElement);
        } finally {
            document.body.removeChild(tempElement);
        }
    }

    /**
     * Wait for specified milliseconds
     */
    private async wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Expose demo functions to global scope for development testing
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    (globalThis as any).jotformVisualDemo = VisualDemo.getInstance();
}
