/**
 * String constants for PodoLogo component following OOP pattern
 */
export class PodoLogoStrings {
  static readonly ASSET_PATHS = {
    LOGO_IMAGE: 'podoLogo.png' as const,
  } as const;

  static readonly ALT_TEXT = {
    LOGO: 'Podo Logo' as const,
  } as const;

  static readonly CSS_CLASSES = {
    CONTAINER_BASE: 'rounded-full overflow-hidden flex-shrink-0' as const,
    IMAGE: 'w-full h-full object-cover' as const,
  } as const;

  static readonly SIZE_CLASSES = {
    sm: 'w-6 h-6' as const,
    md: 'w-11 h-11' as const,
    lg: 'w-16 h-16' as const,
  } as const;
}
