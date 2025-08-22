/**
 * Centralized management of all DOM element selectors and XPaths
 */
export class ElementSelectors {
  private constructor() { } // Prevent instantiation

  // Form Creation Flow Selectors
  static readonly FORM_CREATION = {
    CREATE_BUTTON:
      '#root > div.lsApp > div.lsApp-body.newWorkspaceUI.newTeamCoversActive > div.lsApp-sidebar.relative > div.lsApp-sidebar-content.lsApp-sidebar-ls > div.lsApp-sidebar-button > button',
    FORM_BUTTON:
      '#create-asset-modal-container > div > div.sc-khQegj.fNgvag.forSideBySideCreation.jfWizard-item.jfWizard-gutter.withMaxWidth > div > div > div.jfWizard-body.sc-hUpaCq.gxAShf > div > ul > li:nth-child(1) > button',
    START_FROM_SCRATCH_BUTTON:
      '#modal-container > div > div.isMain.largeWizardItem.moreThanFourItem.jfWizard-item > div.jfWizard-gutter.withMaxWidth > div > ul > li.jfWizard-list-item-wrapper.forStartFromScratch > button',
    CLASSIC_FORM_BUTTON:
      '#modal-container > div > div.largeWizardItem.isStartFromScratch.forNewOptions.jfWizard-item > div.jfWizard-gutter.withMaxWidth > div > ul > li.jfWizard-list-item-wrapper.forClassicForm > button',
  } as const;

  // Workspace Elements
  static readonly WORKSPACE = {
    SIDEBAR: '.lsApp-sidebar',
    MAIN_CONTENT: '.lsApp-body',
    SIDEBAR_CONTENT: '.lsApp-sidebar-content',
  } as const;

  // Modal Elements
  static readonly MODAL = {
    CLOSE_BUTTON:
      '#portal-root > div > div > div > div > div > div.jfModal-header > div.jfModal-title > div.jfModal-close',
  } as const;

  // Form Building Elements
  static readonly FORM_BUILDING = {
    HEADING_FORM: '#id_1 > div.question-wrapper.questionWrapper > div > div',
    SETTINGS_BUTTON:
      '#app_wizards > div > button.btn.sc-Properties.radius-full.magnet-button.inline-flex.shrink-0.justify-center.items-center.font-medium.duration-300.outline-2.outline-transparent.outline-offset-0.focus\\:outline-opacity-50.h-10.px-2\\.5.border-0.group.cursor-pointer.color-white.bg-gray-600.hover\\:bg-gray-700.focus\\:outline-gray-300',
    TEXT_FIELD: '#text',
    SETTINGS_CLOSE_BUTTON: '#question-settings-close-btn',
  } as const;

  /**
   * Validate CSS selector format
   */
  static validateSelector(selector: string): string {
    if (!selector || selector.trim().length === 0) {
      throw new Error('Selector cannot be empty');
    }

    // For now, just return the selector without strict validation
    // CSS selectors can be very complex with escaped characters
    return selector.trim();
  }
}
