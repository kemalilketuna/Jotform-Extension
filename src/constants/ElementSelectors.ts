/**
 * Centralized management of all DOM element selectors and XPaths
 */
export class ElementSelectors {
  private constructor() {} // Prevent instantiation

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

  /**
   * Validate CSS selector format
   */
  static validateSelector(selector: string): string {
    if (!selector || selector.trim().length === 0) {
      throw new Error('Selector cannot be empty');
    }

    // Basic validation - check for common CSS selector patterns
    const validSelectorPattern = /^[#.]?[\w\-\s>:()[\].,]+$/;
    if (!validSelectorPattern.test(selector)) {
      throw new Error(`Invalid selector format: ${selector}`);
    }

    return selector.trim();
  }

  /**
   * Get form creation selector with fallback
   */
  static getFormCreationSelector(
    type: keyof typeof ElementSelectors.FORM_CREATION,
    override?: string
  ): string {
    const selector = override || ElementSelectors.FORM_CREATION[type];
    return ElementSelectors.validateSelector(selector);
  }
}
