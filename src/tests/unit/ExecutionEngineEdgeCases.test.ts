import { describe, it, expect, beforeAll } from "vitest";
import * as os from "os";

import {
  ExecutionEngine,
  BlockCompletePayload,
  ExecutionCallbacks,
} from "../../extension/services/ExecutionEngine";
import { ShellResolver } from "../../extension/services/ShellResolver";
import { OutputLine, ResolvedShell } from "../../types/MessageProtocol";

const IS_WIN = process.platform === "win32";
let SHELL: ResolvedShell;

beforeAll(async () => {
  const shells = await ShellResolver.resolve();
  const targetId = IS_WIN ? "powershell" : "bash";
  const found = shells.find(
    (s) => s.id === targetId || (IS_WIN && s.id === "pwsh"),
  );
  if (!found) {
    throw new Error(`Could not find a valid shell (${targetId}) for testing.`);
  }
  SHELL = found;
});

const CWD = os.tmpdir();

function runBlock(
  command: string,
  cwd = CWD,
): Promise<{
  streams: OutputLine[];
  complete: BlockCompletePayload | null;
  error: { blockId: string; message: string } | null;
}> {
  return new Promise((resolve) => {
    const streams: OutputLine[] = [];
    let complete: BlockCompletePayload | null = null;
    let error: { blockId: string; message: string } | null = null;

    const callbacks: ExecutionCallbacks = {
      onStream: (_id, lines) => streams.push(...lines),
      onComplete: (payload) => {
        complete = payload;
        resolve({ streams, complete, error });
      },
      onError: (blockId, message) => {
        error = { blockId, message };
        resolve({ streams, complete, error });
      },
    };

    const engine = new ExecutionEngine(callbacks);
    engine.execute("edge-case-block", command, SHELL, cwd);
  });
}

describe("ExecutionEngine Edge Cases", () => {
  it("handles empty commands gracefully", async () => {
    // An empty command should just execute the shell wrapper, which will successfully emit the meta sentinel
    const { complete, error } = await runBlock("");
    expect(error).toBeNull();
    expect(complete?.status).toBe("done");
    expect(complete?.exitCode).toBe(0);
  });

  it("handles commands with heavy output volume without crashing", async () => {
    // Generate 1000 lines of output
    const cmd = IS_WIN
      ? "1..1000 | ForEach-Object { 'line ' + $_ }"
      : "for i in {1..1000}; do echo 'line '$i; done";
    
    const { streams, complete, error } = await runBlock(cmd);
    expect(error).toBeNull();
    expect(complete?.status).toBe("done");
    
    const stdoutLines = streams.filter(s => s.type === "stdout");
    expect(stdoutLines.length).toBeGreaterThanOrEqual(1000); // might be slightly more if split weirdly, but usually exactly 1000
    // Check first and last
    expect(stdoutLines[0].text.trim()).toMatch(/line 1/);
    expect(stdoutLines[stdoutLines.length - 1].text.trim()).toMatch(/line 1000/);
  });

  it("handles malformed or non-existent commands", async () => {
    const cmd = "thiscommandliterallydoesnotexist12345";
    const { complete, error } = await runBlock(cmd);
    
    // The engine spawns the shell (bash/powershell) successfully.
    // The *shell* will fail to find the command, emitting an error to stderr, 
    // and then exiting with a non-zero code.
    expect(error).toBeNull(); // This is the engine's spawn error, which shouldn't happen here
    expect(complete?.status).toBe("error");
    expect(complete?.exitCode).not.toBe(0);
  });
});
