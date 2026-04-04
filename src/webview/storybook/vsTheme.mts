/**
 * vsTheme.ts — Single source of truth for all VS Code color variables.
 *
 * Source: dev_color_code.md
 *
 * Usage in any story:
 *   import { varControl, withVarOverrides } from "path/to/storybook/vsTheme";
 *
 *   argTypes: { editorBg: varControl("--vscode-editor-background") },
 *   args:     { editorBg: "--vscode-editor-background" },
 *   decorators: [withVarOverrides({ editorBg: "--vscode-editor-background" })],
 */

import React from "react";
import type { Decorator, ArgTypes, Args } from "@storybook/react-vite";

// ---------------------------------------------------------------------------
// Full palette — keyed by CSS variable name, valued by hex/rgba.
// These are the exact values from dev_color_code.md.
// ---------------------------------------------------------------------------
export const FLUXTERM_PALETTE = {
  "--vscode-editor-background":                "#121314",
  "--vscode-editor-foreground":                "#bbbebf",
  "--vscode-editorWidget-background":          "#202122",
  "--vscode-editorWidget-border":              "#2a2b2c",
  "--vscode-input-background":                 "#191a1b",
  "--vscode-input-foreground":                 "#bfbfbf",
  "--vscode-input-placeholderForeground":      "#555555",
  "--vscode-input-border":                     "#333536",
  "--vscode-inputValidation-infoBackground":   "#1e3a47",
  "--vscode-inputValidation-warningBackground":"#352a05",
  "--vscode-inputValidation-errorBackground":  "#3a1d1d",
  "--vscode-button-background":                "#297aa0",
  "--vscode-button-foreground":                "#ffffff",
  "--vscode-button-hoverBackground":           "#2b7da3",
  "--vscode-button-secondaryBackground":       "#121314",
  "--vscode-list-hoverBackground":             "#1e1f20",
  "--vscode-list-activeSelectionBackground":   "#17262d",
  "--vscode-menu-background":                  "#202122",
  "--vscode-menu-foreground":                  "#bfbfbf",
  "--vscode-menu-selectionBackground":         "#17262d",
  "--vscode-statusBar-background":             "#191a1b",
  "--vscode-statusBar-foreground":             "#8c8c8c",
  "--vscode-statusBarItem-remoteBackground":   "#0078d4",
  "--vscode-statusBarItem-errorBackground":    "#c72e0f",
  "--vscode-terminal-background":              "#191a1b",
  "--vscode-terminal-foreground":              "#cccccc",
  "--vscode-terminal-ansiBlack":               "#000000",
  "--vscode-terminal-ansiRed":                 "#cd3131",
  "--vscode-terminal-ansiGreen":               "#0dbc79",
  "--vscode-terminal-ansiYellow":              "#e5e510",
  "--vscode-terminal-ansiBlue":                "#2472c8",
  "--vscode-terminal-ansiMagenta":             "#bc3fbc",
  "--vscode-terminal-ansiCyan":                "#11a8cd",
  "--vscode-terminal-ansiWhite":               "#e5e5e5",
  "--vscode-terminal-ansiBrightBlack":         "#666666",
  "--vscode-terminal-ansiBrightRed":           "#f14c4c",
  "--vscode-terminal-ansiBrightGreen":         "#23d18b",
  "--vscode-terminal-ansiBrightYellow":        "#f5f543",
  "--vscode-terminal-ansiBrightBlue":          "#3b8eea",
  "--vscode-terminal-ansiBrightMagenta":       "#d670d6",
  "--vscode-terminal-ansiBrightCyan":          "#29b8db",
  "--vscode-terminal-ansiBrightWhite":         "#e5e5e5",
  "--vscode-badge-background":                 "#378cb2",
  "--vscode-badge-foreground":                 "#ffffff",
  "--vscode-panel-border":                     "#2a2b2c",
  "--vscode-sideBar-background":               "#191a1b",
  "--vscode-activityBar-background":           "#191a1b",
  "--vscode-editor-selectionBackground":       "#245c74",
  "--vscode-editorCursor-foreground":          "#ffff4d",
  "--vscode-editor-lineHighlightBackground":   "#242526",
  "--vscode-textLink-foreground":              "#48a0c7",
  "--vscode-textLink-activeForeground":        "#53a5ca",
  "--vscode-scrollbarSlider-background":       "rgba(131, 132, 133, 0.2)",
  "--vscode-scrollbarSlider-hoverBackground":  "rgba(131, 132, 133, 0.4)",
  "--vscode-scrollbarSlider-activeBackground": "rgba(131, 132, 133, 0.6)",
} as const;

export type PaletteKey = keyof typeof FLUXTERM_PALETTE;

/** All CSS variable names — used as dropdown option list in Controls. */
export const PALETTE_OPTIONS = Object.keys(FLUXTERM_PALETTE) as PaletteKey[];

/**
 * Resolve a CSS variable name to its hex/rgba value.
 * Falls back to the raw string if not found.
 */
export function resolveColor(varName: string): string {
  return (FLUXTERM_PALETTE as Record<string, string>)[varName] ?? varName;
}

// ---------------------------------------------------------------------------
// varControl — generates an argType config for one CSS custom property.
//
// The dropdown shows every CSS variable name from the palette.
// Default is the cssVar itself (its own canonical value).
//
// Example:
//   argTypes: { editorBg: varControl("--vscode-editor-background") }
//   args:     { editorBg: "--vscode-editor-background" }
// ---------------------------------------------------------------------------
export function varControl(
  cssVar: PaletteKey,
  description?: string
): ArgTypes[string] {
  return {
    name: cssVar,
    description: description ?? `Controls ${cssVar}`,
    control: "select",
    options: PALETTE_OPTIONS,
    defaultValue: cssVar,
  };
}

// ---------------------------------------------------------------------------
// withVarOverrides — reusable decorator factory.
//
// Pass a map of { argName → cssVarName } and it returns a Storybook Decorator
// that resolves each arg's selected CSS var name to its hex value and
// injects them as CSS custom properties on the story wrapper.
//
// Example:
//   decorators: [withVarOverrides({ editorBg: "--vscode-editor-background" })]
// ---------------------------------------------------------------------------
export function withVarOverrides(
  argToCssVar: Record<string, string>
): Decorator {
  return (Story, context) => {
    const cssVars: Record<string, string> = {};
    for (const [argName, targetCssVar] of Object.entries(argToCssVar)) {
      const selectedVarName: string = (context.args as Args)[argName] ?? targetCssVar;
      cssVars[targetCssVar] = resolveColor(selectedVarName);
    }
    return React.createElement(
      "div",
      { style: cssVars as React.CSSProperties },
      React.createElement(Story)
    );
  };
}
