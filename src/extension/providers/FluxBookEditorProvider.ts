import * as vscode from "vscode";
import { Ext } from "../../utils/logger";
import { getNonce } from "../../utils/helper";
import { FluxBookDocumentSession } from "../services/FluxBookDocumentSession";
import { FluxBookCustomDocument } from "../models/FluxBookCustomDocument";
import { FluxBookDocument } from "../../types/MessageProtocol";

export class FluxBookEditorProvider implements vscode.CustomEditorProvider<FluxBookCustomDocument> {
  // Map of webview panel to its session
  private sessions = new Map<vscode.WebviewPanel, FluxBookDocumentSession>();

  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentEditEvent<FluxBookCustomDocument>
  >();
  public readonly onDidChangeCustomDocument =
    this._onDidChangeCustomDocument.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public getSessionForUri(
    uri: vscode.Uri,
  ): FluxBookDocumentSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.document.uri.toString() === uri.toString()) {
        return session;
      }
    }
    return undefined;
  }

  public async openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    _token: vscode.CancellationToken,
  ): Promise<FluxBookCustomDocument> {
    // Read initial data from disk
    let documentData: FluxBookDocument = {};
    try {
      const fileData = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(fileData).toString("utf8");
      if (text.trim()) {
        documentData = JSON.parse(text);
      }
    } catch (e) {
      Ext.warn(
        `[FlexBook EditorProvider] Could not parse .ftx file at ${uri.fsPath}; starting fresh`,
      );
      documentData = {};
    }

    // Safety-net: if any blocks were persisted with status="running" (e.g. the
    // session was killed mid-execution before the webview could update), reset
    // them to "error" so they don't show a phantom spinner on re-open.
    if (documentData.blocks) {
      for (const block of documentData.blocks) {
        if (block.status === "running") {
          block.status = "error";
        }
      }
    }

    return new FluxBookCustomDocument(uri, documentData);
  }

  public async resolveCustomEditor(
    document: FluxBookCustomDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    // Create new session for this document + panel
    const session = new FluxBookDocumentSession(
      document,
      webviewPanel,
      this.context,
    );
    this.sessions.set(webviewPanel, session);

    // Setup Webview HTML
    this.setupWebview(webviewPanel);

    // Listen for in-memory updates from the webview session to mark document dirty
    const updateDisposable = session.onDidUpdateDocument((newData) => {
      // Update the document's in-memory model
      document.update(newData);

      // Fire the change event to tell VS Code the document is dirty.
      // We provide dummy undo/redo functions as we don't fully support VS Code's undo stack yet.
      this._onDidChangeCustomDocument.fire({
        document,
        undo: () => {},
        redo: () => {},
      });
    });

    // Cleanup on panel disposal
    webviewPanel.onDidDispose(() => {
      Ext.info("Disposing session");
      updateDisposable.dispose();
      session.dispose();
      this.sessions.delete(webviewPanel);
    });
  }

  public async saveCustomDocument(
    document: FluxBookCustomDocument,
    cancellation: vscode.CancellationToken,
  ): Promise<void> {
    Ext.info(
      `[FlexBook EditorProvider] Saving document: ${document.uri.fsPath}`,
    );
    await this.saveAs(document, document.uri);
  }

  public async saveCustomDocumentAs(
    document: FluxBookCustomDocument,
    destination: vscode.Uri,
    cancellation: vscode.CancellationToken,
  ): Promise<void> {
    Ext.info(
      `[FlexBook EditorProvider] Saving document AS: ${destination.fsPath}`,
    );
    await this.saveAs(document, destination);
  }

  public async revertCustomDocument(
    document: FluxBookCustomDocument,
    cancellation: vscode.CancellationToken,
  ): Promise<void> {
    Ext.info(
      `[FlexBook EditorProvider] Reverting document: ${document.uri.fsPath}`,
    );
    // Re-read from disk
    const fileData = await vscode.workspace.fs.readFile(document.uri);
    const text = Buffer.from(fileData).toString("utf8");
    let documentData: FluxBookDocument = {};
    if (text.trim()) {
      try {
        documentData = JSON.parse(text);
      } catch (e) {
        documentData = {};
      }
    }
    document.update(documentData);

    // Notify all sessions attached to this document that it reverted
    for (const [panel, session] of this.sessions.entries()) {
      if (session.document.uri.toString() === document.uri.toString()) {
        session.revert(documentData);
      }
    }
  }

  public async backupCustomDocument(
    document: FluxBookCustomDocument,
    context: vscode.CustomDocumentBackupContext,
    cancellation: vscode.CancellationToken,
  ): Promise<vscode.CustomDocumentBackup> {
    Ext.info(
      `[FlexBook EditorProvider] Backing up document: ${document.uri.fsPath}`,
    );
    const backupData = Buffer.from(
      JSON.stringify(document.documentData, null, 2),
    );
    await vscode.workspace.fs.writeFile(context.destination, backupData);
    return {
      id: context.destination.toString(),
      delete: async () => {
        try {
          await vscode.workspace.fs.delete(context.destination);
        } catch {
          // ignore error if it doesn't exist
        }
      },
    };
  }

  private async saveAs(
    document: FluxBookCustomDocument,
    destination: vscode.Uri,
  ): Promise<void> {
    // Find an active session for this document
    let activeSession: FluxBookDocumentSession | undefined;
    for (const session of this.sessions.values()) {
      if (session.document.uri.toString() === document.uri.toString()) {
        activeSession = session;
        break;
      }
    }

    if (activeSession) {
      await activeSession.save(destination);
    } else {
      // Fallback if no active session
      const json = JSON.stringify(document.documentData, null, 2);
      await vscode.workspace.fs.writeFile(destination, Buffer.from(json));
    }
  }

  /**
   * Configure webview options and load HTML
   */
  private setupWebview(panel: vscode.WebviewPanel) {
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "dist"),
        vscode.Uri.joinPath(this.context.extensionUri, "node_modules"),
      ],
    };
    panel.webview.html = this.getHtmlForWebview(panel.webview);
  }

  /**
   * Generate HTML for the webview
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.css"),
    );
    const codiconsUri =
      this.context.extensionMode === vscode.ExtensionMode.Development
        ? webview.asWebviewUri(
            vscode.Uri.joinPath(
              this.context.extensionUri,
              "node_modules",
              "@vscode/codicons",
              "dist",
              "codicon.css",
            ),
          )
        : webview.asWebviewUri(
            vscode.Uri.joinPath(
              this.context.extensionUri,
              "dist",
              "codicons",
              "codicon.css",
            ),
          );

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource};">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FlexBook Editor</title>
      <link href="${styleUri}" rel="stylesheet">
      <link href="${codiconsUri}" rel="stylesheet" />
      <style>
        body {
          margin: 0;
          padding: 0;
          overflow: auto;
          background-color: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          font-family: var(--vscode-font-family);
        }
        #root {
          width: 100%;
          min-height: 100vh;
        }
      </style>
    </head>
    <body>
      <div id="root"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}
