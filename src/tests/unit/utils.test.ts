import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateId, getNonce, getDefaultShell } from "../../utils/helper";
import { SHELL_PROFILES } from "../../utils/constants";
import { Ext, Web } from "../../utils/logger";

describe("Utils & Helpers", () => {
  describe("generateId", () => {
    it("generates unique string IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(typeof id1).toBe("string");
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });
  });

  describe("getNonce", () => {
    it("generates a 32-character alphanumeric ring", () => {
      const nonce = getNonce();
      expect(typeof nonce).toBe("string");
      expect(nonce.length).toBe(32);
      expect(/^[A-Za-z0-9]+$/.test(nonce)).toBe(true);
    });

    it("generates unique nonces", () => {
      expect(getNonce()).not.toBe(getNonce());
    });
  });

  describe("getDefaultShell", () => {
    const originalPlatform = process.platform;
    const originalEnv = process.env.SHELL;

    afterEach(() => {
      Object.defineProperty(process, "platform", { value: originalPlatform });
      process.env.SHELL = originalEnv;
    });

    it("on Windows, prefers pwsh > powershell > cmd", () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      const shell = getDefaultShell();
      expect(["pwsh", "powershell", "cmd"]).toContain(shell.id);
      expect(shell).toEqual(
        SHELL_PROFILES.find((s) => s.id === "pwsh") ||
        SHELL_PROFILES.find((s) => s.id === "powershell") ||
        SHELL_PROFILES.find((s) => s.id === "cmd")
      );
    });

    it("on POSIX, uses process.env.SHELL if it matches a profile", () => {
      Object.defineProperty(process, "platform", { value: "linux" });
      process.env.SHELL = "/usr/bin/zsh";
      const shell = getDefaultShell();
      expect(shell.id).toBe("zsh");
      expect(shell).toEqual(SHELL_PROFILES.find((s) => s.id === "zsh"));
    });

    it("on POSIX, falls back to bash if process.env.SHELL is unknown or unset", () => {
      Object.defineProperty(process, "platform", { value: "darwin" });
      process.env.SHELL = "/bin/unknown-shell";
      const shell = getDefaultShell();
      expect(shell.id).toBe("bash");
      expect(shell).toEqual(SHELL_PROFILES.find((s) => s.id === "bash"));
    });
  });

  describe("Constants", () => {
    it("SHELL_PROFILES contains expected essential shells", () => {
      const ids = SHELL_PROFILES.map((s) => s.id);
      expect(ids).toContain("cmd");
      expect(ids).toContain("powershell");
      expect(ids).toContain("pwsh");
      expect(ids).toContain("bash");
      expect(ids).toContain("zsh");
    });
    
    it("SHELL_PROFILES items have required properties", () => {
      for (const profile of SHELL_PROFILES) {
        expect(profile.id).toBeTruthy();
        expect(profile.label).toBeTruthy();
        expect(profile.command).toBeTruthy();
        expect(Array.isArray(profile.args)).toBe(true);
        expect(profile.icon).toBeTruthy();
      }
    });
  });

  describe("Logger", () => {
    let consoleLogSpy: any;
    let consoleWarnSpy: any;
    let consoleErrorSpy: any;
    
    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      // Reset vscode context for fresh state
      Web.setVSCode(null as any);
      Ext.setVSCode(null as any);
    });
    
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("Ext logger formats and logs correctly to console", () => {
      Ext.info("Test info", { a: 1 });
      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.mock.calls[0];
      expect(logCall[0]).toMatch(/\[\d{2}:\d{2}:\d{2}\]\sEXT:INFO\sTest info/);
      expect(logCall[1]).toEqual({ a: 1 });

      Ext.warn("Test warn");
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toMatch(/\[\d{2}:\d{2}:\d{2}\]\sEXT:WARN\sTest warn/);

      Ext.error("Test error");
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/\[\d{2}:\d{2}:\d{2}\]\sEXT:ERROR\sTest error/);
    });

    it("Web logger posts messages to VSCode if context is set", () => {
      const mockPostMessage = vi.fn();
      Web.setVSCode({ postMessage: mockPostMessage });
      // Force it to think it's in a webview
      (Web as any).isWebview = true;

      Web.info("Webview log", [1, 2]);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      
      const payload = mockPostMessage.mock.calls[0][0];
      expect(payload.type).toBe("log");
      expect(payload.message).toMatch(/\[\d{2}:\d{2}:\d{2}\]\sWEB:INFO\sWebview log\s\[\[1,2\]\]/);
    });
    
    it("Web logger doesn't throw if VSCode context is missing", () => {
      expect(() => Web.info("No context")).not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
