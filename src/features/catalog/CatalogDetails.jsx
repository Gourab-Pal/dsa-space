import { useEffect, useRef } from "react";
import { ArrowSquareOut, Check, Plus, X } from "@phosphor-icons/react";
import { safeUrl } from "../questions/questionModel.js";

export function CatalogDetails({ question, added, full, add, close }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  const url = safeUrl(question.url);
  const attribution = safeUrl(question.attribution_url);
  return (
    <dialog
      ref={ref}
      className="modal catalog-detail"
      aria-labelledby="catalog-detail-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="modal-heading">
        <span className="catalog-eyebrow">
          {question.platform} · {question.source_id}
        </span>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close question details"
        >
          <X size={22} />
        </button>
      </div>
      <h2 id="catalog-detail-title">{question.title}</h2>
      <div className="catalog-tags">
        <span className={`difficulty ${question.difficulty.toLowerCase()}`}>
          {question.difficulty}
        </span>
        <span>{question.topic}</span>
        {question.source_rating != null && (
          <span>Source rating: {question.source_rating}</span>
        )}
      </div>
      {question.summary && (
        <p className="catalog-summary">{question.summary}</p>
      )}
      <dl className="catalog-facts">
        <div>
          <dt>Topics & patterns</dt>
          <dd>
            {question.tags.length ? question.tags.join(" · ") : question.topic}
          </dd>
        </div>
        <div>
          <dt>Access</dt>
          <dd>
            {question.access === "free"
              ? "Free"
              : question.access === "premium"
                ? "Platform subscription required"
                : "Check the source platform"}
          </dd>
        </div>
        <div>
          <dt>Original question</dt>
          <dd>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer">
                {url} <ArrowSquareOut size={16} />
              </a>
            )}
          </dd>
        </div>
        <div>
          <dt>Catalog updated</dt>
          <dd>{question.updated_on}</dd>
        </div>
      </dl>
      {attribution && (
        <p className="catalog-attribution">
          Metadata:{" "}
          <a href={attribution} target="_blank" rel="noopener noreferrer">
            {question.attribution} <ArrowSquareOut size={13} />
          </a>
        </p>
      )}
      <p className="catalog-hint">
        Read the full problem and submit on {question.platform}. Track your own
        practice in My Questions.
      </p>
      {full && !added && (
        <p className="catalog-hint" role="status">
          Your library is full. Remove questions from My Questions before adding
          more.
        </p>
      )}
      <div className="form-actions">
        {url && (
          <a
            className="secondary-button"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open problem <ArrowSquareOut size={16} />
          </a>
        )}
        <button
          className="primary-button"
          disabled={added || full}
          onClick={() => add([question])}
        >
          {added ? <Check size={17} /> : <Plus size={17} />}
          {added ? "Added" : "Add to My Questions"}
        </button>
      </div>
    </dialog>
  );
}
