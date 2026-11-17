import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Code, Copy } from "@phosphor-icons/react";
import {
  CODE_LANGUAGES, highlightCode, insertCodeFence, languageLabel,
  looksLikeCode, parseCodeNotes,
} from "./codeContentModel.js";
import "./code-content.css";

function CodeBlock({ code, language = "auto" }) {
  const [chosen, setChosen] = useState(language);
  const [copyStatus, setCopyStatus] = useState("");
  const copyTimer = useRef(null);
  useEffect(() => { setChosen(language); setCopyStatus(""); }, [code, language]);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const highlighted = useMemo(() => highlightCode(code, chosen), [code, chosen]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("Copied");
    } catch { setCopyStatus("Copy unavailable; select the code to copy."); }
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyStatus(""), 2500);
  }

  return <section className="saved-code" aria-label="Saved code block">
    <div className="saved-code-toolbar">
      <select aria-label="Code language" value={chosen} onChange={(e) => setChosen(e.target.value)}>
        <option value="auto">Auto · {languageLabel(highlighted.language)}</option>
        {CODE_LANGUAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button type="button" onClick={copy} aria-label="Copy code">
        {copyStatus === "Copied" ? <Check size={15} /> : <Copy size={15} />}
        {copyStatus === "Copied" ? "Copied" : "Copy"}
      </button>
    </div>
    <pre tabIndex={0} aria-label={`${languageLabel(highlighted.language)} code`}>
      {highlighted.html !== null
        ? <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted.html }} />
        : <code>{code}</code>}
    </pre>
    <span className="code-copy-status" role="status">{copyStatus}</span>
    {highlighted.limited && <small className="code-size-note">Large snippet shown as plain text.</small>}
  </section>;
}

export function NotesContent({ text = "", codeOnly = false }) {
  const blocks = useMemo(() => {
    const parsed = parseCodeNotes(text);
    if (parsed.length === 1 && parsed[0].type === "text" && (codeOnly || looksLikeCode(text))) {
      return [{ type: "code", code: text, language: "auto" }];
    }
    return parsed;
  }, [text, codeOnly]);
  return <div className="saved-notes">
    {blocks.map((block, index) => block.type === "code"
      ? <CodeBlock key={index} code={block.code} language={block.language} />
      : <div className="saved-note-text" key={index}>{block.text}</div>)}
  </div>;
}

export function CodeNotesEditor({ defaultValue = "" }) {
  const id = useId();
  const area = useRef(null);
  const [text, setText] = useState(defaultValue);
  const [language, setLanguage] = useState("java");
  const [error, setError] = useState("");

  function insert() {
    const input = area.current;
    const update = insertCodeFence(text, input.selectionStart, input.selectionEnd, language);
    if (update.text.length > 100000) { setError("There is no room for a code block within the 100,000-character notes limit."); return; }
    setError(""); setText(update.text);
    requestAnimationFrame(() => {
      input.focus(); input.setSelectionRange(update.start, update.end);
    });
  }

  return <div className="field code-notes-editor">
    <label htmlFor={id}>My approach and notes</label>
    <div className="notes-editor-tools">
      <select aria-label="Language for new code block" value={language} onChange={(e) => setLanguage(e.target.value)}>
        {CODE_LANGUAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button className="text-button" type="button" onClick={insert}>
        <Code size={17} /> Insert code block
      </button>
    </div>
    <textarea ref={area} id={id} name="notes" rows={7} maxLength={100000}
      value={text} onChange={(e) => { setText(e.target.value); setError(""); }}
      autoFocus spellCheck={false} aria-describedby={`${id}-help`} />
    <small id={`${id}-help`}>Select existing code and insert a block, or insert an empty block and paste inside. Highlighting appears after saving.</small>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
