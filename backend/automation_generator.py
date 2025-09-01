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
                    "delay": 2000,
                },
                {
                    "action": "click",
                    "selector": "#root > div.lsApp > div.lsApp-body.newWorkspaceUI.newTeamCoversActive > div.lsApp-sidebar.relative > div.lsApp-sidebar-content.lsApp-sidebar-ls > div.lsApp-sidebar-button > button",
                    "description": "Click Create button",
                    "delay": 1000,
                },
                {
                    "action": "click",
                    "selector": "#create-asset-modal-container > div > div.sc-khQegj.fNgvag.forSideBySideCreation.jfWizard-item.jfWizard-gutter.withMaxWidth > div > div > div.jfWizard-body.sc-hUpaCq.gxAShf > div > ul > li:nth-child(1) > button",
                    "description": "Click Form button",
                    "delay": 1000,
                },
                {
                    "action": "click",
                    "selector": "#modal-container > div > div.isMain.largeWizardItem.moreThanFourItem.jfWizard-item > div.jfWizard-gutter.withMaxWidth > div > ul > li.jfWizard-list-item-wrapper.forStartFromScratch > button",
                    "description": "Click Start from scratch",
                    "delay": 1000,
                },
                {
                    "action": "click",
                    "selector": "#modal-container > div > div.largeWizardItem.isStartFromScratch.forNewOptions.jfWizard-item > div.jfWizard-gutter.withMaxWidth > div > ul > li.jfWizard-list-item-wrapper.forClassicForm > button",
                    "description": "Click Classic form",
                    "delay": 500,
                },
                {
                    "action": "click",
                    "selector": "#portal-root > div > div > div > div > div > div.jfModal-header > div.jfModal-title > div.jfModal-close",
                    "description": "Close modal dialog",
                    "delay": 1000,
                },
            ],
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
                    "delay": 1000,
                },
                {
                    "action": "click",
                    "selector": "#id_1 > div.question-wrapper.questionWrapper > div > div",
                    "description": "Click on heading form element",
                    "delay": 1000,
                },
                {
                    "action": "click",
                    "selector": "#app_wizards > div > button.btn.sc-Properties.radius-full.magnet-button.inline-flex.shrink-0.justify-center.items-center.font-medium.duration-300.outline-2.outline-transparent.outline-offset-0.focus\\:outline-opacity-50.h-10.px-2\\.5.border-0.group.cursor-pointer.color-white.bg-gray-600.hover\\:bg-gray-700.focus\\:outline-gray-300",
                    "description": "Click settings button",
                    "delay": 1000,
                },
                {
                    "action": "type",
                    "selector": "#text",
                    "text": "Course Registration",
                    "description": "Enter form title text",
                    "delay": 500,
                },
                {
                    "action": "click",
                    "selector": "#question-settings-close-btn",
                    "description": "Close settings menu",
                    "delay": 500,
                },
            ],
        }

    @staticmethod
    def get_custom_sequence(
        sequence_type: str, parameters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate custom automation sequence based on type and parameters"""
        if sequence_type == "form_creation":
            return AutomationSequenceGenerator.get_form_creation_sequence()
        elif sequence_type == "form_building":
            return AutomationSequenceGenerator.get_form_building_sequence()
        else:
            return {
                "sequenceId": f"custom-{sequence_type}-v1",
                "name": f"Custom {sequence_type.replace('_', ' ').title()}",
                "steps": [],
            }
