import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import cpp from "highlight.js/lib/languages/cpp";
import c from "highlight.js/lib/languages/c";
import csharp from "highlight.js/lib/languages/csharp";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";

const grammars = { java, python, javascript, typescript, cpp, c, csharp, go, rust, sql, json, bash, xml };
for (const [name, grammar] of Object.entries(grammars)) hljs.registerLanguage(name, grammar);

export const CODE_LANGUAGES = [
  ["java", "Java"], ["python", "Python"], ["javascript", "JavaScript"],
  ["typescript", "TypeScript"], ["cpp", "C++"], ["c", "C"],
  ["csharp", "C#"], ["go", "Go"], ["rust", "Rust"], ["sql", "SQL"],
  ["json", "JSON"], ["bash", "Shell"], ["xml", "HTML / XML"], ["plaintext", "Plain text"],
];

const aliases = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", "c++": "cpp", cc: "cpp", cxx: "cpp", "c#": "csharp", cs: "csharp",
  golang: "go", rs: "rust", sh: "bash", shell: "bash", zsh: "bash",
  html: "xml", text: "plaintext", txt: "plaintext", plain: "plaintext",
};

export function normalizeLanguage(value = "") {
  const name = String(value).trim().toLowerCase().replace(/^language-/, "");
  if (!name || name === "auto") return "auto";
  const resolved = aliases[name] || name;
  return resolved === "plaintext" || Object.hasOwn(grammars, resolved) ? resolved : "plaintext";
}

export function languageLabel(language) {
  return CODE_LANGUAGES.find(([value]) => value === language)?.[1] || "Plain text";
}

// Parse only fenced blocks, leaving ordinary notes as literal text. Never render
// user HTML or execute Markdown. Unclosed fences still display all saved code.
export function parseCodeNotes(value = "") {
  const text = String(value);
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) || [];
  const blocks = [];
  let plain = "", code = "", opening = null;
  function flushText() {
    if (plain) blocks.push({ type: "text", text: plain });
    plain = "";
  }
  for (const line of lines) {
    const content = line.replace(/\r?\n$/, "");
    if (!opening) {
      const match = content.match(/^ {0,3}(`{3,}|~{3,})([^`]*)$/);
      if (match) {
        flushText();
        opening = { marker: match[1][0], length: match[1].length, language: normalizeLanguage(match[2].trim().split(/\s+/)[0]) };
        code = "";
      } else plain += line;
    } else {
      const close = content.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (close && close[1][0] === opening.marker && close[1].length >= opening.length) {
        blocks.push({ type: "code", code, language: opening.language });
        opening = null; code = "";
      } else code += line;
    }
  }
  if (opening) blocks.push({ type: "code", code, language: opening.language });
  flushText();
  return blocks;
}

export function looksLikeCode(text = "") {
  const first = text.trimStart().split(/\r?\n/)[0] || "";
  return /^(?:\/\/|\/\*|#(?:include|!|\s)|\{|\[\s*\{|<\/?[a-z]|@\w+)/i.test(first) ||
    /^(?:(?:public|private|protected|static|final|abstract)\s+)*(?:class|interface|enum|record)\s+\w+/.test(first) ||
    /^(?:def|async def|class)\s+\w+.*:\s*(?:#.*)?$/.test(first) ||
    /^(?:import\s+[\w{*]|from\s+\w+\s+import|package\s+\w+|#include\b)/.test(first) ||
    /^(?:(?:export|async)\s+)*(?:function\s|(?:const|let|var)\s+\w+\s*=)/.test(first) ||
    /^(?:(?:public|private|protected|static|final)\s+)*(?:void|int|long|double|float|boolean|bool|String|string|char|List\b|Map\b|vector\b)\s*[\w<>, ?\[\]]*\s+\w+\s*[=(;]/.test(first) ||
    /^(?:func\s+\w+\s*\(|fn\s+\w+\s*\(|SELECT\s+.+\s+FROM\b|WITH\s+\w+\s+AS\s*\()/i.test(first);
}

export function highlightCode(code, language = "auto") {
  const selected = normalizeLanguage(language);
  const maxLength = selected === "auto" ? 16000 : 40000;
  if (selected === "plaintext" || code.length > maxLength) {
    return { html: null, language: "plaintext", limited: code.length > maxLength };
  }
  try {
    const result = selected === "auto"
      ? hljs.highlightAuto(code, Object.keys(grammars))
      : hljs.highlight(code, { language: selected, ignoreIllegals: true });
    // Only the library's escaped output is eligible for HTML rendering.
    return { html: result.value, language: result.language || "plaintext", limited: false };
  } catch {
    return { html: null, language: "plaintext", limited: false };
  }
}

// Store language information inside the existing notes string, not a new column.
export function insertCodeFence(text, start, end, language = "java") {
  start = Math.max(0, Math.min(text.length, start));
  end = Math.max(start, Math.min(text.length, end));
  const selection = text.slice(start, end);
  const longest = Math.max(0, ...(selection.match(/`+/g) || []).map((x) => x.length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  const before = text.slice(0, start), after = text.slice(end);
  const prefix = before && !before.endsWith("\n") ? "\n" : "";
  const opening = `${prefix}${fence}${normalizeLanguage(language)}\n`;
  const closing = `${selection.endsWith("\n") ? "" : "\n"}${fence}${after && !after.startsWith("\n") ? "\n" : ""}`;
  return {
    text: before + opening + selection + closing + after,
    start: before.length + opening.length,
    end: before.length + opening.length + selection.length,
  };
}
