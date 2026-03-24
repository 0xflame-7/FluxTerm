<h1 align="center">
  <br>
  <img src="assets/icon.png" alt="Flow Logo" width="128">
  <br>
  Flow
  <br>
</h1>

<h4 align="center">A modern VS Code extension that reimagines the terminal experience.</h4>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#license">License</a>
</p>

---

## What is Flow?

**Flow** is a next-generation terminal and execution environment directly integrated into VS Code. Inspired by standalone terminal emulators like Warp and Wave, Flow brings a powerful, intelligent, and seamless terminal workflow right to your editor workspace.

By structuring terminal output as discrete executable blocks rather than an unmanageable continuous stream of text, Flow enables you to isolate, review, and reproduce commands effortlessly.

![Flow Interface](https://via.placeholder.com/800x450.png?text=Flow+Terminal+Preview) <!-- Placeholder for actual screenshot -->

## Features

- **Blazing Fast Native Execution:** Under the hood, Flow uses native PTY layers on Unix environments to ensure standard ANSI coloring and full compatibility with your standard CLI tools.
- **Intelligent Autocomplete:** Accelerate your workflow with smart, context-aware command suggestions.
- **Multi-log Monitoring:** Split views and seamlessly track multiple outputs concurrently with the intuitive drag-and-drop Block UI.
- **Powerful Command Chaining:** Combine sequences of commands directly in the Flow canvas.
- **Rich Output Rendering:** Automatically renders ANSI color sequences perfectly, mapping them to your active VS Code theme for a flawless and beautiful terminal matching your editor.
- **Isolated Blocks:** A notebook-like interface for the CLI. Rerun specific terminal commands, visually segregate stdout and stderr, and track execution time and exit codes individually.

## Installation

Flow is available on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=flow.flow) (Once Published) or you can install it from source.

### Install from the Marketplace

1. Open **User Settings -> Extensions** in VS Code.
2. Search for `flow.flow`
3. Click Install.

### Install from Source

1. Clone this repository: `git clone https://github.com/0xflame-7/Flow.git`
2. Run `pnpm install` in the terminal to install dependencies.
3. Open the repository in VS Code.
4. Press `F5` to open a new VS Code window with the extension loaded in debug mode.

## How To Use

1. **Open a Flow file**: Create a new file with the `.flow` extension or run the command palette (`Ctrl+Shift+P`) and type `Flow: New File`.
2. **Select Shell**: Ensure your desired shell environment (`bash`, `zsh`, `pwsh`, `cmd`) is properly configured and selected from the dropdown in the webview.
3. **Execute Commands**: Type your command in the interactive prompt and press `Enter`. The command output will render instantly as a new enclosed block in the document.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

> Crafted by [0xflame-7](https://github.com/0xflame-7)
