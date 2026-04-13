<div align="center">

# FlexBook

**Block-based Terminal Workflow inside VS Code**

_A notebook-style terminal where commands are structured, reusable, and composable._

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.110.0-007ACC?logo=visualstudiocode)](https://code.visualstudio.com/)
[![Version](https://img.shields.io/badge/version-1.0.0-success)](CHANGELOG.md)
[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/FlexBook.flexbook?label=Marketplace&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=FlexBook.flexbook)

![FlexBook Hero](https://raw.githubusercontent.com/0xdaksh-12/FlexBook/main/assets/screenshots/Hero.png)

</div>

---

<div align="center">
<video src="https://raw.githubusercontent.com/0xdaksh-12/FlexBook/main/assets/video/HomePage.webm" autoplay loop muted playsinline width="100%"></video>
</div>

## The Problem

Traditional terminals are **linear, non-reusable, and lack structure**.

Developers repeat the same commands manually, lose context after closing a session, and have no way to annotate, group, or reproduce a sequence of commands without copy-pasting from shell history.

---

## The Solution

FlexBook introduces **Command Blocks** — the atomic unit of execution:

- Each command runs in its own **isolated block** with its own shell process, CWD, and lifecycle
- **Output is preserved** per block, independently scrollable and searchable
- Blocks can be **re-run, edited, and structured** into named document groups
- Combine commands with **Markdown blocks** for inline documentation

It's a hybrid of a terminal, a notebook (like Jupyter), and a command workflow system — living directly inside VS Code.

---

## Core Features

- Block-Based Execution
- Inline Command Editing
- Output Virtualization
- CWD Editor with Autocomplete
- Markdown Blocks

---

## Installation

### From the Marketplace

[![Install in VS Code](https://img.shields.io/badge/Install-VS%20Code%20Marketplace-007ACC?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=FlexBook.flexbook)

Search **FlexBook** in the VS Code Extensions panel, or click the badge above.

### From VSIX

1. Download `flexbook-1.0.0.vsix` from [Releases](https://github.com/0xdaksh-12/FlexBook/releases)
2. Open VS Code → `Extensions` → `...` menu → **Install from VSIX...**
3. Select the downloaded file and reload

### From Source

```bash
git clone https://github.com/0xdaksh-12/FlexBook.git
cd FlexBook
pnpm install
```

Press `F5` in VS Code to launch the Extension Development Host.

---

## How to Use

```
1. Open FlexBook
   → Run "FlexBook: New File" from the Command Palette (Ctrl+Shift+P)
   → Or create a file with the .ftx extension

2. Type a command in the Command Block at the bottom
   → The Ghost Block is always ready for your next command

3. Press Enter to execute
   → Output renders inline below the block with full ANSI colors

4. View and search output
   → Click the search icon or hover to reveal the toolbar

5. Change the working directory
   → Double-click the path in the context bar
   → Use Tab/↑↓ for autocomplete, Enter to commit

6. Re-run or edit a block
   → Edit the command text directly, then press Enter
   → Or hover and click the Refresh button

7. Add Markdown documentation
   → Use the More menu on any block's toolbar
   → Select "Add Markdown Block"

8. Organize into groups
   → Commands are automatically grouped into named Document Groups
   → Double-click a group name to rename it
```

---

## Future Roadmap

```
Near-term
─────────
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

Crafted by [Daksh](https://github.com/0xdaksh-12) · Built with ❤️ for developers who care about workflow

</div>
