/**
 * Input History - Persist command history across sessions
 *
 * Usage: pi --extension ./examples/extensions/input-history.ts
 *
 * This extension saves your input history to ~/.pi/agent/input-history.json
 * and loads it when pi starts. Use up/down arrows to navigate history.
 */

import {
  CustomEditor,
  getAgentDir,
  type ExtensionAPI,
  type KeybindingsManager,
} from "@mariozechner/pi-coding-agent";
import { EditorTheme, type TUI } from "@mariozechner/pi-tui";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const HISTORY_FILE = "input-history.json";
const MAX_HISTORY = 100;

class PersistentHistoryEditor extends CustomEditor {
  private historyFilePath: string;

  constructor(
    tui: TUI,
    theme: EditorTheme,
    keybindings: KeybindingsManager,
    historyFilePath: string,
  ) {
    super(tui, theme, keybindings);
    this.historyFilePath = historyFilePath;
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      if (existsSync(this.historyFilePath)) {
        const data = readFileSync(this.historyFilePath, "utf-8");
        const history = JSON.parse(data) as string[];
        // Load each item into the base editor's history in REVERSE order
        // because addToHistory adds to the beginning of the array
        for (let i = history.length - 1; i >= 0; i--) {
          super.addToHistory(history[i]!);
        }
      }
    } catch {
      // Ignore errors
    }
  }

  override addToHistory(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    // Save to file
    try {
      const dir = dirname(this.historyFilePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Load existing history
      let history: string[] = [];
      try {
        if (existsSync(this.historyFilePath)) {
          history = JSON.parse(readFileSync(this.historyFilePath, "utf-8"));
        }
      } catch {
        history = [];
      }

      // Don't add consecutive duplicates
      if (history.length > 0 && history[0] === trimmed) {
        super.addToHistory(text);
        return;
      }

      // Add to beginning
      history.unshift(trimmed);
      if (history.length > MAX_HISTORY) {
        history.pop();
      }

      writeFileSync(this.historyFilePath, JSON.stringify(history));
    } catch {
      // Ignore save errors
    }

    // Also call parent to add to base editor's history
    super.addToHistory(text);
  }
}

export default function (pi: ExtensionAPI) {
  const agentDir = getAgentDir();
  const historyFile = join(agentDir, HISTORY_FILE);

  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setEditorComponent(
      (tui: TUI, theme: EditorTheme, keybindings: KeybindingsManager) => {
        return new PersistentHistoryEditor(
          tui,
          theme,
          keybindings,
          historyFile,
        );
      },
    );
  });
}
