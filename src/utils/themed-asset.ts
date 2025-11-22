import { Theme } from "@/hooks/use-theme";

/**
 * Build a themed asset path based on a base (without suffix) and theme.
 * Example: themedAsset("/videos/aura-rcs", "dark", "mp4") => "/videos/aura-rcs-dark.mp4"
 */
export function themedAsset(basePath: string, theme: Theme, extension?: string) {
  const sanitizedExt = extension?.replace(/^\./, "");
  const withTheme = `${basePath}-${theme}`;
  return sanitizedExt ? `${withTheme}.${sanitizedExt}` : withTheme;
}
