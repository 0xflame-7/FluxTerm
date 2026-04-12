import React, { useState } from "react";
import { Block, MarkdownBlock } from "./block";
import { BlockDocument } from "./BlockDocument";
import {
  FluxTermContext,
  ResolvedShell,
  BlockDocumentMeta,
  FluxTermBlock,
} from "../../types/MessageProtocol";
import { fluxTermService } from "../services/FluxTermService";

export interface DocumentGroupProps {
  doc: BlockDocumentMeta;
  docBlocks: FluxTermBlock[];
  shells: ResolvedShell[];
  baseContext: FluxTermContext;
  updateBlockCwd: (blockId: string, cwd: string) => void;
  updateBlockCommand: (blockId: string, command: string) => void;
  deleteBlock: (blockId: string) => void;
  spliceBlockAfter: (
    afterBlockId: string,
    shell: ResolvedShell,
    cwd: string,
    branch: string | null,
    documentId?: string,
    command?: string,
    type?: "terminal" | "markdown",
  ) => string;
  actions: {
    handleDocumentRename: (docId: string, name: string) => void;
    handleDeleteDocument: (docId: string) => void;
    handleGhostSubmit: (
      docId: string,
      cmd: string,
      shell: ResolvedShell | null,
      cwdOverride?: string,
    ) => void;
    handleBlockSubmit: (
      blockId: string,
      cmd: string,
      shell: ResolvedShell | null,
      cwdOverride?: string,
    ) => void;
    handleAddAfter: (
      afterBlockId: string,
      docId: string,
      type?: "terminal" | "markdown",
    ) => void;
    handleReRun: (
      blockId: string,
      cmd: string,
      cwd: string,
      shell: ResolvedShell | null,
    ) => void;
    handleClearOutput: (blockId: string) => void;
  };
}

export function DocumentGroup({
  doc,
  docBlocks,
  shells,
  baseContext,
  updateBlockCwd,
  updateBlockCommand,
  deleteBlock,
  spliceBlockAfter,
  actions,
}: DocumentGroupProps) {
  // Localized ghost text parsing
  const [ghostCmd, setGhostCmd] = useState("");
  // Localized ghost cwd tracking previously dict-mapped
  const [ghostCwd, setGhostCwd] = useState("");

  const isAnyRunning = docBlocks.some((b) => b.status === "running");

  // BUG 4 FIX: ghost block CWD inherits from the last completed block in THIS document
  const lastDocCwd =
    docBlocks.filter((b) => b.finalCwd).at(-1)?.finalCwd ?? baseContext.cwd;

  return (
    <BlockDocument
      key={doc.id}
      groupName={doc.name}
      onGroupNameChange={(name) => actions.handleDocumentRename(doc.id, name)}
      isAnyRunning={isAnyRunning}
      onRunAll={() => {
        docBlocks
          .filter((b) => b.status === "done" || b.status === "error")
          .forEach((b) =>
            actions.handleReRun(b.id, b.command, b.finalCwd ?? b.cwd, b.shell),
          );
      }}
      onDelete={() => actions.handleDeleteDocument(doc.id)}
    >
      {/* Real blocks — each gets its own per-block context (shell from block.shell) */}
      {docBlocks.map((block) =>
        block.type === "markdown" ? (
          <MarkdownBlock
            key={block.id}
            block={block}
            onUpdate={(text) => {
              updateBlockCommand(block.id, text);
              fluxTermService.markDirty();
            }}
            onDelete={() => {
              deleteBlock(block.id);
              fluxTermService.markDirty();
            }}
            onAddTerminalAfter={() =>
              actions.handleAddAfter(block.id, doc.id, "terminal")
            }
            onAddMarkdownAfter={() =>
              actions.handleAddAfter(block.id, doc.id, "markdown")
            }
          />
        ) : (
          <Block
            key={block.id}
            block={block}
            context={{ ...baseContext, shell: block.shell }}
            availableShells={shells}
            onShellChange={() => {}}
            onSubmit={(cmd, shell, cwdOverride) =>
              actions.handleBlockSubmit(block.id, cmd, shell, cwdOverride)
            }
            onDelete={() => {
              deleteBlock(block.id);
              fluxTermService.markDirty();
            }}
            onReRun={(cmd, cwd, shell) =>
              actions.handleReRun(block.id, cmd, cwd, shell)
            }
            onClearOutput={() => actions.handleClearOutput(block.id)}
            onAddAfter={(cmd, cwd, shell, type) =>
              actions.handleAddAfter(block.id, doc.id, type)
            }
            onKill={() => fluxTermService.killBlock(block.id)}
            onCwdChange={(newCwd) => {
              if (block.status === "idle") updateBlockCwd(block.id, newCwd);
            }}
          />
        ),
      )}

      {/* Ghost Block — trailing entry surface for this document */}
      <Block
        key={`ghost-${doc.id}`}
        block={null}
        isGhost
        ghostCommand={ghostCmd}
        onGhostCommandChange={setGhostCmd}
        onSubmit={(cmd, shell, cwdOverride) => {
          actions.handleGhostSubmit(doc.id, cmd, shell, cwdOverride);
          setGhostCmd("");
          setGhostCwd(""); // Ensure cwd override is also wiped when ghost block cycles
        }}
        context={{ ...baseContext, cwd: lastDocCwd }}
        availableShells={shells}
        onShellChange={() => {}}
        onAddAfter={(cmd, cwd, shell, type) => {
          if (cmd.trim() && shell) {
            const effectiveCwd = ghostCwd || lastDocCwd;
            spliceBlockAfter(
              "append",
              shell,
              effectiveCwd,
              baseContext.branch ?? null,
              doc.id,
              cmd,
              type,
            );
            setGhostCmd("");
            setGhostCwd("");
            fluxTermService.markDirty();
          } else {
            const last = docBlocks[docBlocks.length - 1];
            if (last) actions.handleAddAfter(last.id, doc.id, type);
          }
        }}
        onCwdChange={setGhostCwd}
      />
    </BlockDocument>
  );
}
