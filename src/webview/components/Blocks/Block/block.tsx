import React from "react";

function block() {
  return (
    <div
      style={{
        backgroundColor: "var(--vscode-editor-background)",
        borderTop: "1px solid var(--vscode-panel-border)", // just a line
      }}
      className="p-4 w-12 shrink-0 relative"
    >
      sdfkl
      <div
        style={{
          backgroundColor: "var(--vscode-input-background)",
          border: "1px solid var(--vscode-panel-border)",
        }}
      >
        Hello
      </div>
    </div>
  );
}

export default block;
