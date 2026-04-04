import type { Meta, StoryObj } from "@storybook/react-vite";
import { InputSection } from "./InputSection";
import type { FluxTermContext, ResolvedShell } from "../../../types/MessageProtocol";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const shells: ResolvedShell[] = [
  {
    id: "bash",
    label: "bash",
    path: "/bin/bash",
    args: [],
    icon: "codicon-terminal-bash",
  },
  {
    id: "zsh",
    label: "zsh",
    path: "/bin/zsh",
    args: [],
    icon: "codicon-terminal",
  },
  {
    id: "fish",
    label: "fish",
    path: "/usr/bin/fish",
    args: [],
    icon: "codicon-terminal",
  },
  {
    id: "node",
    label: "node",
    path: "/usr/bin/node",
    args: [],
    icon: "codicon-terminal-cmd",
  },
];

const baseContext: FluxTermContext = {
  cwd: "/home/user/FluxTerm",
  branch: null,
  shell: shells[0],
  connection: "local",
};

const contextWithBranch: FluxTermContext = {
  ...baseContext,
  branch: "feat/storybook-integration",
};

const noShellContext: FluxTermContext = {
  cwd: "/home/user/FluxTerm",
  branch: null,
  shell: null,
  connection: "local",
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof InputSection> = {
  title: "Input/InputSection",
  component: InputSection,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onRun: (cmd) => console.log("[story] run:", cmd),
    onShellChange: (shell) => console.log("[story] shell changed:", shell.label),
    onCwdChange: (cwd) => console.log("[story] cwd changed:", cwd),
    availableShells: shells,
    isRunning: false,
  },
};

export default meta;
type Story = StoryObj<typeof InputSection>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Shell selected, idle, ready to type a command. */
export const Default: Story = {
  args: {
    context: baseContext,
  },
};

/** Shell selected and a git branch is displayed in the context bar. */
export const WithGitBranch: Story = {
  args: {
    context: contextWithBranch,
  },
};

/**
 * `isRunning=true` — input and shell selector are disabled.
 * The placeholder shows "Running...".
 */
export const Running: Story = {
  args: {
    context: baseContext,
    isRunning: true,
  },
};

/**
 * No shells resolved yet — shows loading skeleton pulse in the selector button.
 * Input placeholder says "Select a shell to enter commands...".
 */
export const NoShells: Story = {
  args: {
    context: noShellContext,
    availableShells: [],
  },
};

/**
 * Multiple shells available — demonstrates the shell switcher dropdown
 * with codicon icons and checkmarks.
 * Click the shell selector button to open the dropdown.
 */
export const MultipleShells: Story = {
  args: {
    context: {
      ...baseContext,
      shell: shells[1], // zsh pre-selected
    },
    availableShells: shells,
  },
};
