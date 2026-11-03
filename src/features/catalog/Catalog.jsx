import { useMemo, useState } from "react";
import {
  ArrowSquareOut,
  Books,
  CaretLeft,
  CaretRight,
  Check,
  MagnifyingGlass,
  Plus,
} from "@phosphor-icons/react";
import { TOPICS, DIFFICULTIES } from "../../config/topics.js";
import { useCatalog } from "./useCatalog.js";
import {
  isInLibrary,
  libraryIndex,
  LIBRARY_LIMIT,
  SELECTION_LIMIT,
} from "./catalogModel.js";
import { CatalogDetails } from "./CatalogDetails.jsx";
import { safeUrl } from "../questions/questionModel.js";
import "./catalog.css";

export function Catalog({
  questions: personalQuestions,
  addQuestions,
  openLibrary,
}) {
  const catalog = useCatalog();
  const [selection, setSelection] = useState({});
  const [detail, setDetail] = useState(null);
  const [notice, setNotice] = useState("");
  const [showCoverage, setShowCoverage] = useState(false);
  const index = useMemo(
    () => libraryIndex(personalQuestions),
    [personalQuestions],
  );
  const selected = Object.values(selection).filter(
    (q) => !isInLibrary(q, index),
  );
  const capacity = LIBRARY_LIMIT - personalQuestions.length;
  const pages = Math.max(1, Math.ceil(catalog.total / catalog.pageSize));
  const visible = catalog.questions.filter((q) => !isInLibrary(q, index));
  const pageSelected =
    visible.length > 0 && visible.every((q) => selection[q.id]);

  function toggle(question) {
    setNotice("");
    setSelection((current) => {
      const next = { ...current };
      if (next[question.id]) delete next[question.id];
      else if (
        Object.values(next).filter((q) => !isInLibrary(q, index)).length <
        SELECTION_LIMIT
      )
        next[question.id] = question;
      return next;
    });
  }

  function selectPage() {
    setNotice("");
    setSelection((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([, q]) => !isInLibrary(q, index)),
      );
      for (const q of visible) {
        if (pageSelected) delete next[q.id];
        else if (Object.keys(next).length < SELECTION_LIMIT) next[q.id] = q;
      }
      return next;
    });
  }

  function add(items) {
    const newItems = items.filter((q) => !isInLibrary(q, index));
    if (newItems.length > capacity) {
      setNotice(
        `Your library has room for ${capacity} more questions. Select fewer questions or remove some from My Questions.`,
      );
      return;
    }
    addQuestions(newItems);
    setSelection({});
    setNotice(
      `${newItems.length} question${newItems.length === 1 ? "" : "s"} added to My Questions.`,
    );
  }

  return (
    <section className="catalog" aria-label="Shared question catalog">
      <div className="catalog-intro">
        <span>
          <Books size={18} /> {catalog.meta.total.toLocaleString()} questions to
          explore
        </span>
        <button
          className="catalog-text-button"
          onClick={() => setShowCoverage(!showCoverage)}
          aria-expanded={showCoverage}
        >
          Sources & coverage
        </button>
      </div>
      {showCoverage && (
        <div className="catalog-coverage">
          <p>
            A curated library of independently authored interview exercises.
            Descriptions, examples, hints and approaches are saved here.
            Start with a focused collection or browse the full library.
            The first release has 50 complete exercises; the broader catalog
            will grow through reviewed additions. Related platform links may change.
          </p>
          {catalog.meta.sources.map((source) => (
            <div key={source.id}>
              <strong>{source.name}</strong>
              <span>
                {source.question_count.toLocaleString()} questions ·{" "}
                {source.coverage} · Updated {source.updated_on}
              </span>
            </div>
          ))}
        </div>
      )}
      {catalog.metaError && (
        <p className="catalog-hint">
          Collection information could not load.{" "}
          <button className="catalog-text-button" onClick={catalog.retry}>
            Retry
          </button>
        </p>
      )}
      <div className="catalog-collections" aria-label="Catalog collections">
        <button
          className={!catalog.filters.collection ? "active" : ""}
          aria-pressed={!catalog.filters.collection}
          onClick={() => catalog.filter("collection", "")}
        >
          <strong>All questions</strong>
          <span>All available questions</span>
        </button>
        {catalog.meta.collections.map((collection) => (
          <button
            key={collection.id}
            className={
              catalog.filters.collection === collection.id ? "active" : ""
            }
            aria-pressed={catalog.filters.collection === collection.id}
            onClick={() => catalog.filter("collection", collection.id)}
          >
            <strong>{collection.title}</strong>
            <span>{collection.question_count.toLocaleString()} questions</span>
          </button>
        ))}
      </div>
      <div className="catalog-filters">
        <label className="search-box">
          <MagnifyingGlass size={19} />
          <input
            aria-label="Search catalog questions"
            placeholder="Search questions or patterns…"
            value={catalog.filters.query}
            maxLength={120}
            onChange={(e) => catalog.filter("query", e.target.value)}
          />
        </label>
        <select
          aria-label="Catalog platform"
          value={catalog.filters.platform}
          onChange={(e) => catalog.filter("platform", e.target.value)}
        >
          <option value="">All platforms</option>
          {catalog.meta.sources.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Catalog topic"
          value={catalog.filters.topic}
          onChange={(e) => catalog.filter("topic", e.target.value)}
        >
          <option value="">All topics</option>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          aria-label="Catalog difficulty"
          value={catalog.filters.difficulty}
          onChange={(e) => catalog.filter("difficulty", e.target.value)}
        >
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="catalog-selection">
        <div>
          <strong>{selected.length} selected</strong>
          <span>Pick up to {SELECTION_LIMIT} at a time</span>
        </div>
        <div>
          <button
            className="catalog-text-button"
            onClick={() => setSelection({})}
            disabled={!selected.length}
          >
            Clear
          </button>
          <button
            className="primary-button"
            onClick={() => add(selected)}
            disabled={!selected.length}
          >
            <Plus size={17} /> Add selected
          </button>
        </div>
      </div>
      {notice && (
        <div className="catalog-notice" role="status">
          {notice}{" "}
          <button className="catalog-text-button" onClick={openLibrary}>
            Go to My Questions <CaretRight size={15} />
          </button>
        </div>
      )}
      {selected.length >= SELECTION_LIMIT && (
        <p className="catalog-hint">
          Selection limit reached. Add these questions before selecting more.
        </p>
      )}
      <div aria-busy={catalog.loading} className="catalog-results">
        {catalog.error ? (
          <div className="catalog-empty" role="alert">
            <p>{catalog.error}</p>
            <button className="secondary-button" onClick={catalog.retry}>
              Retry catalog
            </button>
          </div>
        ) : catalog.loading ? (
          <div className="catalog-empty" role="status">
            Loading questions…
          </div>
        ) : !catalog.questions.length ? (
          <div className="catalog-empty">
            <h2>No matching questions</h2>
            <p>Try another topic, platform or search.</p>
            <button className="secondary-button" onClick={catalog.reset}>
              Clear filters
            </button>
          </div>
        ) : (
          <table className="catalog-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select available questions on this page"
                    checked={pageSelected}
                    disabled={!visible.length}
                    onChange={selectPage}
                  />
                </th>
                <th>Question</th>
                <th>Difficulty</th>
                <th>Platform</th>
                <th>
                  <span className="catalog-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {catalog.questions.map((q) => {
                const added = isInLibrary(q, index);
                return (
                  <tr key={q.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${q.title}`}
                        disabled={
                          added ||
                          (selected.length >= SELECTION_LIMIT &&
                            !selection[q.id])
                        }
                        checked={added || Boolean(selection[q.id])}
                        onChange={() => toggle(q)}
                      />
                    </td>
                    <td>
                      <button
                        className="catalog-question"
                        onClick={() => setDetail(q)}
                      >
                        {q.title}
                      </button>
                      <span className="catalog-row-topic">{q.topic}</span>
                    </td>
                    <td>
                      <span
                        className={`difficulty ${q.difficulty.toLowerCase()}`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td>
                      <span className="catalog-platform">{q.platform}</span>
                      <small>
                        {q.source_links?.length > 1
                          ? `${q.source_links.length} practice links`
                          : "Saved exercise"}
                      </small>
                    </td>
                    <td>
                      <div className="catalog-row-actions">
                        {safeUrl(q.url) && (
                          <a
                            className="icon-button"
                            href={q.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${q.title} on ${q.platform}`}
                          >
                            <ArrowSquareOut size={18} />
                          </a>
                        )}
                        <button
                          className={`catalog-add ${added ? "is-added" : ""}`}
                          disabled={added}
                          onClick={() => add([q])}
                          aria-label={
                            added
                              ? `${q.title} already added`
                              : `Add ${q.title} to My Questions`
                          }
                        >
                          {added ? <Check size={16} /> : <Plus size={16} />}
                          <span>{added ? "Added" : "Add"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {!catalog.error && !catalog.loading && catalog.total > 0 && (
        <div className="table-footer">
          <span>
            {((catalog.page - 1) * catalog.pageSize + 1).toLocaleString()}–
            {Math.min(
              catalog.page * catalog.pageSize,
              catalog.total,
            ).toLocaleString()}{" "}
            of {catalog.total.toLocaleString()} questions
          </span>
          <div className="catalog-pagination">
            <button
              className="icon-button"
              aria-label="Previous catalog page"
              disabled={catalog.page <= 1}
              onClick={() => catalog.setPage(catalog.page - 1)}
            >
              <CaretLeft size={18} />
            </button>
            <span>
              Page {catalog.page} of {pages}
            </span>
            <button
              className="icon-button"
              aria-label="Next catalog page"
              disabled={catalog.page >= pages}
              onClick={() => catalog.setPage(catalog.page + 1)}
            >
              <CaretRight size={18} />
            </button>
          </div>
        </div>
      )}
      <p className="catalog-hint">
        Questions you pick appear in your private library. Your notes, attempts
        and progress belong to you.
      </p>
      {detail && (
        <CatalogDetails
          question={detail}
          close={() => setDetail(null)}
          added={isInLibrary(detail, index)}
          full={capacity <= 0}
          add={add}
        />
      )}
    </section>
  );
}
