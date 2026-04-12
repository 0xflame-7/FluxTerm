import React, { useMemo } from "react";
import Ansi from "ansi-to-react";
import { FluxTermBlock, OutputLine } from "../../../types/MessageProtocol";
import { List, useDynamicRowHeight } from "react-window";

// Shared date formatter
function formatSeparatorDate(isoOrMs: string | number): string {
  const d = typeof isoOrMs === "number" ? new Date(isoOrMs) : new Date(isoOrMs);
  if (isNaN(d.getTime())) return String(isoOrMs);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export type FlatItem =
  | { type: "header"; separatorText: string }
  | {
      type: "line";
      line: OutputLine;
      inlineInput?: string;
      highlighted: boolean;
      isFirstGroupItem: boolean;
      isLastGroupItem: boolean;
    };

// Flat List Virtualized Row
const RowItem = ({
  index,
  style,
  ariaAttributes,
  flatItems,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: Record<string, any>;
  flatItems: FlatItem[];
}): React.ReactElement | null => {
  const item = flatItems[index];

  if (item.type === "header") {
    const label = item.separatorText
      ? formatSeparatorDate(item.separatorText)
      : null;
    return (
      <div style={style} {...ariaAttributes}>
        {label && (
          <span
            style={{
              display: "block",
              color: "var(--vscode-descriptionForeground)",
              fontSize: "12px",
              userSelect: "none",
              paddingTop: index === 0 ? "0" : "14px",
              paddingBottom: "3px",
              fontFamily:
                "var(--vscode-editor-font-family, var(--vscode-terminal-font-family, monospace))",
            }}
          >
            [{label}]
          </span>
        )}
      </div>
    );
  }

  // Row line payload
  const color =
    item.line.type === "stderr"
      ? "var(--vscode-testing-iconFailed, var(--vscode-terminal-ansiRed, #f14c4c))"
      : undefined;

  return (
    <div style={style} {...ariaAttributes}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          // Give inner wrapper full width and height
          height: "100%",
          width: "100%",
        }}
      >
        <div
          style={{
            borderLeft:
              "2px solid var(--vscode-charts-blue, var(--vscode-button-background, #007fd4))",
            color:
              "var(--vscode-terminal-foreground, var(--vscode-editor-foreground))",
            backgroundColor: item.highlighted
              ? "rgba(255,197,0,0.15)"
              : "transparent",
            fontFamily:
              "var(--vscode-terminal-font-family, var(--vscode-editor-font-family, monospace))",
            fontSize: "12px",
            lineHeight: "1.5",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            paddingLeft: "10px",
            paddingRight: "8px",
            paddingTop: item.isFirstGroupItem ? "4px" : "1px",
            paddingBottom: item.isLastGroupItem ? "4px" : "1px",
            borderTopLeftRadius: item.isFirstGroupItem ? "2px" : "0px",
            borderBottomLeftRadius: item.isLastGroupItem ? "2px" : "0px",
          }}
        >
          <div
            style={{
              color,
              display: "flex",
              flexWrap: "wrap",
              minHeight: "18px",
            }}
          >
            <Ansi useClasses>{item.line.text}</Ansi>
            {item.inlineInput !== undefined && (
              <span
                style={{
                  color: "var(--vscode-button-background)",
                  marginLeft: "0.25ch",
                  opacity: 0.9,
                }}
              >
                {item.inlineInput}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const OutputArea: React.FC<{
  block: FluxTermBlock;
  searchQuery: string;
}> = ({ block, searchQuery }) => {
  const { output, status, clearedAt, clearedAtTime } = block;

  // Visibility Filter
  const visibleLines = clearedAt !== null ? output.slice(clearedAt) : output;

  // Empty states
  if (visibleLines.length === 0) {
    if (status === "running") {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: 0.5,
            paddingLeft: "8px",
            marginTop: "8px",
            fontSize: "12px",
          }}
        >
          <span
            className="codicon codicon-loading"
            style={{ fontSize: "12px", animation: "spin 1.5s linear infinite" }}
          />
          <span>Waiting for output…</span>
        </div>
      );
    }
    if (status === "done") {
      return (
        <div
          style={{
            opacity: 0.4,
            paddingLeft: "8px",
            marginTop: "8px",
            fontSize: "12px",
            fontStyle: "italic",
          }}
        >
          (no output)
        </div>
      );
    }
    return null;
  }

  // Pre-calculate flattened structural lines mapping for virtualization
  const flatItems = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const items: FlatItem[] = [];

    // Synthesize the starting group if output was cleared partway
    const startLines = [...visibleLines];
    if (
      clearedAt !== null &&
      clearedAtTime !== null &&
      startLines[0]?.type !== "separator"
    ) {
      startLines.unshift({ type: "separator", text: String(clearedAtTime) });
    }

    let currentGroupLineCount = 0;

    for (let i = 0; i < startLines.length; i++) {
      const line = startLines[i];

      if (line.type === "separator") {
        if (items.length > 0) {
          const prev = items[items.length - 1];
          if (prev.type === "line") {
            prev.isLastGroupItem = true;
          }
        }
        items.push({ type: "header", separatorText: line.text });
        currentGroupLineCount = 0;
      } else if (line.type === "stdin") {
        if (items.length > 0 && items[items.length - 1].type === "line") {
          const prevItem = items[items.length - 1] as Extract<
            FlatItem,
            { type: "line" }
          >;
          prevItem.inlineInput =
            prevItem.inlineInput !== undefined
              ? prevItem.inlineInput + " " + line.text
              : line.text;

          if (lowerQuery !== "") {
            prevItem.highlighted =
              prevItem.line.text.toLowerCase().includes(lowerQuery) ||
              prevItem.inlineInput.toLowerCase().includes(lowerQuery);
          }
        } else {
          items.push({
            type: "line",
            line: { type: "stdout", text: line.text },
            highlighted:
              lowerQuery !== "" && line.text.toLowerCase().includes(lowerQuery),
            isFirstGroupItem: currentGroupLineCount === 0,
            isLastGroupItem: false,
          });
          currentGroupLineCount++;
        }
      } else {
        items.push({
          type: "line",
          line,
          highlighted:
            lowerQuery !== "" && line.text.toLowerCase().includes(lowerQuery),
          isFirstGroupItem: currentGroupLineCount === 0,
          isLastGroupItem: false,
        });
        currentGroupLineCount++;
      }
    }

    if (items.length > 0) {
      const last = items[items.length - 1];
      if (last.type === "line") {
        last.isLastGroupItem = true;
      }
    }

    return items;
  }, [visibleLines, searchQuery, clearedAt, clearedAtTime]);

  const dynamicRowHeight = useDynamicRowHeight({ defaultRowHeight: 22 });

  // Calculate a proportional height capped at 300px.
  // Header rows render slightly taller (~28px) so we weight them higher.
  const estimatedHeight = flatItems.reduce((sum, item) => {
    return sum + (item.type === "header" ? 30 : 28);
  }, 0);
  const containerHeight = Math.min(estimatedHeight, 300);

  return (
    <div style={{ height: containerHeight }}>
      {flatItems.length > 0 && (
        <List<{ flatItems: FlatItem[] }>
          rowCount={flatItems.length}
          rowHeight={dynamicRowHeight}
          rowProps={{ flatItems }}
          rowComponent={RowItem}
          className="fluxterm-output-list"
          style={{ width: "100%", height: "100%", overflowX: "hidden" }}
        />
      )}
    </div>
  );
};
