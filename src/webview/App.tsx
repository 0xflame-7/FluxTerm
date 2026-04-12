import { useEffect, useRef, useCallback, useState } from "react";
import { useFluxTermDocument } from "./hooks/useFluxTermDocument";
import { useShellConfig } from "./hooks/useShellConfig";
import { useNotebook } from "./store/notebookStore";
import { useBlockExecution } from "./hooks/useBlockExecution";
import { fluxTermService } from "./services/FluxTermService";
import { DocumentGroup } from "./components/DocumentGroup";
import { GhostDocumentGroup } from "./components/GhostDocumentGroup";
import { useAppActions } from "./hooks/useAppActions";
import { FluxTermContext, BlockDocumentMeta } from "../types/MessageProtocol";

const ANIM_CSS = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
`;

const DEFAULT_DOC_NAME = "Workspace";

export default function App() {
  const { document, context: docContext, updateDocument } = useFluxTermDocument();
  const { shells } = useShellConfig();

  const {
    blocks,
    runtimeContext,
    createBlock,
    appendOutput,
    setBlockStatus,
    completeBlock,
    deleteBlocksByDocumentId,
    deleteBlock,
    runBlock,
    clearBlockOutput,
    setRuntimeContext,
    resetNotebook,
    spliceBlockAfter,
    updateBlockCwd,
    updateBlockCommand,
  } = useNotebook(docContext, []);

  // Document Groups state
  const [documents, setDocuments] = useState<BlockDocumentMeta[]>([]);

  // Sync runtime context from extension init
  useEffect(() => {
    setRuntimeContext(docContext);
  }, [docContext, setRuntimeContext]);

  // Restore saved blocks + documents from previously saved .ftx session
  useEffect(() => {
    if (document.blocks && document.blocks.length > 0 && document.runtimeContext) {
      resetNotebook(document.blocks, document.runtimeContext);
    } else if (docContext.cwd) {
      setRuntimeContext(docContext);
    }

    if (document.documents && document.documents.length > 0) {
      setDocuments(document.documents);
    } else if (document.blocks && document.blocks.length > 0) {
      const seen = new Set<string>();
      const synth: BlockDocumentMeta[] = [];
      for (const b of document.blocks as any[]) {
        const id = b.documentId ?? "default";
        if (!seen.has(id)) {
          seen.add(id);
          synth.push({ id, name: DEFAULT_DOC_NAME });
        }
      }
      setDocuments(synth);
    }
  }, [docContext.cwd]);

  // Wire execution events from extension to notebookStore
  useBlockExecution({ appendOutput, completeBlock, setBlockStatus });

  // Keep a ref to the latest data for the requestSave handler
  const latestDataRef = useRef({ blocks, runtimeContext, document, documents });
  useEffect(() => {
    latestDataRef.current = { blocks, runtimeContext, document, documents };
  }, [blocks, runtimeContext, document, documents]);

  // Handle requestSave from extension
  useEffect(() => {
    const unsubscribe = fluxTermService.subscribe((message: any) => {
      if (message.type === "requestSave") {
        const d = latestDataRef.current;
        fluxTermService.sendSaveResponse({
          ...d.document,
          blocks: d.blocks,
          runtimeContext: d.runtimeContext,
          documents: d.documents,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Inject animation CSS once
  const styleInjected = useRef(false);
  if (!styleInjected.current) {
    styleInjected.current = true;
    const style = window.document.createElement("style");
    style.textContent = ANIM_CSS;
    window.document.head.appendChild(style);
  }

  const baseContext: FluxTermContext = {
    cwd: runtimeContext.cwd || docContext.cwd || "",
    branch: runtimeContext.branch ?? docContext.branch ?? null,
    shell: runtimeContext.shell ?? null,
    connection: runtimeContext.connection ?? "local",
  };

  const persistDocuments = useCallback(
    (updated: BlockDocumentMeta[]) => {
      updateDocument((draft) => {
        draft.documents = updated;
      });
    },
    [updateDocument]
  );

  const actions = useAppActions({
    blocks: Array.isArray(blocks) ? blocks : [],
    baseContext,
    setDocuments,
    persistDocuments,
    createBlock,
    runBlock,
    spliceBlockAfter,
    deleteBlocksByDocumentId,
    clearBlockOutput,
  });

  // E2E test hook
  useEffect(() => {
    const handleTestMessage = (e: MessageEvent<any>) => {
      const msg = e.data;
      if (msg.type === "testRunCommand" && msg.command) {
        actions.handleGhostDocSubmit(msg.command, shells[0] ?? null);
      } else if (msg.type === "testInputText" && msg.text) {
        const runningBlock = Array.isArray(blocks)
          ? blocks.find((b) => b.status === "running")
          : null;
        if (runningBlock) fluxTermService.sendInput(runningBlock.id, msg.text);
      }
    };
    window.addEventListener("message", handleTestMessage);
    return () => window.removeEventListener("message", handleTestMessage);
  }, [actions, blocks, shells]);

  const orderedBlocks = Array.isArray(blocks) ? blocks : [];

  return (
    <div
      className="flex flex-col font-mono text-sm antialiased"
      style={{
        background: "var(--vscode-editor-background)",
        color: "var(--vscode-editor-foreground)",
        padding: "1rem",
        boxSizing: "border-box",
        gap: "1rem",
        minHeight: "100%",
      }}
    >
      {/* Real documents */}
      {documents.map((doc) => {
        const docBlocks = orderedBlocks.filter(
          (b) => (b.documentId ?? "default") === doc.id
        );

        return (
          <DocumentGroup
            key={doc.id}
            doc={doc}
            docBlocks={docBlocks}
            shells={shells}
            baseContext={baseContext}
            updateBlockCwd={updateBlockCwd}
            updateBlockCommand={updateBlockCommand}
            deleteBlock={deleteBlock}
            spliceBlockAfter={spliceBlockAfter}
            actions={actions}
          />
        );
      })}

      {/* Ghost BlockDocument — always at the bottom, dimmed */}
      <GhostDocumentGroup
        shells={shells}
        baseContext={baseContext}
        setDocuments={setDocuments}
        persistDocuments={persistDocuments}
        spliceBlockAfter={spliceBlockAfter}
        createBlock={createBlock}
      />
    </div>
  );
}
