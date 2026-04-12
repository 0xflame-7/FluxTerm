# FluxTerm — Project Overview

> Last updated: 2026-04-11

---

## 1. What Is FluxTerm

FluxTerm is a **VS Code Custom Editor Extension** that turns `.ftx` files into
interactive shell notebooks. Each file is a collection of named **document groups**,
each containing one or more **blocks** (a block = command + output). The goal is a
Jupyter-like notebook experience for the terminal, fully integrated with VS Code
themes, workspace context, and persistent state.

---

## 2. Implemented Features

### 2.1 Extension Host

| Feature                                                    | Status | Notes                                      |
| ---------------------------------------------------------- | ------ | ------------------------------------------ |
| Custom editor provider for `.ftx`                          | ✅     | `FluxTermEditorProvider`                   |
| Per-panel document session                                 | ✅     | `FluxTermDocumentSession`                  |
| Shell detection (`bash`, `zsh`, `sh`, `powershell`, `cmd`) | ✅     | `ShellResolver`                            |
| Command execution via isolated child process               | ✅     | `ExecutionEngine`                          |
| Sentinel-based state extraction (CWD + branch + exit code) | ✅     | `__FTX_META__<base64>` protocol            |
| Streamed stdout/stderr forwarding to webview               | ✅     | Chunk-safe byte splitting                  |
| PTY echo suppression (stdin echo dedup)                    | ✅     | `stdinEchoQueue`                           |
| Partial-line flush (interactive prompts)                   | ✅     | Emitted immediately on no trailing newline |
| SIGKILL / process termination                              | ✅     | `killBlock()`                              |
| Explicit save via `requestSave`/`saveResponse` cycle       | ✅     | Triggered by VS Code `saveCustomDocument`  |
| Auto-persist preferences (shell, CWD, doc names)           | ✅     | `update` message → immediate disk write    |
| Serial write queue (race-free disk writes)                 | ✅     | `isProcessing` + task queue                |
| Live CWD resolution on open (from `.ftx` file directory)   | ✅     |                                            |
| Live branch resolution on open (`git rev-parse`)           | ✅     |                                            |

### 2.2 Webview UI

| Feature                                                         | Status | Notes                                                 |
| --------------------------------------------------------------- | ------ | ----------------------------------------------------- |
| Notebook layout with named document groups (`BlockDocument`)    | ✅     |                                                       |
| Ghost document (trailing entry surface for new docs)            | ✅     |                                                       |
| Block card with context bar, input, output, footer              | ✅     | `Block.tsx`                                           |
| Per-block independent shell selection                           | ✅     | `localShell` state, isolated per block                |
| Per-block independent CWD (`CwdEditor`)                         | ✅     | `localCwd` state                                      |
| CwdEditor — display / Ctrl+click copy / double-click edit       | ✅     | With flash tooltip                                    |
| CwdEditor — autocomplete via `listDir` (debounced 150ms)        | ✅     | Portal dropdown                                       |
| CwdEditor — path validation on commit                           | ✅     | `listDir` check before committing                     |
| CwdEditor — edit field width cap (50% of context bar)           | ✅     |                                                       |
| Ghost block (trailing entry per document)                       | ✅     | `isGhost` prop                                        |
| Idle block (`status="idle"`, pre-submit)                        | ✅     | `spliceBlockAfter` + `promoteIdleBlock`               |
| Block re-run (in-place, with datetime separator)                | ✅     | `reRunBlock` in store                                 |
| Clear output (non-destructive, `clearedAt` index)               | ✅     | Synthetic separator header post-clear                 |
| Stdout/stderr ANSI rendering                                    | ✅     | `ansi-to-react`                                       |
| Output grouped by run sessions with datetime headers            | ✅     | `buildRunGroups` in `OutputArea`                      |
| Unified output scroll (300px cap on whole area)                 | ✅     | Single container instead of per-group                 |
| stdin input row (running blocks only)                           | ✅     | `BlockInput`                                          |
| Output search with match highlighting                           | ✅     | `SearchBar`                                           |
| Exit code display in footer                                     | ✅     |                                                       |
| CWD delta display in footer (`finalCwd ≠ block.cwd`)            | ✅     |                                                       |
| Branch delta display in footer (`finalBranch ≠ block.branch`)   | ✅     |                                                       |
| Floating toolbar (hover-revealed)                               | ✅     | Add / Kill / Refresh / Clear / Search / Delete / More |
| Context menu (`…`)                                              | ✅     | Copy output / Re-run / Kill / Delete                  |
| Shell dropdown portal                                           | ✅     | Rendered on `document.body`                           |
| Block focus border (`--vscode-focusBorder`)                     | ✅     | Status-aware (error=red, killed=dimmed)               |
| Reliable block unfocus (outside click via document `mousedown`) | ✅     | Replaces broken `onBlur`/`relatedTarget`              |
| Unfocus on click to non-interactive card areas                  | ✅     | Card `onMouseDown` handler                            |
| Document group rename (double-click)                            | ✅     |                                                       |
| Delete document group (with guard: no running blocks)           | ✅     |                                                       |
| Run All blocks in a document                                    | ✅     |                                                       |
| Sequence guard (prevent old block overwriting newer CWD)        | ✅     | `seq` field + guard in `completeBlock`                |
| Storybook stories for UI development                            | ✅     |                                                       |

### 2.3 Data Persistence

| Feature                                       | Status | Notes                            |
| --------------------------------------------- | ------ | -------------------------------- |
| `.ftx` file format (JSON)                     | ✅     | `FluxTermDocument` type          |
| Block list persisted on explicit save         | ✅     | Via `requestSave`/`saveResponse` |
| Document group metadata persisted immediately | ✅     | `BlockDocumentMeta[]`            |
| Shell preference persisted                    | ✅     |                                  |
| VS Code dirty marker                          | ✅     | `markDirty` message              |

---

## 3. Architecture Review

### 3.1 Strengths

**Clean host/webview isolation.**
The `WebviewMessage` / `ExtMessage` protocol is well-typed and narrow. The webview
never directly access the filesystem or a shell; everything goes through the bridge.
This is the correct model for VS Code extensions and makes the webview fully testable
in Storybook without a live extension.

**Sentinel-based environment extraction.**
Using `__FTX_META__<base64>` to read post-command state (CWD, branch, exit code)
without a persistent PTY session is clever. It avoids the complexity of a long-lived
shell and makes each block hermetically isolated.

**Immutable store with Immer.**
`notebookStore.ts` uses `produce` for all mutations. Combined with the sequence guard
on `completeBlock`, this prevents the most common concurrency bugs in notebook UIs
(stale CWD from a slow concurrent block).

**Per-block decentralized execution context.**
Each block carries its own `shell`, `cwd`, `branch` at creation time. There is no
global shell state. This allows different blocks in the same document to run in
different shells and directories — a significant design advantage.

**Portal pattern for overlays.**
Shell dropdown and autocomplete dropdown are both portalled to `document.body`.
This correctly solves `overflow: hidden` clipping without requiring `z-index` hacks at
every level of the component tree.

### 3.2 Architectural Gaps / Risks

**1. `reRunBlock` vs `promoteIdleBlock` duality.** -> (Solved)
There are two entry paths to execution for non-ghost blocks: `reRunBlock` (creates a
new block) and `promoteIdleBlock` (mutates in-place). The distinction is subtle and
the two paths have slightly different data shapes. As the execution flow grows, this
duality is a source of bugs.

**2. App.tsx is a coordination monolith.** -> (Solved)
`App.tsx` (~550 lines) owns document state, ghost command strings, all execution
dispatch, and renders the full component tree. As features grow this will become
increasingly hard to maintain. The execution dispatch logic (`handleSubmit`,
`handleReRun`, `handleGhostDocSubmit`) should move into a dedicated hook
(`useBlockDispatch` or similar).

**3. No output virtualization.** -> (Solved)
`OutputArea` renders all visible lines into the DOM as plain `<div>` nodes. For
long-running commands producing thousands of lines, this will cause serious
performance issues. A windowed list (`react-window` or `react-virtual`) is the
correct fix.

**4. `CwdEditor` validation is path-listing-based.** -> (Solved)
Validation calls `listDir(parentDir)` and checks if the leaf exists in the result.
This fails for paths the extension cannot read (permission denied), paths with special
characters, or very deep paths. A dedicated `stat`/`access` IPC call would be more
correct.

**5. `autoFocus` on ghost block textarea.** -> (Solved)
The ghost block textarea uses `autoFocus`. This can cause unexpected focus behavior
when blocks are added/removed or when navigating between documents. The new
document `mousedown` focus handler partially mitigates this but the `autoFocus`
prop is semantically at odds with the manual focus management.

**6. Storybook mocks.**
The webview's Storybook setup requires mock implementations of `FluxTermService`.
These are currently maintained manually. As the protocol grows, mock drift is a risk
— consider generating mocks from the message type definitions.

**7. No keyboard navigation between blocks.**
There is no `Tab`/`Arrow` key navigation between blocks. Users must click to move
between blocks. This limits keyboard-only workflows.

---

## 4. Project Outline

### Current state: Alpha / Internal

The core execution pipeline is solid. The UI covers the essential notebook loop
(write → run → view output → re-run). Persistence is functional. The architecture
is sound at a small scale.

### Immediate priorities (polish / stability)

- [x] Output virtualization for large command outputs
- [ ] Keyboard navigation between blocks (Tab / Arrow)
- [x] `CwdEditor` validation robustness (stat-based, not listDir)
- [ ] App.tsx refactor — extract `useBlockDispatch` hook
- [x] Resolve `reRunBlock` vs `promoteIdleBlock` duality (single execution entry point)

### Medium-term features

- [ ] Block drag-and-drop reordering (grip exists in toolbar, logic not implemented)
- [ ] Multi-block selection and batch operations
- [ ] Command history per block (navigate previous commands with Arrow Up/Down)
- [ ] Collapsible output sections
- [ ] Block labels / comments (markdown annotations between blocks)
- [ ] Export notebook to Markdown / shell script

### Long-term / aspirational

- [ ] Remote execution (SSH / dev container) — `connection: "remote"` already in
      `FluxTermContext`, not yet implemented
- [ ] Shared sessions (multiple webview panels sharing a live shell)
- [ ] AI command suggestions (inline, inside the textarea)
- [ ] File attachment to blocks (pass files as stdin or env vars)

---

## 5. File Map

```
src/
├── extension.ts                          # Extension entry point (registers provider)
├── types/
│   └── MessageProtocol.ts               # All shared types: blocks, messages, context
├── extension/
│   ├── providers/
│   │   └── FluxTermEditorProvider.ts    # CustomEditorProvider: open/save/revert
│   ├── models/
│   │   └── FluxTermCustomDocument.ts    # Thin data container for .ftx bytes
│   └── services/
│       ├── FluxTermDocumentSession.ts   # Per-panel bridge: wires engine ↔ webview
│       ├── ExecutionEngine.ts           # Shell spawn, stream processing, sentinel
│       └── ShellResolver.ts             # Detects available shells → ResolvedShell[]
└── webview/
    ├── index.tsx                         # React mount + vscode API token
    ├── App.tsx                           # Top-level coordinator
    ├── styles.css                        # Tailwind + keyframes
    ├── store/
    │   └── notebookStore.ts             # Immer store: all block mutations
    ├── hooks/
    │   ├── useFluxTermDocument.ts       # Document state + persistence
    │   ├── useBlockExecution.ts         # Routes stream/complete messages → store
    │   ├── useShellConfig.ts            # Shell list from extension
    │   └── useExtension.ts             # Raw message subscriber
    ├── services/
    │   └── FluxTermService.ts           # Typed vscode.postMessage wrapper
    └── components/
        ├── BlockDocument.tsx            # Document group wrapper + header
        ├── common/                      # Shared UI (Tooltip, etc.)
        └── block/
            ├── Block.tsx                # Full block card (context bar, input, output)
            ├── OutputArea.tsx           # ANSI output renderer, run grouping, scroll
            ├── BlockInput.tsx           # Stdin row (running blocks)
            ├── CwdEditor.tsx            # CWD display + edit + autocomplete
            ├── SearchBar.tsx            # Output search input
            └── ContextMenu.tsx          # Ellipsis (…) dropdown actions
```
