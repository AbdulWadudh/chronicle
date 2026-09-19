import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";

const ROOT = join(import.meta.dir, "..");
const LINE_CEILING = 300;
const REFACTOR_WARNING = 250;

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  ".turbo",
  ".expo",
  ".git",
  "public",
  "android",
  "ios",
]);

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const MEASURED_EXTENSIONS = new Set([...CODE_EXTENSIONS, ".json", ".css", ".toml", ".yaml", ".yml"]);

interface Violation {
  file: string;
  detail: string;
}

function collectFiles(directory: string, found: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    if (IGNORED_DIRECTORIES.has(entry)) continue;
    const absolute = join(directory, entry);
    if (statSync(absolute).isDirectory()) collectFiles(absolute, found);
    else found.push(absolute);
  }
  return found;
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

function auditFile(absolute: string, lineViolations: Violation[], commentViolations: Violation[], warnings: Violation[]): void {
  const extension = extname(absolute);
  const file = relative(ROOT, absolute).split(sep).join("/");
  const source = readFileSync(absolute, "utf8");
  const lineCount = source.split("\n").length;

  if (MEASURED_EXTENSIONS.has(extension)) {
    if (lineCount > LINE_CEILING) lineViolations.push({ file, detail: `${lineCount} lines` });
    else if (lineCount >= REFACTOR_WARNING) warnings.push({ file, detail: `${lineCount} lines` });
  }

  if (CODE_EXTENSIONS.has(extension)) {
    const commentLine = findCommentLine(source);
    if (commentLine !== null) commentViolations.push({ file, detail: `comment at line ${commentLine}` });
  }
}

function report(title: string, violations: Violation[]): void {
  if (violations.length === 0) {
    console.log(`PASS  ${title}`);
    return;
  }
  console.log(`FAIL  ${title}`);
  for (const violation of violations) console.log(`      ${violation.file} (${violation.detail})`);
}

const lineViolations: Violation[] = [];
const commentViolations: Violation[] = [];
const warnings: Violation[] = [];

for (const absolute of collectFiles(ROOT)) {
  auditFile(absolute, lineViolations, commentViolations, warnings);
}

report(`line ceiling (<= ${LINE_CEILING})`, lineViolations);
report("zero comments in code", commentViolations);

if (warnings.length > 0) {
  console.log(`WARN  approaching ceiling (>= ${REFACTOR_WARNING})`);
  for (const warning of warnings) console.log(`      ${warning.file} (${warning.detail})`);
}

process.exit(lineViolations.length + commentViolations.length > 0 ? 1 : 0);
