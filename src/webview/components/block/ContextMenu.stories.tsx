import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMenu } from "./ContextMenu";
import type { FluxTermBlock } from "../../../types/MessageProtocol";

// ---------------------------------------------------------------------------
// Shared mock block factory
// ---------------------------------------------------------------------------

const makeBlock = (status: FluxTermBlock["status"]): FluxTermBlock => ({
  id: "block-001",
  seq: 1,
  command: "npm run build",
  shell: {
    id: "bash",
    label: "bash",
    path: "/bin/bash",
    args: [],
    icon: "codicon-terminal-bash",
  },
  cwd: "/home/user/project",
  branch: "main",
  status,
  output: [
    { type: "stdout", text: "Building project..." },
    { type: "stdout", text: "Compiled successfully." },
  ],
  exitCode: status === "done" ? 0 : status === "error" ? 1 : null,
  finalCwd: status !== "running" ? "/home/user/project" : null,
  finalBranch: status !== "running" ? "main" : null,
  createdAt: Date.now(),
});

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ContextMenu> = {
  title: "Block/ContextMenu",
  component: ContextMenu,
  parameters: {
    layout: "centered",
  },
  args: {
    onCopyOutput: () => console.log("[story] copy output"),
    onReRun: () => console.log("[story] re-run"),
    onKill: () => console.log("[story] kill"),
    onDelete: () => console.log("[story] delete"),
    onClose: () => console.log("[story] close"),
  },
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Block is idle — "Kill Process" is disabled. */
export const Idle: Story = {
  args: {
    block: makeBlock("idle"),
  },
};

/** Block is actively running — "Kill Process" is enabled. */
export const Running: Story = {
  args: {
    block: makeBlock("running"),
  },
};

/** Block has completed — all actions available, Kill disabled. */
export const Done: Story = {
  args: {
    block: makeBlock("done"),
  },
};
