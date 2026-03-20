# Developer Documentation

## Current Application State and Architecture Overview

Flow is currently a functional VS Code custom editor extension with a webview-based notebook UI. It supports block-based command execution with real-time streaming, stdin handling, process control (kill), and context tracking (cwd and git branch).

The architecture is split between three main components:

- **Webview (React UI)**: Handles the presentation and user interaction within the notebook interface.
- **Extension (Message orchestration and state management)**: Acts as the central authority, managing the flow of data and coordinating between the UI and the execution layer.
- **ExecutionEngine (Process execution layer)**: Responsible for spawning shells, managing processes, capturing output streams, and handling graceful process termination.

**Current Stage of Development**:

- **Shell Resolution**: Implemented but actively being refined toward a single source of truth using the `ResolvedShell` object to eliminate duplicated data.
- **Testing**: Partially set up. We use Vitest for testing the engine and webview components, and Mocha for the core extension tests.
- **Platform Specifics**: Improvements are in progress, such as utilizing interactive shells for `bash`/`zsh` to preserve user environments (like aliases) while handling TTY limitations gracefully.

This summary provides a clear understanding of what is already stable, what is evolving, and where to contribute next.
