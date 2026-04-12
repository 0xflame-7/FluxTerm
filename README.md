<div align="center">

# FluxTerm

**Block-based Terminal Workflow inside VS Code**

*A notebook-style terminal where commands are structured, reusable, and composable.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.110.0-007ACC?logo=visualstudiocode)](https://code.visualstudio.com/)
[![Version](https://img.shields.io/badge/version-1.0.0-success)](CHANGELOG.md)

![FluxTerm Hero](assets/screenshots/01_empty_ui.png)

</div>

---

## The Problem

Traditional terminals are **linear, non-reusable, and lack structure**.

Developers repeat the same commands manually, lose context after closing a session, and have no way to annotate, group, or reproduce a sequence of commands without copy-pasting from shell history.

---

## The Solution

FluxTerm introduces **Command Blocks** — the atomic unit of execution:

- Each command runs in its own **isolated block** with its own shell process, CWD, and lifecycle
- **Output is preserved** per block, independently scrollable and searchable
- Blocks can be **re-run, edited, and structured** into named document groups
- Combine commands with **Markdown blocks** for inline documentation

It's a hybrid of a terminal, a notebook (like Jupyter), and a command workflow system — living directly inside VS Code.

---

## Core Features

### ⚡ Block-Based Execution

Every command runs inside a self-contained **Command Block** card. Each block has its own:
- Isolated shell process (bash, zsh, fish, pwsh, cmd)
- Independent working directory
- Full stdout/stderr capture with ANSI color rendering

Blocks are **not destroyed** after execution — they persist in your `.ftx` file so you can review, search, and re-run them at any time.

![Block-Based Execution](assets/screenshots/02_running_command.png)

---

### ✏️ Inline Command Editing

Type directly in the command block and press **Enter** to execute. After a block completes, you can **edit the command text inline** and press Enter again — FluxTerm creates a fresh execution with the updated command, keeping the original result intact.

- Supports multi-line commands
- stdin interaction: type input into a running block's prompt

---

### 📦 Output Virtualization

Long-running commands (e.g., `grep`, `find`, `npm install`) can produce thousands of output lines. FluxTerm uses **virtual rendering** via `react-window` to handle 1000+ line outputs without any UI lag.

- Output is capped at `300px` per block with an independent scroll container
- **Search within output**: press the search icon on any block to filter output lines with highlighted matches

![Output Search](assets/screenshots/03_output_search.png)

---

### 📂 CWD Editor with Autocomplete

Each block's context bar shows the current **working directory**. **Double-click the path** to enter edit mode:

- Type a partial path to get **live directory autocomplete** suggestions (debounced 200ms)
- Navigate suggestions with **Tab / ↑↓**, press **Enter** to commit
- **Ctrl+Click** (Cmd+Click on macOS) copies the path to the clipboard with a "Copied!" flash
- Invalid paths trigger a VS Code warning notification instead of silently failing

![CWD Autocomplete](assets/screenshots/04_cwd_dropdown.png)

---

### 📝 Markdown Blocks

Mix documentation with execution. Add a **Markdown Block** to any document group to write notes, headings, and instructions inline — rendered with full markdown formatting.

Perfect for documenting your command workflows, team runbooks, or project setup guides.

![Markdown Block](assets/screenshots/05_markdown_block.png)

---

### 🔁 Command Re-run & Isolation

Hover over any completed Command Block to reveal the **floating action toolbar**:

| Button | Action |
|--------|--------|
| ↺ Refresh | Re-run with current command text and CWD |
| 🔍 Search | Search within this block's output |
| ✕ Clear | Clear output (non-destructive — history preserved) |
| ＋ Add | Insert a new block immediately after this one |
| 🗑 Delete | Remove this block |

Re-running a block **never moves it** — results appear in-place with a timestamp header separating each run session.

![Floating Toolbar](assets/screenshots/06_toolbar_actions.png)

---

## Architecture

FluxTerm is built as a **VS Code Custom Editor Extension** (`.ftx` file format):

| Layer | Technology |
|-------|-----------|
| Extension Host | TypeScript, `vscode.CustomEditorProvider` |
| Execution Engine | Node.js `child_process`, PTY wrapper (`script`) on Unix |
| IPC Protocol | Typed `WebviewMessage` / `ExtMessage` JSON protocol |
| Webview UI | React 19, Tailwind CSS v4, `react-window` v2 |
| State Management | Immer-based store with Zustand-style selectors |
| Persistence | `.ftx` files (JSON), explicit VS Code save semantics |

The execution engine spawns **one shell process per block** — complete isolation guarantees that a hung block never affects others. On Unix, a `script` PTY wrapper ensures full ANSI color support for interactive programs.

---

## Installation

### From the Marketplace *(coming soon)*

Search `FluxTerm` in the VS Code Extensions panel.

### From VSIX

1. Download `fluxterm-1.0.0.vsix` from [Releases](https://github.com/0xflame-7/FluxTerm/releases)
2. Open VS Code → `Extensions` → `...` menu → **Install from VSIX...**
3. Select the downloaded file and reload

### From Source

```bash
git clone https://github.com/0xflame-7/FluxTerm.git
cd FluxTerm
pnpm install
```

Press `F5` in VS Code to launch the Extension Development Host.

---

## How to Use

```
1. Open FluxTerm
   → Run "FluxTerm: New File" from the Command Palette (Ctrl+Shift+P)
   → Or create a file with the .ftx extension

2. Type a command in the Command Block at the bottom
   → The Ghost Block is always ready for your next command

3. Press Enter to execute
   → Output renders inline below the block with full ANSI colors

4. View and search output
   → Click the 🔍 search icon or hover to reveal the toolbar

5. Change the working directory
   → Double-click the path in the context bar
   → Use Tab/↑↓ for autocomplete, Enter to commit

6. Re-run or edit a block
   → Edit the command text directly, then press Enter
   → Or hover and click the ↺ Refresh button

7. Add Markdown documentation
   → Use the ⋯ More menu on any block's toolbar
   → Select "Add Markdown Block"

8. Organize into groups
   → Commands are automatically grouped into named Document Groups
   → Double-click a group name to rename it
```

---

## Recording GIFs — Capture Guide

> Use **Peek** on Linux to record the following 4 GIFs (5–10 seconds each).

### GIF 1 — Execute a Command (`gif_01_execute.gif`)
1. Open a `.ftx` file
2. Click the ghost block command input
3. Type `echo "Hello FluxTerm"`
4. Press **Enter**
5. Watch the output render with the green text

### GIF 2 — CWD Autocomplete (`gif_02_cwd_autocomplete.gif`)
1. With a completed block visible, **double-click** the path in the context bar
2. The input activates — type `/home/` (partial path)
3. See the dropdown appear with directory suggestions
4. Press **Tab** to select the first suggestion
5. Press **Enter** to commit

### GIF 3 — Search Output (`gif_03_search_output.gif`)
1. Run `ls -la /usr` in a block and wait for completion
2. Hover over the block to show the toolbar
3. Click the **🔍 Search** icon
4. Type `bin` — see matching lines highlight in real-time

### GIF 4 — Add Block (`gif_04_add_block.gif`)
1. Hover over a completed block to reveal the toolbar
2. Click **＋ Add** — a new idle block appears directly below
3. Type `pwd` in the new block
4. Press **Enter** to execute

**Peek settings**: 15fps, no cursor, output folder `assets/screenshots/`

---

## Future Roadmap

```
Near-term
─────────
□ Command persistence across VS Code sessions (Block Documents saved to .ftx)
□ Sidebar command library — saved, named, reusable command snippets
□ Block grouping and pipelines (pipe output of one block into next)

Medium-term
───────────
□ Environment variable support per document group
□ Remote execution support via SSH (leverage VS Code Remote)
□ Block export to shell script or Markdown

Long-term
─────────
□ AI-assisted command suggestions (GitHub Copilot integration)
□ Collaborative .ftx sessions via VS Code Live Share
```

---

## License

Licensed under the [Apache License 2.0](LICENSE).

---

<div align="center">

Crafted by [Daksh](https://github.com/0xflame-7) · Built with ❤️ for developers who care about workflow

</div>
