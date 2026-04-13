import { useEffect, useState, useCallback } from "react";
import { produce } from "immer";
import { fluxBookService } from "../services/FluxBookService";
import {
  FluxBookDocument,
  FluxBookContext,
  FluxBookBlock,
} from "../../types/MessageProtocol";

const DEFAULT_CONTEXT: FluxBookContext = {
  cwd: "",
  branch: null,
  shell: null,
  connection: "local",
};

export interface UseFluxBookDocumentReturn {
  /** The persisted document preferences (shell, cwd, branch) and optional saved blocks. */
  document: FluxBookDocument;
  /** The live runtime context detected by the extension (real cwd, git branch). */
  context: FluxBookContext;
  /**
   * Update document preferences using an Immer producer.
   * Changes are immediately persisted to disk (suitable for preference fields
   * like shell selection — not for block output streaming).
   */
  updateDocument: (producer: (draft: FluxBookDocument) => void) => void;
  /**
   * Explicitly save the full notebook state to disk.
   * Call this only on deliberate user save actions, not on execution events.
   */
  saveDocument: (blocks: FluxBookBlock[], runtimeContext: FluxBookContext) => void;
}

/**
 * Manages document-level state: the saved FluxBookDocument and the live FluxBookContext
 * received from the extension on init.
 *
 * Responsibilities:
 *   - Request initial state from the extension on mount.
 *   - Store the document preferences (shell, cwd, branch) and saved blocks.
 *   - Store the live context (working directory and git branch detected by the
 *     extension at open time).
 *   - Provide updateDocument() for immediate preference changes that should
 *     auto-persist (e.g. shell selection).
 *   - Provide saveDocument() for the explicit notebook save action.
 */
export const useFluxBookDocument = (): UseFluxBookDocumentReturn => {
  const [document, setDocument] = useState<FluxBookDocument>({});
  const [context, setContext] = useState<FluxBookContext>(DEFAULT_CONTEXT);

  useEffect(() => {
    const unsubscribe = fluxBookService.subscribe((message: any) => {
      if (message.type === "init") {
        // doc may include saved blocks/runtimeContext from a previous explicit save
        setDocument(message.document ?? {});
        setContext(message.context ?? DEFAULT_CONTEXT);
      }
      // Note: the extension does NOT send an "update" message to the webview.
      // Document state is managed locally and persisted via explicit save only.
    });

    // Kick-start: ask the extension for the initial state and live context.
    fluxBookService.init();

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Update a preference field (e.g. shell selection) and auto-persist.
   * Uses an Immer producer for safe immutable updates.
   */
  const updateDocument = useCallback(
    (producer: (draft: FluxBookDocument) => void) => {
      setDocument((prev) => {
        const next = produce(prev, producer);
        // Auto-persist preference changes immediately
        fluxBookService.saveDocument(next);
        return next;
      });
    },
    [],
  );

  /**
   * Persist the full notebook state to disk.
   * This is an intentional user action — not triggered by streaming events.
   */
  const saveDocument = useCallback(
    (blocks: FluxBookBlock[], runtimeContext: FluxBookContext) => {
      setDocument((prev) => {
        const next: FluxBookDocument = {
          ...prev,
          blocks,
          runtimeContext,
        };
        fluxBookService.saveDocument(next);
        return next;
      });
    },
    [],
  );

  return { document, context, updateDocument, saveDocument };
};
