import { useCallback } from "react";
import { fluxBookService } from "../services/FluxBookService";
import {
  FluxBookContext,
  ResolvedShell,
  BlockDocumentMeta,
  FluxBookBlock,
} from "../../types/MessageProtocol";
import { generateId } from "../../utils/helper";

export const DEFAULT_DOC_NAME = "Workspace";

export interface UseAppActionsProps {
  blocks: FluxBookBlock[];
  baseContext: FluxBookContext;
  setDocuments: React.Dispatch<React.SetStateAction<BlockDocumentMeta[]>>;
  persistDocuments: (updated: BlockDocumentMeta[]) => void;
  createBlock: (
    cmd: string,
    shell: ResolvedShell,
    cwd: string,
    branch: string | null,
    documentId?: string,
  ) => string;
  runBlock: (
    blockId: string,
    cmd: string,
    shell: ResolvedShell,
    cwd: string,
    branch: string | null,
  ) => string | null;
  spliceBlockAfter: (
    afterBlockId: string,
    shell: ResolvedShell,
    cwd: string,
    branch: string | null,
    documentId?: string,
    command?: string,
    type?: "terminal" | "markdown",
  ) => string;
  deleteBlocksByDocumentId: (docId: string) => void;
  clearBlockOutput: (blockId: string) => void;
}

export function useAppActions({
  blocks,
  baseContext,
  setDocuments,
  persistDocuments,
  createBlock,
  runBlock,
  spliceBlockAfter,
  deleteBlocksByDocumentId,
  clearBlockOutput,
}: UseAppActionsProps) {
  const handleDocumentRename = useCallback(
    (docId: string, name: string) => {
      setDocuments((prev) => {
        const updated = prev.map((d) => (d.id === docId ? { ...d, name } : d));
        persistDocuments(updated);
        return updated;
      });
    },
    [persistDocuments, setDocuments],
  );

  const handleDeleteDocument = useCallback(
    (docId: string) => {
      deleteBlocksByDocumentId(docId);
      setDocuments((prev) => {
        const updated = prev.filter((d) => d.id !== docId);
        persistDocuments(updated);
        return updated;
      });
      fluxBookService.markDirty();
    },
    [deleteBlocksByDocumentId, persistDocuments, setDocuments],
  );

  const handleGhostSubmit = useCallback(
    (
      docId: string,
      cmd: string,
      shell: ResolvedShell | null,
      cwdOverride?: string,
    ) => {
      if (!shell || !cmd.trim()) {
        return;
      }
      const effectiveCwd = cwdOverride ?? baseContext.cwd;
      const blockId = createBlock(
        cmd,
        shell,
        effectiveCwd,
        baseContext.branch ?? null,
        docId,
      );
      fluxBookService.execute(blockId, cmd, shell, effectiveCwd);
      fluxBookService.markDirty();
    },
    [baseContext, createBlock],
  );

  const handleGhostDocSubmit = useCallback(
    (cmd: string, shell: ResolvedShell | null, cwdOverride?: string) => {
      if (!shell || !cmd.trim()) {
        return;
      }
      const newDocId = generateId();
      const newDoc: BlockDocumentMeta = {
        id: newDocId,
        name: DEFAULT_DOC_NAME,
      };
      setDocuments((prev) => {
        const updated = [...prev, newDoc];
        persistDocuments(updated);
        return updated;
      });
      const effectiveCwd = cwdOverride ?? baseContext.cwd;
      const blockId = createBlock(
        cmd,
        shell,
        effectiveCwd,
        baseContext.branch ?? null,
        newDocId,
      );
      fluxBookService.execute(blockId, cmd, shell, effectiveCwd);
      fluxBookService.markDirty();
    },
    [baseContext, createBlock, persistDocuments, setDocuments],
  );

  const handleBlockSubmit = useCallback(
    (
      blockId: string,
      cmd: string,
      shell: ResolvedShell | null,
      cwdOverride?: string,
    ) => {
      if (!shell || !cmd.trim()) {
        return;
      }
      const orig = blocks.find((b) => b.id === blockId);
      if (!orig) {
        return;
      }

      const effectiveCwd =
        cwdOverride ??
        (orig.status === "idle" ? orig.cwd : (orig.finalCwd ?? orig.cwd));

      const sameId = runBlock(
        blockId,
        cmd,
        shell,
        effectiveCwd,
        orig.branch ?? null,
      );
      if (!sameId) {
        return;
      }

      fluxBookService.execute(sameId, cmd, shell, effectiveCwd);
      fluxBookService.markDirty();
    },
    [blocks, runBlock],
  );

  const handleAddAfter = useCallback(
    (
      afterBlockId: string,
      docId: string,
      type: "terminal" | "markdown" = "terminal",
    ) => {
      const orig = blocks.find((b) => b.id === afterBlockId);
      if (!orig) {
        return;
      }
      spliceBlockAfter(
        afterBlockId,
        orig.shell,
        orig.finalCwd ?? orig.cwd,
        orig.finalBranch ?? orig.branch,
        docId,
        "",
        type,
      );
      fluxBookService.markDirty();
    },
    [blocks, spliceBlockAfter],
  );

  const handleReRun = useCallback(
    (
      blockId: string,
      cmd: string,
      cwd: string,
      shell: ResolvedShell | null,
    ) => {
      if (!shell) {
        return;
      }
      const orig = blocks.find((b) => b.id === blockId);
      if (!orig) {
        return;
      }
      const sameId = runBlock(blockId, cmd, shell, cwd, orig.branch ?? null);
      if (!sameId) {
        return;
      }
      fluxBookService.execute(sameId, cmd, shell, cwd);
      fluxBookService.markDirty();
    },
    [blocks, runBlock],
  );

  const handleClearOutput = useCallback(
    (blockId: string) => {
      clearBlockOutput(blockId);
      fluxBookService.markDirty();
    },
    [clearBlockOutput],
  );

  return {
    handleDocumentRename,
    handleDeleteDocument,
    handleGhostSubmit,
    handleGhostDocSubmit,
    handleBlockSubmit,
    handleAddAfter,
    handleReRun,
    handleClearOutput,
  };
}
