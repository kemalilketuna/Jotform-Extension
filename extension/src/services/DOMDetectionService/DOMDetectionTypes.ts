export interface ScrollableArea {
  element: HTMLElement;
  jsPath: string;
  scrollHeight: number;
  clientHeight: number;
  scrollWidth: number;
  clientWidth: number;
  isVerticallyScrollable: boolean;
  isHorizontallyScrollable: boolean;
}

export interface InteractiveElement {
  element: HTMLElement;
  jsPath: string;
  type: InteractiveElementType;
  isVisible: boolean;
  boundingRect: DOMRect;
  tagName: string;
  attributes: Record<string, string>;
}

export type InteractiveElementType = 
  | 'button'
  | 'link'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'submit'
  | 'clickable';

export interface DOMDetectionConfig {
  includeHiddenElements: boolean;
  minScrollableSize: number;
  maxDepth: number;
  excludeSelectors: string[];
}

export interface ElementVisibilityInfo {
  isVisible: boolean;
  isInViewport: boolean;
  opacity: number;
  display: string;
  visibility: string;
}