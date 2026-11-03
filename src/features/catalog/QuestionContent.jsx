import { ArrowSquareOut } from "@phosphor-icons/react";
import { safeUrl } from "../questions/questionModel.js";
import { useCatalogQuestion } from "./useCatalogQuestion.js";

// Shared by catalog previews and private questions. Solutions stay collapsed.
export function QuestionContent({ id, version, updateVersion }) {
  const state = useCatalogQuestion(id, version);
  if (state.loading) return <p className="catalog-hint" role="status">Loading saved question…</p>;
  if (state.error) return <div className="question-content" role="alert">
    <p>{state.error}</p><button className="catalog-text-button" onClick={state.retry}>Retry content</button>
  </div>;
  const question = state.question, content = question.content;
  return <article className="question-content" aria-label="Stored question content">
    <div className="question-version">
      <span>DSA Space edition · Version {question.version}</span>
      {updateVersion && question.latest_version > question.version &&
        <button className="catalog-text-button" onClick={() => updateVersion(question.latest_version)}>
          Use updated question
        </button>}
    </div>
    <p className="question-statement">{content.description}</p>
    <section><h3>Input</h3><p>{content.input_format}</p></section>
    <section><h3>Output</h3><p>{content.output_format}</p></section>
    <section><h3>Constraints</h3><ul>{content.constraints.map((text,i) => <li key={i}>{text}</li>)}</ul></section>
    <section><h3>Examples</h3><div className="question-examples">
      {content.examples.map((example,index) => <div className="question-example" key={index}>
        <h4>Example {index+1}</h4>
        <span>Input</span><pre><code>{formatInput(example.input)}</code></pre>
        <span>Output</span><pre><code>{JSON.stringify(example.output)}</code></pre>
        <p>{example.explanation}</p>
      </div>)}
    </div></section>
    <details className="question-disclosure"><summary>Hints <span>{content.hints.length}</span></summary>
      {content.hints.map((hint,index) => <details className="question-hint" key={index}>
        <summary>Reveal hint {index+1}</summary><p>{hint}</p>
      </details>)}
    </details>
    <details className="question-disclosure"><summary>Approaches & complexity <span>{question.approaches.length}</span></summary>
      {question.approaches.map((approach) => <section className="question-approach" key={approach.id}>
        <h3>{approach.title}</h3><p>{approach.explanation}</p>
        <dl><div><dt>Time</dt><dd>{approach.time_complexity}</dd></div><div><dt>Space</dt><dd>{approach.space_complexity}</dd></div></dl>
        <p className="question-assumptions">{approach.assumptions}</p>
        <pre><code>{approach.pseudocode}</code></pre>
      </section>)}
    </details>
    <details className="question-disclosure"><summary>Related practice & sources</summary>
      <p>The stored exercise is independently authored. Linked exercises may use different examples, input formats or tie rules.</p>
      <div className="catalog-alternate-links">{question.source_links.filter((link)=>safeUrl(link.url)).map((link) =>
        <a key={link.id} href={safeUrl(link.url)} target="_blank" rel="noopener noreferrer">
          <span>{link.platform} · {link.title}</span>
          <small>{link.access === "premium" ? "Platform subscription required" : "Open related exercise"}</small>
          <ArrowSquareOut size={16}/>
        </a>)}</div>
      <p className="catalog-hint">{content.authorship} {content.attribution} · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · Updated {content.reviewed_on}</p>
      <p className="catalog-hint">{content.verification}</p>
      <p className="catalog-hint">Prerequisites: {content.prerequisites.join(" · ")}</p>
    </details>
  </article>;
}

function formatInput(input) {
  return "{\n" + Object.entries(input).map(([key,value]) =>
    `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`
  ).join(",\n") + "\n}";
}
