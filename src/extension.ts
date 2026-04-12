import * as vscode from "vscode";

import { FluxTermEditorProvider } from "./extension/providers/FluxTermEditorProvider";

const WALKTHROUGH_SHOWN_KEY = "fluxterm.walkthroughShown";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "fluxterm" is now active!');

  // On first install: auto-open the Getting Started walkthrough.
  // Guard to Production mode only — vscode-test runs in Test mode and the
  // walkthrough command hangs the extension host in a headless environment.
  if (context.extensionMode === vscode.ExtensionMode.Production) {
    const hasShownWalkthrough = context.globalState.get<boolean>(
      WALKTHROUGH_SHOWN_KEY,
      false,
    );
    if (!hasShownWalkthrough) {
      context.globalState.update(WALKTHROUGH_SHOWN_KEY, true);
      // Slight delay so the editor is fully ready before opening the walkthrough
      setTimeout(() => {
        vscode.commands.executeCommand(
          "workbench.action.openWalkthrough",
          "0xflame-7.fluxterm#fluxterm.gettingStarted",
          false,
        );
      }, 1500);
    }
  }

  // Register the custom editor provider for .ftx files
  const provider = new FluxTermEditorProvider(context);
  const editorProvider = vscode.window.registerCustomEditorProvider(
    "fluxterm.editor",
    provider,
    {
      supportsMultipleEditorsPerDocument: true,
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    },
  );

  // Register command to create new .ftx file
  const newFileCommand = vscode.commands.registerCommand(
    "fluxterm.newFile",
    async (uriArg?: vscode.Uri) => {
      const uri =
        uriArg && uriArg instanceof vscode.Uri
          ? uriArg
          : await vscode.window.showSaveDialog({
              filters: { "FluxTerm Files": ["ftx"] },
              defaultUri: vscode.Uri.file("untitled.ftx"),
            });

      if (uri) {
        // Write default document structure
        await vscode.workspace.fs.writeFile(
          uri,
          Buffer.from(JSON.stringify({}, null, 2)),
        );
        // Open with FluxTerm editor
        await vscode.commands.executeCommand(
          "vscode.openWith",
          uri,
          "fluxterm.editor",
        );
      }
    },
  );

  // Add all disposables to subscriptions
  context.subscriptions.push(editorProvider, newFileCommand);

  // Development: Auto-reload on file changes
  if (context.extensionMode === vscode.ExtensionMode.Development) {
    const watcher = vscode.workspace.createFileSystemWatcher("**/dist/**/*.js");
    watcher.onDidChange(() => {
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    });
    context.subscriptions.push(watcher);
  }

  // Return API for headess E2E electron testing
  return {
    getProvider: () => provider,
  };
}
export function deactivate() {}
