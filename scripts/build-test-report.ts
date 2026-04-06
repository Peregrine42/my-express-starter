import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";

interface AssertionResult {
  ancestorTitles: string[];
  title: string;
  fullName: string;
  status: "passed" | "failed" | "skipped" | "pending" | "todo";
  duration: number;
}

interface TestFileResult {
  name: string;
  assertionResults: AssertionResult[];
  status: string;
}

interface TestReport {
  numTotalTestSuites: number;
  numPassedTestSuites: number;
  numFailedTestSuites: number;
  numPendingTestSuites: number;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  numTodoTests: number;
  success: boolean;
  startTime: number;
  testResults: TestFileResult[];
}

interface SuiteReport {
  label: string;
  data: TestReport;
}

const STATUS_ICON: Record<string, string> = {
  passed: "✅",
  failed: "❌",
  skipped: "⏭️",
  pending: "⏳",
  todo: "📝",
};

const REPORT_FILES = ["backend.json", "frontend.json", "e2e.json"] as const;

function loadReport(filePath: string): SuiteReport | null {
  if (!existsSync(filePath)) {
    return null;
  }
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as TestReport;
  const label = filePath.replace(/^.*\//, "").replace(/\.json$/, "");
  return { label, data };
}

function relativePath(fullPath: string): string {
  const root = cwd();
  const normalized = fullPath.replace(/\\/g, "/");
  const rootNormalized = root.replace(/\\/g, "/");
  return normalized.startsWith(rootNormalized)
    ? normalized.slice(rootNormalized.length + 1)
    : fullPath;
}

function formatFileSection(file: TestFileResult): string {
  const filePath = relativePath(file.name);
  const fileName = filePath.split("/").pop() ?? filePath;
  const dir = filePath.includes("/")
    ? filePath.slice(0, filePath.lastIndexOf("/"))
    : "";

  const lines: string[] = [];
  lines.push(`#### ${fileName}`);
  if (dir) {
    lines.push(`*\`${dir}\`*`);
  }

  // Group assertions by suite path (ancestorTitles)
  const suiteGroups = new Map<string, AssertionResult[]>();
  for (const assertion of file.assertionResults) {
    const suitePath = assertion.ancestorTitles.join(" > ");
    const key = suitePath || "(top-level)";
    const existing = suiteGroups.get(key) ?? [];
    existing.push(assertion);
    suiteGroups.set(key, existing);
  }

  for (const [suitePath, assertions] of suiteGroups) {
    if (suitePath !== "(top-level)") {
      lines.push("");
      lines.push(`**${suitePath}**`);
    }
    for (const a of assertions) {
      const icon = STATUS_ICON[a.status] ?? "❓";
      lines.push(`- ${icon} ${a.title}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function formatSuiteSection(suite: SuiteReport): string {
  const { label, data } = suite;
  const ts = new Date(data.startTime).toLocaleString();

  const lines: string[] = [];
  lines.push(`## ${label.charAt(0).toUpperCase() + label.slice(1)} Tests`);
  lines.push("");
  lines.push(
    `${data.numTotalTests} tests (${data.numPassedTests} passed, ${data.numFailedTests} failed, ${data.numPendingTests} skipped, ${data.numTodoTests} todo)`,
  );
  lines.push("");
  lines.push(`<sup>Generated ${ts}</sup>`);
  lines.push("");

  // Sort files for consistent output
  const sorted = [...data.testResults].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  for (const file of sorted) {
    lines.push(formatFileSection(file));
  }

  return lines.join("\n");
}

function formatSummary(suites: SuiteReport[]): string {
  const rows = suites.map((s) => {
    const d = s.data;
    const failedStr = d.numFailedTests > 0 ? `**${d.numFailedTests}**` : "0";
    return `| ${s.label} | ${d.numTotalTestSuites} | ${d.numTotalTests} | ${d.numPassedTests} | ${failedStr} | ${d.numPendingTests + d.numTodoTests} |`;
  });

  const totals = suites.reduce(
    (acc, s) => {
      const d = s.data;
      acc.files += d.numTotalTestSuites;
      acc.tests += d.numTotalTests;
      acc.passed += d.numPassedTests;
      acc.failed += d.numFailedTests;
      acc.other += d.numPendingTests + d.numTodoTests;
      return acc;
    },
    { files: 0, tests: 0, passed: 0, failed: 0, other: 0 },
  );

  const totalFailedStr = totals.failed > 0 ? `**${totals.failed}**` : "0";

  return (
    `## Summary\n\n` +
    `| Suite | Files | Tests | Passed | Failed | Skipped/Todo |\n` +
    `|-------|-------|-------|--------|--------|--------------|\n` +
    rows.join("\n") +
    "\n" +
    `| **Total** | **${totals.files}** | **${totals.tests}** | **${totals.passed}** | **${totalFailedStr}** | **${totals.other}** |\n`
  );
}

function main(): void {
  const reportsDir = join(cwd(), "reports");
  const suites: SuiteReport[] = [];

  for (const file of REPORT_FILES) {
    const report = loadReport(join(reportsDir, file));
    if (report) {
      suites.push(report);
    }
  }

  if (suites.length === 0) {
    console.error(
      "No JSON reports found in reports/. Run tests first to generate them.",
    );
    process.exit(1);
  }

  const now = new Date().toLocaleString();
  const sections = suites.map(formatSuiteSection).join("\n---\n\n");

  const markdown =
    `# Test Report\n\n<sup>Generated ${now}</sup>\n\n---\n\n` +
    formatSummary(suites) +
    "\n---\n\n" +
    sections;

  const outPath = join(reportsDir, "test-report.md");
  writeFileSync(outPath, markdown, "utf-8");
  console.log(`Report written to ${outPath}`);
}

main();
