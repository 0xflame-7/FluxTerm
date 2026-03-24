import { describe, it, expect, vi, beforeEach } from "vitest";

// We mock child_process globally in this file to intercept spawn calls
const mockSpawn = vi.fn();
vi.mock("child_process", () => {
  return {
    spawn: (...args: any[]) => mockSpawn(...args),
  };
});

import { ExecutionEngine } from "../../extension/services/ExecutionEngine";

describe("ExecutionEngine Internals", () => {
  describe("findSafeSplitIndex", () => {
    const engine = new ExecutionEngine({
      onStream: () => {},
      onComplete: () => {},
      onError: () => {},
    });

    const findSafeSplitIndex: (buf: Buffer) => number = (buf) =>
      (engine as any).findSafeSplitIndex(buf);

    it("splits at the end for clean ASCII buffers", () => {
      const buf = Buffer.from("Hello world\n", "utf-8");
      expect(findSafeSplitIndex(buf)).toBe(buf.length);
    });

    it("splits safely before an incomplete ANSI sequence (CSI)", () => {
      const buf = Buffer.from("Hello \x1b[", "utf-8");
      expect(findSafeSplitIndex(buf)).toBe(6);
    });

    it("splits safely before an incomplete raw ESC", () => {
      const buf = Buffer.from("Hello \x1b", "utf-8");
      expect(findSafeSplitIndex(buf)).toBe(6);
    });

    it("splits at the end for a complete ANSI sequence", () => {
      const buf = Buffer.from("Hello \x1b[31mWorld", "utf-8");
      expect(findSafeSplitIndex(buf)).toBe(buf.length);
    });

    it("splits safely before an incomplete UTF-8 character (2-byte expected, 1 given)", () => {
      const buf = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0xc3]);
      expect(findSafeSplitIndex(buf)).toBe(6);
    });

    it("splits safely before an incomplete UTF-8 character (3-byte expected, 2 given)", () => {
      const buf = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0xe2, 0x82]);
      expect(findSafeSplitIndex(buf)).toBe(6);
    });

    it("splits safely before an incomplete UTF-8 character (4-byte expected, 3 given)", () => {
      const buf = Buffer.from([
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0xf0, 0x9f, 0x8c,
      ]);
      expect(findSafeSplitIndex(buf)).toBe(6);
    });

    it("splits at the end for complete multi-byte UTF-8", () => {
      const buf = Buffer.from([
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0xf0, 0x9f, 0x8c, 0x8d,
      ]);
      expect(findSafeSplitIndex(buf)).toBe(buf.length);
    });
  });

  describe("ShellAdapter Commands Injection", () => {
    beforeEach(() => {
      mockSpawn.mockReset();
      mockSpawn.mockReturnValue({
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        stdin: { writable: false },
      });
    });

    it("injects PowerShellAdapter wrapper commands into spawn args for pwsh", () => {
      const engine = new ExecutionEngine({
        onStream: () => {},
        onComplete: () => {},
        onError: () => {},
      });

      const shell = {
        id: "pwsh",
        label: "PowerShell Core",
        path: process.platform === "win32" ? "C:\\pwsh.exe" : "/usr/bin/pwsh",
        args: ["-NoLogo", "-Command"],
      };

      engine.execute("test-pwsh", "echo test", shell, "/tmp");
      expect(mockSpawn).toHaveBeenCalled();

      const args = mockSpawn.mock.calls[0][1];
      const wrapped = args[args.length - 1];
      expect(wrapped).toContain("echo test");
      expect(wrapped).toContain(
        "$__metaObj = [ordered]@{ exit=[int]$__exit; cwd=$__cwd; branch=$__branch }",
      );
      expect(wrapped).toContain("ConvertTo-Json -Compress");
      expect(wrapped).toContain("__FTX_META__");
    });

    it("injects CmdAdapter wrapper commands into spawn args for cmd.exe", () => {
      const engine = new ExecutionEngine({
        onStream: () => {},
        onComplete: () => {},
        onError: () => {},
      });

      const shell = {
        id: "cmd",
        label: "Command Prompt",
        path: "C:\\Windows\\System32\\cmd.exe",
        args: ["/c"],
      };

      engine.execute("test-cmd", "dir", shell, "/tmp");
      expect(mockSpawn).toHaveBeenCalled();

      const args = mockSpawn.mock.calls[0][1];
      const wrapped = args[args.length - 1];
      expect(wrapped).toContain("dir");
      expect(wrapped).toContain("set __exit=%ERRORLEVEL%");
      expect(wrapped).toContain("powershell -NoProfile -Command");
      expect(wrapped).toContain("__FTX_META__");
    });

    it("injects PosixAdapter wrapper commands into spawn args for bash", () => {
      const engine = new ExecutionEngine({
        onStream: () => {},
        onComplete: () => {},
        onError: () => {},
      });

      const shell = {
        id: "bash",
        label: "Bash",
        path: "usr/bin/bash",
        args: ["-c"],
      };

      engine.execute("test-bash", "ls -la", shell, "/tmp");
      expect(mockSpawn).toHaveBeenCalled();

      const args = mockSpawn.mock.calls[0][1];
      const wrapped = args[args.length - 1];
      expect(wrapped).toContain("ls -la");
      expect(wrapped).toContain("cat << '__FTX_EOF__'");
      expect(wrapped).toContain(
        '__json=$(printf \'{"exit":%s,"cwd":"%s","branch":"%s"}\' "$__exit" "$__cwd" "$__branch")',
      );
      expect(wrapped).toContain("__FTX_META__");
    });
  });
});
