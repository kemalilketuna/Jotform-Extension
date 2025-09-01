from typing import Dict, Any

class AutomationSequenceGenerator:
    """Generates automation sequences for JotForm"""
    
    @staticmethod
    def get_form_creation_sequence() -> Dict[str, Any]:
        """Generate form creation automation sequence"""
        return {
            "sequenceId": "form-creation-v1",
            "name": "Create New Form",
            "steps": [
                {
                    "action": "navigate",
                    "url": "https://www.jotform.com/myforms",
                    "description": "Navigate to Jotform workspace",
                    "delay": 2000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='create-button'], .create-button, button[aria-label*='Create']",
                    "description": "Click Create button",
                    "delay": 1000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='form-button'], .form-button, button[aria-label*='Form']",
                    "description": "Click Form button",
                    "delay": 1000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='start-from-scratch'], .start-from-scratch, button[aria-label*='Start from scratch']",
                    "description": "Click Start from scratch",
                    "delay": 1000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='classic-form'], .classic-form, button[aria-label*='Classic form']",
                    "description": "Click Classic form",
                    "delay": 500
                },
                {
                    "action": "click",
                    "selector": "[data-testid='close-modal'], .close-modal, button[aria-label*='Close']",
                    "description": "Close modal dialog",
                    "delay": 1000
                }
            ]
        }
    
    @staticmethod
    def get_form_building_sequence() -> Dict[str, Any]:
        """Generate form building automation sequence"""
        return {
            "sequenceId": "form-building-v1",
            "name": "Build Form Elements",
            "steps": [
                {
                    "action": "wait",
                    "description": "Wait for page to initialize",
                    "delay": 1000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='heading-form'], .heading-form, .form-element[data-type='control_head']",
                    "description": "Click on heading form element",
                    "delay": 1000
                },
                {
                    "action": "click",
                    "selector": "[data-testid='settings-button'], .settings-button, button[aria-label*='Settings']",
                    "description": "Click settings button",
                    "delay": 1000
                },
                {
                    "action": "type",
                    "selector": "[data-testid='text-field'], .text-field, input[type='text'], textarea",
                    "text": "Course Registration",
                    "description": "Enter form title text",
                    "delay": 500
                },
                {
                    "action": "click",
                    "selector": "[data-testid='settings-close'], .settings-close, button[aria-label*='Close']",
                    "description": "Close settings menu",
                    "delay": 500
                }
            ]
        }
    
    @staticmethod
    def get_custom_sequence(sequence_type: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate custom automation sequence based on type and parameters"""
        if sequence_type == "form_creation":
            return AutomationSequenceGenerator.get_form_creation_sequence()
        elif sequence_type == "form_building":
            return AutomationSequenceGenerator.get_form_building_sequence()
        else:
            return {
                "sequenceId": f"custom-{sequence_type}-v1",
                "name": f"Custom {sequence_type.replace('_', ' ').title()}",
                "steps": []
            }