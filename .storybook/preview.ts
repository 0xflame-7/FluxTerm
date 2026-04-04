import type { Preview, Decorator } from "@storybook/react-vite";
import React from "react";
import "../src/webview/styles.css";

// ---------------------------------------------------------------------------
// VS Code Theme Palettes (sourced from dev_color_code.md)
// ---------------------------------------------------------------------------

const THEMES: Record<string, Record<string, string>> = {
  "FluxTerm Dark": {
    "--vscode-editor-background": "#121314",
    "--vscode-editor-foreground": "#bbbebf",
    "--vscode-editorWidget-background": "#202122",
    "--vscode-editorWidget-border": "#2a2b2c",
    "--vscode-input-background": "#191a1b",
    "--vscode-input-foreground": "#bfbfbf",
    "--vscode-input-placeholderForeground": "#555555",
    "--vscode-input-border": "#333536",
    "--vscode-inputValidation-infoBackground": "#1e3a47",
    "--vscode-inputValidation-warningBackground": "#352a05",
    "--vscode-inputValidation-errorBackground": "#3a1d1d",
    "--vscode-button-background": "#297aa0",
    "--vscode-button-foreground": "#ffffff",
    "--vscode-button-hoverBackground": "#2b7da3",
    "--vscode-button-secondaryBackground": "#121314",
    "--vscode-list-hoverBackground": "#1e1f20",
    "--vscode-list-activeSelectionBackground": "#17262d",
    "--vscode-menu-background": "#202122",
    "--vscode-menu-foreground": "#bfbfbf",
    "--vscode-menu-selectionBackground": "#17262d",
    "--vscode-menu-selectionForeground": "#bfbfbf",
    "--vscode-menu-border": "#2a2b2c",
    "--vscode-menu-separatorBackground": "#2a2b2c",
    "--vscode-statusBar-background": "#191a1b",
    "--vscode-statusBar-foreground": "#8c8c8c",
    "--vscode-statusBarItem-remoteBackground": "#0078d4",
    "--vscode-statusBarItem-errorBackground": "#c72e0f",
    "--vscode-terminal-background": "#191a1b",
    "--vscode-terminal-foreground": "#cccccc",
    "--vscode-terminal-ansiBlack": "#000000",
    "--vscode-terminal-ansiRed": "#cd3131",
    "--vscode-terminal-ansiGreen": "#0dbc79",
    "--vscode-terminal-ansiYellow": "#e5e510",
    "--vscode-terminal-ansiBlue": "#2472c8",
    "--vscode-terminal-ansiMagenta": "#bc3fbc",
    "--vscode-terminal-ansiCyan": "#11a8cd",
    "--vscode-terminal-ansiWhite": "#e5e5e5",
    "--vscode-terminal-ansiBrightBlack": "#666666",
    "--vscode-terminal-ansiBrightRed": "#f14c4c",
    "--vscode-terminal-ansiBrightGreen": "#23d18b",
    "--vscode-terminal-ansiBrightYellow": "#f5f543",
    "--vscode-terminal-ansiBrightBlue": "#3b8eea",
    "--vscode-terminal-ansiBrightMagenta": "#d670d6",
    "--vscode-terminal-ansiBrightCyan": "#29b8db",
    "--vscode-terminal-ansiBrightWhite": "#e5e5e5",
    "--vscode-badge-background": "#378cb2",
    "--vscode-badge-foreground": "#ffffff",
    "--vscode-panel-border": "#2a2b2c",
    "--vscode-sideBar-background": "#191a1b",
    "--vscode-activityBar-background": "#191a1b",
    "--vscode-editor-selectionBackground": "#245c74",
    "--vscode-editorCursor-foreground": "#ffff4d",
    "--vscode-editor-lineHighlightBackground": "#242526",
    "--vscode-textLink-foreground": "#48a0c7",
    "--vscode-textLink-activeForeground": "#53a5ca",
    "--vscode-scrollbarSlider-background": "rgba(131,132,133,0.2)",
    "--vscode-scrollbarSlider-hoverBackground": "rgba(131,132,133,0.4)",
    "--vscode-scrollbarSlider-activeBackground": "rgba(131,132,133,0.6)",
    "--vscode-font-family": "system-ui, 'Ubuntu', 'Droid Sans', sans-serif",
    "--vscode-font-size": "13px",
    "--vscode-editor-font-family": "'FiraCode Nerd Font'",
    "--vscode-icon-foreground": "#bbbebf",
    "--vscode-errorForeground": "#f14c4c",
    "--vscode-descriptionForeground": "#8c8c8c",
    "--vscode-focusBorder": "#297aa0",
    "--vscode-widget-shadow": "rgba(0,0,0,0.6)",
    "--vscode-foreground": "#bbbebf",
  },
};

// ---------------------------------------------------------------------------
// Theme Decorator — applies CSS vars to the story wrapper div
// ---------------------------------------------------------------------------

const withVSCodeTheme: Decorator = (Story, context) => {
  const themeName: string = context.globals["vstheme"] ?? "FluxTerm Dark";
  const vars = THEMES[themeName] ?? THEMES["FluxTerm Dark"];

  const style: React.CSSProperties = {
    backgroundColor: vars["--vscode-editor-background"],
    color: vars["--vscode-editor-foreground"],
    fontFamily: vars["--vscode-font-family"],
    fontSize: vars["--vscode-font-size"],
    minHeight: "100vh",
    padding: "0",
    ...(vars as React.CSSProperties),
  };

  return React.createElement(
    "div",
    {
      style,
      "data-vscode-theme": themeName,
    },
    React.createElement(Story)
  );
};

// ---------------------------------------------------------------------------
// Preview Config
// ---------------------------------------------------------------------------

const preview: Preview = {
  globalTypes: {
    vstheme: {
      description: "VS Code Color Theme",
      toolbar: {
        title: "VS Code Theme",
        icon: "paintbrush",
        items: Object.keys(THEMES).map((name) => ({ value: name, title: name })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    vstheme: "FluxTerm Dark",
  },
  decorators: [withVSCodeTheme],
  parameters: {
    layout: "fullscreen",
    backgrounds: { disable: true },
  },
};

export default preview;
