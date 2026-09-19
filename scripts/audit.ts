import { extname, join, sep } from "node:path";

const ROOT = join(import.meta.dir, "..");
const LINE_CEILING = 300;
const REFACTOR_WARNING = 250;

const IGNORED_SEGMENTS = [
  "node_modules",
  "dist",
  "build",
  ".turbo",
  ".expo",
  ".git",
  "public",
  "android",
  "ios",
  "migrations",
];

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const MEASURED_EXTENSIONS = new Set([
  ...CODE_EXTENSIONS,
  ".json",
  ".css",
  ".toml",
  ".yaml",
  ".yml",
]);

const GENERATED_SUFFIXES = ["-env.d.ts"];

const SCAN_PATTERN = "**/*.{ts,tsx,js,jsx,mjs,cjs,json,css,toml,yaml,yml}";

interface Violation {
  file: string;
  detail: string;
}

function isIgnored(relativePath: string): boolean {
  const segments = relativePath.split("/");
  if (GENERATED_SUFFIXES.some((suffix) => relativePath.endsWith(suffix))) return true;
  return segments.some((segment) => IGNORED_SEGMENTS.includes(segment));
}

function collectFiles(): string[] {
  const glob = new Bun.Glob(SCAN_PATTERN);
  const found: string[] = [];
  for (const match of glob.scanSync({ cwd: ROOT, onlyFiles: true, dot: true })) {
    const normalized = match.split(sep).join("/");
    if (!isIgnored(normalized)) found.push(normalized);
  }
  return found.sort();
}

function findCommentLine(source: string): number | null {
  let line = 1;
  let quote: string | null = null;
  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];
    if (current === "\n") line += 1;
    if (quote) {
      if (current === "\\") index += 1;
      else if (current === quote) quote = null;
      continue;
    }
    if (current === '"' || current === "'" || current === "`") {
      quote = current;
      continue;
    }
    if (current === "/" && (next === "/" || next === "*")) return line;
  }
  return null;
}

interface AuditResult {
  lineViolations: Violation[];
  commentViolations: Violation[];
  warnings: Violation[];
}

async function auditRepository(): Promise<AuditResult> {
  const result: AuditResult = { lineViolations: [], commentViolations: [], warnings: [] };

  for (const file of collectFiles()) {
    const extension = extname(file);
    const source = await Bun.file(join(ROOT, file)).text();
    const lineCount = source.split("\n").length;

    if (MEASURED_EXTENSIONS.has(extension)) {
      if (lineCount > LINE_CEILING)
        result.lineViolations.push({ file, detail: `${lineCount} lines` });
      else if (lineCount >= REFACTOR_WARNING)
        result.warnings.push({ file, detail: `${lineCount} lines` });
    }

    if (CODE_EXTENSIONS.has(extension)) {
      const commentLine = findCommentLine(source);
      if (commentLine !== null) {
        result.commentViolations.push({ file, detail: `comment at line ${commentLine}` });
      }
    }
  }

  return result;
}

function report(title: string, violations: Violation[]): void {
  if (violations.length === 0) {
    console.log(`PASS  ${title}`);
    return;
  }
  console.log(`FAIL  ${title}`);
  for (const violation of violations) console.log(`      ${violation.file} (${violation.detail})`);
}

const { lineViolations, commentViolations, warnings } = await auditRepository();

report(`line ceiling (<= ${LINE_CEILING})`, lineViolations);
report("zero comments in code", commentViolations);

if (warnings.length > 0) {
  console.log(`WARN  approaching ceiling (>= ${REFACTOR_WARNING})`);
  for (const warning of warnings) console.log(`      ${warning.file} (${warning.detail})`);
}

process.exit(lineViolations.length + commentViolations.length > 0 ? 1 : 0);
