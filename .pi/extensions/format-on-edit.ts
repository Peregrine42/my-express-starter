/**
 * Format-on-Edit Extension
 *
 * Automatically runs Prettier on files after they are edited or written,
 * then runs ESLint and sends any errors to the LLM agent.
 *
 * Prettier rewrites the file in-place so the result on disk is always formatted.
 * ESLint errors are appended to the tool result so the agent can fix them.
 * A brief notification is shown in the UI; full details go to the LLM.
 *
 * File extensions handled:
 *   Prettier: .ts .tsx .js .jsx .mjs .cjs .json .css
 *   ESLint:   .ts .tsx .js .jsx .mjs .cjs
 *
 * Files inside node_modules, dist, and coverage are skipped.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { withFileMutationQueue } from "@mariozechner/pi-coding-agent";
import { resolve, extname } from "node:path";

const PRETTIER_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
]);

const ESLINT_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const SKIP_PATTERNS = [/node_modules/, /dist/, /coverage/, /\.git/];

function shouldProcess(absolutePath: string): boolean {
  return !SKIP_PATTERNS.some((pat) => {
    return pat.test(absolutePath);
  });
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName !== "edit" && event.toolName !== "write") {
      return;
    }
    if (event.isError) {
      return;
    }

    const filePath = (event.input as any)?.path as string | undefined;
    if (!filePath) {
      return;
    }

    const absolutePath = resolve(ctx.cwd, filePath);
    const ext = extname(absolutePath).toLowerCase();

    if (!shouldProcess(absolutePath)) {
      return;
    }

    const needsPrettier = PRETTIER_EXTS.has(ext);
    const needsEslint = ESLINT_EXTS.has(ext);
    if (!needsPrettier && !needsEslint) {
      return;
    }

    let eslintOutput: string | null = null;

    try {
      await withFileMutationQueue(absolutePath, async () => {
        // Run Prettier first so ESLint checks the formatted code
        if (needsPrettier) {
          const result = await pi.exec("npx", [
            "--no-install",
            "prettier",
            "--write",
            absolutePath,
          ]);
          if (result.code !== 0) {
            const msg = (result.stderr || result.stdout || "").trim();
            ctx.ui.notify(`Prettier error: ${filePath}\n${msg}`, "error");
          }
        }

        // Then run ESLint on the (now formatted) file
        if (needsEslint) {
          const result = await pi.exec("npx", [
            "--no-install",
            "eslint",
            "--no-warn-ignored",
            absolutePath,
          ]);
          if (result.code !== 0) {
            eslintOutput =
              (result.stdout || result.stderr || "").trim() || null;
          }
        }
      });
    } catch (e: any) {
      ctx.ui.notify(`Format/lint error on ${filePath}: ${e.message}`, "error");
    }

    if (!eslintOutput) {
      return;
    }

    ctx.ui.notify(`ESLint: ${filePath}`, "error");
    return {
      content: [
        ...event.content,
        {
          type: "text" as const,
          text: `\n⚠ ESLint reported issues in ${filePath}:\n${eslintOutput}`,
        },
      ],
    };
  });
}
