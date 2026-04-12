import React, { useState } from "react";
import { Block } from "./block";
import { BlockDocument } from "./BlockDocument";
import { FluxTermContext, ResolvedShell } from "../../types/MessageProtocol";
import { fluxTermService } from "../services/FluxTermService";
import { generateId } from "../../utils/helper";
import { DEFAULT_DOC_NAME } from "../hooks/useAppActions";
import { BlockDocumentMeta } from "../../types/MessageProtocol";

export interface GhostDocumentGroupProps {
  shells: ResolvedShell[];
  baseContext: FluxTermContext;
  setDocuments: React.Dispatch<React.SetStateAction<BlockDocumentMeta[]>>;
  persistDocuments: (updated: BlockDocumentMeta[]) => void;
  spliceBlockAfter: (
    afterBlockId: string,
    shell: ResolvedShell,
    cwd: string,
    branch: string | null,
    documentId?: string,
    command?: string,
    type?: "terminal" | "markdown"
  ) => string;
  createBlock: (cmd: string, shell: ResolvedShell, cwd: string, branch: string | null, documentId?: string) => string;
}

export function GhostDocumentGroup({
  shells,
  baseContext,
  setDocuments,
  persistDocuments,
  spliceBlockAfter,
  createBlock,
}: GhostDocumentGroupProps) {
  const [ghostDocCommand, setGhostDocCommand] = useState("");
  const [ghostDocCwd, setGhostDocCwd] = useState("");

  const handleGhostDocSubmit = (cmd: string, shell: ResolvedShell | null, cwdOverride?: string) => {
    if (!shell || !cmd.trim()) return;
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
    const effectiveCwd = cwdOverride ?? (ghostDocCwd || baseContext.cwd);
    const blockId = createBlock(
      cmd,
      shell,
      effectiveCwd,
      baseContext.branch ?? null,
      newDocId,
    );
    fluxTermService.execute(blockId, cmd, shell, effectiveCwd);
    setGhostDocCommand("");
    setGhostDocCwd("");
    fluxTermService.markDirty();
  };

  return (
    <BlockDocument
      key="ghost-doc"
      groupName={DEFAULT_DOC_NAME}
      isGhost
      isAnyRunning={false}
      onRunAll={() => {}}
      onDelete={() => {}}
    >
      <Block
        key="ghost-doc-block"
        block={null}
        isGhost
        ghostCommand={ghostDocCommand}
        onGhostCommandChange={setGhostDocCommand}
        onSubmit={(cmd, shell, cwdOverride) =>
          handleGhostDocSubmit(cmd, shell, cwdOverride)
        }
        context={baseContext}
        availableShells={shells}
        onShellChange={() => {}}
        onAddAfter={(cmd, cwd, shell, type) => {
          if (cmd.trim() && shell) {
            const newDocId = generateId();
            setDocuments((prev) => {
              const updated = [...prev, { id: newDocId, name: DEFAULT_DOC_NAME }];
              persistDocuments(updated);
              return updated;
            });
            const effectiveCwd = ghostDocCwd || baseContext.cwd;
            spliceBlockAfter(
              "append",
              shell,
              effectiveCwd,
              baseContext.branch ?? null,
              newDocId,
              cmd,
              type
            );
            setGhostDocCommand("");
            setGhostDocCwd("");
            fluxTermService.markDirty();
          }
        }}
        onCwdChange={setGhostDocCwd}
      />
    </BlockDocument>
  );
}
