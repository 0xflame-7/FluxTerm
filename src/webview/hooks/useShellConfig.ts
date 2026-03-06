import { useEffect, useState } from "react";
import { flowService } from "../services/FlowService";
import { ResolvedShell } from "../../types/MessageProtocol";

/**
 * Manages shell configuration state: the list of available shells and the
 * currently selected shell.
 *
 * Responsibilities:
 *   - Request initial shell list from the extension on mount.
 *   - Store the list of available shells and the currently selected shell.
 *   - Provide setSelectedShell() for updating the selected shell.
 */
export const useShellConfig = () => {
  const [shells, setShells] = useState<ResolvedShell[]>([]);
  const [selectedShell, setSelectedShell] = useState<ResolvedShell | null>(
    null,
  );

  /**
   * Subscribes to shell list messages from the extension and routes them to the
   * appropriate notebookStore mutations.
   */
  useEffect(() => {
    const unsubscribe = flowService.subscribe((message: any) => {
      if (message.type === "shellList") {
        setShells(message.shells);
        if (message.shells.length > 0 && !selectedShell) {
          setSelectedShell(message.shells[0]);
        }
      }
    });

    flowService.getShellConfig();

    return () => {
      unsubscribe();
    };
  }, []);

  return { shells, selectedShell, setSelectedShell };
};
