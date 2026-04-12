import React, { useState, useRef, useEffect, forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import { FluxTermBlock } from "../../../types/MessageProtocol";
import { Tooltip } from "../common";

export interface MarkdownBlockProps {
  block: FluxTermBlock;
  onUpdate: (newMarkdown: string) => void;
  onDelete: () => void;
  onAddTerminalAfter: () => void;
  onAddMarkdownAfter: () => void;
}

export const MarkdownBlock = forwardRef<HTMLDivElement, MarkdownBlockProps>(
  ({ block, onUpdate, onDelete, onAddTerminalAfter, onAddMarkdownAfter }, ref) => {
    // Determine editing state. If it is entirely empty, focus automatically for editing.
    const [isEditing, setIsEditing] = useState(block.command.trim() === "");
    const [localCommand, setLocalCommand] = useState(block.command);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const blockRootRef = useRef<HTMLDivElement>(null);

    // Auto-resize textarea height to content naturally
    useEffect(() => {
      const el = textareaRef.current;
      if (!el || !isEditing) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, [localCommand, isEditing]);

    // Handle outside clicks to commit editing state automatically
    useEffect(() => {
      if (!isEditing && !isFocused) return;
      const handle = (e: MouseEvent) => {
        if (
          blockRootRef.current &&
          !blockRootRef.current.contains(e.target as Node)
        ) {
          setIsFocused(false);
          commitEdit();
        }
      };
      document.addEventListener("mousedown", handle);
      return () => document.removeEventListener("mousedown", handle);
    }, [isEditing, isFocused, localCommand]);
    
    // Focus when becoming editable natively
    useEffect(() => {
       if (isEditing && textareaRef.current) {
          textareaRef.current.focus();
       }
    }, [isEditing]);

    const commitEdit = () => {
      if (isEditing) {
        setIsEditing(false);
        if (localCommand !== block.command) {
          onUpdate(localCommand);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        commitEdit();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setLocalCommand(block.command);
        setIsEditing(false);
      }
    };

    const cardBorder = isFocused
      ? "var(--vscode-focusBorder)"
      : "var(--vscode-panel-border)";

    const mergeRef = (node: HTMLDivElement | null) => {
      (blockRootRef as React.RefObject<HTMLDivElement | null>).current = node;
      if (!ref) return;
      if (typeof ref === "function") ref(node);
      else (ref as React.RefObject<HTMLDivElement | null>).current = node;
    };

    return (
      <div
        ref={mergeRef}
        className="block-card-wrapper markdown-block"
        style={{
          position: "relative",
          width: "100%",
        }}
        onFocus={() => setIsFocused(true)}
      >
        {/* Floating action toolbar purely for insertion and deletion logic */}
        <div
          className="block-toolbar"
          style={{
            position: "absolute",
            top: "-4px",
            right: "0px",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            zIndex: 30,
            backgroundColor: "var(--vscode-editorWidget-background)",
            border: "1px solid var(--vscode-panel-border)",
            borderRadius: "6px",
            padding: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
            opacity: 0,
            pointerEvents: "none",
            transition: "opacity 0.15s ease",
          }}
        >
          <div className="flex items-center gap-0.5">
            <Tooltip content="Add terminal below">
              <button className="block-tb-btn" onClick={onAddTerminalAfter}>
                <span className="codicon codicon-add" style={{ fontSize: "14px" }} />
              </button>
            </Tooltip>
            <Tooltip content="Add markdown below">
              <button className="block-tb-btn" onClick={onAddMarkdownAfter}>
                <span className="codicon codicon-markdown" style={{ fontSize: "14px" }} />
              </button>
            </Tooltip>
          </div>
          
          <Tooltip content={isEditing ? "Done (Shift+Enter)" : "Edit Markdown"}>
            <button className="block-tb-btn" onClick={() => isEditing ? commitEdit() : setIsEditing(true)}>
              <span className={`codicon ${isEditing ? 'codicon-check' : 'codicon-edit'}`} style={{ fontSize: "14px" }} />
            </button>
          </Tooltip>

          <div
            style={{
              width: "1px",
              height: "16px",
              backgroundColor: "var(--vscode-panel-border)",
              margin: "0 2px",
            }}
          />

          <Tooltip content="Delete block">
            <button className="block-tb-btn" onClick={onDelete}>
              <span className="codicon codicon-trash" style={{ fontSize: "14px" }} />
            </button>
          </Tooltip>
        </div>

        {/* Markdown container */}
        <div
          className="block-card"
          onDoubleClick={() => {
            if (!isEditing) setIsEditing(true);
          }}
          style={{
            backgroundColor: isEditing ? "var(--vscode-input-background)" : "transparent",
            border: isEditing ? `1px solid ${cardBorder}` : "1px solid transparent",
            borderRadius: "4px",
            transition: "border-color 100ms, background-color 100ms",
            overflow: "hidden",
            padding: isEditing ? "4px 8px" : "0 8px",
          }}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={localCommand}
              onChange={(e) => setLocalCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type markdown here... (Shift+Enter to render)"
              style={{
                width: "100%",
                backgroundColor: "transparent",
                color: "var(--vscode-editor-foreground)",
                caretColor: "var(--vscode-editorCursor-foreground)",
                border: "none",
                padding: "8px 0",
                outline: "none",
                fontFamily: "var(--vscode-editor-font-family, monospace)",
                fontSize: "12px",
                lineHeight: "1.5",
                resize: "none",
                overflow: "hidden",
              }}
            />
          ) : (
            <div 
               className="markdown-prose" 
               style={{ 
                  color: "var(--vscode-editor-foreground)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  padding: "8px 0"
               }}
            >
              <ReactMarkdown>{localCommand || "*(Empty markdown block)*"}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  }
);
