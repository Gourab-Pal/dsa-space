import { useEffect, useMemo, useRef, useState } from "react";

import {
    FileText,
    CalendarBlank,
    ChartBar,
    GearSix,
    Stack,
    LinkSimple,
    Columns,
    MagnifyingGlass,
    ListBullets,
    TreeStructure,
    Graph,
    CaretRight,
    CaretLeft,
    Plus,
    X,
    Star,
    ArrowSquareOut,
    PencilSimple,
    Check,
    CheckCircle,
    ClockCounterClockwise,
    Circle,
    Clock,
    Play,
    Database,
    FunnelSimple,
    DownloadSimple,
    UploadSimple,
    Trash,
    List,
    CheckSquare,
    Square,
    Books,
} from "@phosphor-icons/react";

import { TOPICS, DIFFICULTIES } from "./config/topics.js";
import { today, shiftDay, formatDay } from "./lib/dates.js";
import { safeUrl, lastAttempt, streak, validateBackup } from "./features/questions/questionModel.js";

import { QuestionContent } from "./features/catalog/QuestionContent.jsx";
import { Catalog } from "./features/catalog/Catalog.jsx";
import { addCatalogQuestions, LIBRARY_LIMIT } from "./features/catalog/catalogModel.js";

const PAGE_SIZE = 8;

const TOPIC_ICONS = [
    Stack,
    LinkSimple,
    Columns,
    Stack,
    MagnifyingGlass,
    ListBullets,
    TreeStructure,
    Graph,
];

const STATUSES = [
    "Not started",
    "Learning",
    "Solved",
    "Revisit",
];

function downloadBackup(data) {
    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `dsa-space-${today()}.json`;
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Status({ value }) {
    const Icon =
        value === "Solved"
            ? CheckCircle
            : value === "Revisit"
                ? ClockCounterClockwise
                : Circle;

    const className = value
        .toLowerCase()
        .replaceAll(" ", "-");

    return (
        <span className={`status ${className}`}>
      <Icon
          size={21}
          weight={value === "Solved" ? "fill" : "regular"}
      />
            {value}
    </span>
    );
}

function Bar({ value, total, brand = false }) {
    const percentage = total
        ? (value / total) * 100
        : 0;

    return (
        <div
            className={`bar ${brand ? "brand" : ""}`}
            role="progressbar"
            aria-label="Questions solved"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={Math.max(total, 1)}
        >
            <span style={{ width: `${percentage}%` }} />
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="field">
            <span>{label}</span>
            {children}
        </label>
    );
}

function Dialog({ title, children, close }) {
    const ref = useRef(null);

    useEffect(() => {
        const dialog = ref.current;

        dialog.showModal();

        return () => dialog.close();
    }, []);

    return (
        <dialog
            ref={ref}
            className="modal"
            aria-labelledby="modal-title"
            onCancel={close}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    close();
                }
            }}
        >
            <div className="modal-heading">
                <h2 id="modal-title">{title}</h2>

                <button
                    className="icon-button"
                    aria-label="Close dialog"
                    onClick={close}
                >
                    <X size={23} />
                </button>
            </div>

            {children}
        </dialog>
    );
}

function Editor({
                    mode,
                    question,
                    topic,
                    save,
                    close,
                }) {
    const [error, setError] = useState("");

    function handleSubmit(event) {
        event.preventDefault();

        const values = Object.fromEntries(
            new FormData(event.currentTarget)
        );

        if (mode === "question") {
            if (!values.title.trim()) {
                setError("Enter a question title.");
                return;
            }

            if (values.url && !safeUrl(values.url)) {
                setError(
                    "Use an http:// or https:// source URL."
                );
                return;
            }

            values.title = values.title.trim();
            values.url = values.url
                ? safeUrl(values.url)
                : "";
        }

        if (mode === "practice") {
            values.minutes = Number(values.minutes);
        }

        save(values);
    }

    return (
        <form onSubmit={handleSubmit}>
            {mode === "question" && (
                <>
                    <Field label="Question title">
                        <input
                            name="title"
                            required
                            maxLength={240}
                            defaultValue={question?.title || ""}
                            autoFocus
                            placeholder="e.g. Two Sum"
                        />
                    </Field>

                    <Field label="Source URL (optional)">
                        <input
                            name="url"
                            type="url"
                            defaultValue={question?.url || ""}
                            placeholder="https://leetcode.com/problems/two-sum/"
                        />
                    </Field>

                    <div className="form-grid">
                        <Field label="Topic">
                            <select
                                name="topic"
                                defaultValue={
                                    question?.topic ||
                                    (topic === "All questions"
                                        ? TOPICS[0]
                                        : topic)
                                }
                            >
                                {TOPICS.map((item) => (
                                    <option key={item}>{item}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Difficulty">
                            <select
                                name="difficulty"
                                defaultValue={
                                    question?.difficulty || "Easy"
                                }
                            >
                                {DIFFICULTIES.map(
                                    (item) => (
                                        <option key={item}>{item}</option>
                                    )
                                )}
                            </select>
                        </Field>

                        <Field label="Status">
                            <select
                                name="status"
                                defaultValue={
                                    question?.status || "Not started"
                                }
                            >
                                {STATUSES.map((item) => (
                                    <option key={item}>{item}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Next revision">
                            <input
                                name="revision"
                                type="date"
                                defaultValue={
                                    question?.revision || ""
                                }
                            />
                        </Field>
                    </div>
                </>
            )}

            {mode === "notes" && (
                <>
                    <Field label="My approach and notes">
            <textarea
                name="notes"
                rows={5}
                defaultValue={question.notes}
                maxLength={100000}
                autoFocus
            />
                    </Field>

                    <Field label="Solution / code">
            <textarea
                name="solution"
                className="code-input"
                rows={7}
                defaultValue={question.solution}
                maxLength={100000}
                spellCheck={false}
            />
                    </Field>

                    <div className="form-grid">
                        <Field label="Time complexity">
                            <input
                                name="time"
                                defaultValue={question.time}
                                placeholder="O(n)"
                                maxLength={60}
                            />
                        </Field>

                        <Field label="Space complexity">
                            <input
                                name="space"
                                defaultValue={question.space}
                                placeholder="O(n)"
                                maxLength={60}
                            />
                        </Field>
                    </div>
                </>
            )}

            {mode === "practice" && (
                <>
                    <p className="form-subtitle">
                        {question.title}
                    </p>

                    <div className="form-grid">
                        <Field label="Practice date">
                            <input
                                name="date"
                                type="date"
                                required
                                defaultValue={today()}
                                max={today()}
                            />
                        </Field>

                        <Field label="Time taken (minutes)">
                            <input
                                name="minutes"
                                type="number"
                                required
                                min={1}
                                max={1440}
                                defaultValue={15}
                            />
                        </Field>

                        <Field label="Language">
                            <input
                                name="language"
                                required
                                maxLength={40}
                                defaultValue="Java"
                            />
                        </Field>

                        <Field label="Outcome">
                            <select name="outcome">
                                <option>Solved</option>
                                <option>Revisit</option>
                                <option>Learning</option>
                            </select>
                        </Field>

                        <Field label="Confidence">
                            <select
                                name="confidence"
                                defaultValue={question.confidence}
                            >
                                <option>Learning</option>
                                <option>With a hint</option>
                                <option>Comfortable</option>
                            </select>
                        </Field>

                        <Field label="Next revision">
                            <input
                                name="revision"
                                type="date"
                                defaultValue={shiftDay(today(), 3)}
                            />
                        </Field>
                    </div>

                    <Field label="What did you learn? (optional)">
            <textarea
                name="note"
                rows={3}
                maxLength={10000}
                placeholder="Approach, mistakes, or what to revisit…"
            />
                    </Field>
                </>
            )}

            {error && (
                <p className="form-error" role="alert">
                    {error}
                </p>
            )}

            <div className="form-actions">
                <button
                    className="secondary-button"
                    type="button"
                    onClick={close}
                >
                    Cancel
                </button>

                <button
                    className="primary-button"
                    type="submit"
                >
                    {mode === "practice"
                        ? "Save practice"
                        : mode === "notes"
                            ? "Save notes"
                            : question
                                ? "Save changes"
                                : "Add question"}
                </button>
            </div>
        </form>
    );
}

export function App({ onSignOut, workspace }) {
    const {
        data, setData, saveError, saving, hasUnsavedChanges,
        browserBackup, retrySave, reloadWorkspace,
    } = workspace;

    const [view, setView] = useState("Questions");
    const [topic, setTopic] = useState(
        "All questions"
    );
    const [tab, setTab] = useState("All questions");
    const [query, setQuery] = useState("");
    const [difficulty, setDifficulty] = useState(
        "All difficulty"
    );
    const [status, setStatus] = useState(
        "All statuses"
    );
    const [sort, setSort] = useState(
        "Library order"
    );
    const [filtersOpen, setFiltersOpen] =
        useState(false);
    const [page, setPage] = useState(1);

    const [selectedId, setSelectedId] = useState(
        data.questions[0]?.id || null
    );
    const [detailTab, setDetailTab] = useState(
        "Notes"
    );
    const [mobileNav, setMobileNav] =
        useState(false);
    const [modal, setModal] = useState(null);
    const [toast, setToast] = useState("");
    const [signingOut, setSigningOut] = useState(false);

    const fileRef = useRef(null);

    async function handleSignOut() {
        if (signingOut) return;
        setSigningOut(true);
        try {
            await onSignOut();
        } catch (error) {
            setToast(error.message || "Could not sign out. Check your connection and try again.");
        } finally {
            setSigningOut(false);
        }
    }

    const { questions } = data;

    const selected = questions.find(
        (question) => question.id === selectedId
    );

    const solved = questions.filter(
        (question) => question.status === "Solved"
    ).length;

    const revisits = questions.filter(
        (question) => question.status === "Revisit"
    ).length;

    const doneToday = questions.filter(
        (question) =>
            question.attempts.some(
                (attempt) => attempt.date === today()
            )
    ).length;

    const showLibrary =
        view === "Questions" || view === "Today";

    const recent = selected
        ? lastAttempt(selected)
        : null;

    const topics = TOPICS.map((name, index) => ({
        name,
        Icon: TOPIC_ICONS[index] || Stack,

        total: questions.filter(
            (question) => question.topic === name
        ).length,

        solved: questions.filter(
            (question) =>
                question.topic === name &&
                question.status === "Solved"
        ).length,
    }));

    useEffect(() => {
        setPage(1);
    }, [
        topic,
        tab,
        query,
        difficulty,
        status,
        sort,
        view,
    ]);

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer = setTimeout(
            () => setToast(""),
            4000
        );

        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        function handleKey(event) {
            if (event.key === "Escape" && !modal) {
                setSelectedId(null);
                setMobileNav(false);
            }
        }

        window.addEventListener(
            "keydown",
            handleKey
        );

        return () =>
            window.removeEventListener(
                "keydown",
                handleKey
            );
    }, [modal]);

    function patchQuestion(id, changes) {
        setData((previous) => ({
            ...previous,

            questions: previous.questions.map(
                (question) =>
                    question.id === id
                        ? { ...question, ...changes }
                        : question
            ),
        }));
    }

    function navigate(next) {
        setView(next);
        setTopic("All questions");
        setTab("All questions");
        setQuery("");
        setDifficulty("All difficulty");
        setStatus("All statuses");
        setMobileNav(false);
    }

    function chooseTopic(next) {
        navigate("Questions");
        setTopic(next);
    }

    function openQuestion(question) {
        setSelectedId(question.id);
        setDetailTab("Notes");
    }

    function clearFilters() {
        setQuery("");
        setDifficulty("All difficulty");
        setStatus("All statuses");
        setTopic("All questions");
        setTab("All questions");
    }

    const filtered = useMemo(() => {
        let items = questions.filter((question) => {
            const matchesTopic =
                topic === "All questions" ||
                question.topic === topic;

            const matchesDifficulty =
                difficulty === "All difficulty" ||
                question.difficulty === difficulty;

            const matchesStatus =
                status === "All statuses" ||
                question.status === status;

            const matchesBookmarks =
                tab !== "Bookmarked" ||
                question.bookmarked;

            const matchesRevision =
                tab !== "To revise" ||
                question.status === "Revisit" ||
                (question.revision &&
                    question.revision <= today());

            const searchable =
                `${question.title} ${question.topic} ${question.notes}`.toLowerCase();

            const matchesSearch = searchable.includes(
                query.toLowerCase()
            );

            let matchesToday = true;

            if (view === "Today") {
                if (tab === "Completed") {
                    matchesToday = question.attempts.some(
                        (attempt) =>
                            attempt.date === today()
                    );
                } else {
                    matchesToday = question.revision
                        ? question.revision <= today()
                        : question.status === "Revisit";
                }
            }

            return (
                matchesTopic &&
                matchesDifficulty &&
                matchesStatus &&
                matchesBookmarks &&
                matchesRevision &&
                matchesSearch &&
                matchesToday
            );
        });

        if (sort === "Title A–Z") {
            items = [...items].sort(
                (first, second) =>
                    first.title.localeCompare(
                        second.title
                    )
            );
        }

        if (sort === "Difficulty") {
            const levels = [
                "Easy",
                "Medium",
                "Hard",
                "Unrated",
            ];

            items = [...items].sort(
                (first, second) =>
                    levels.indexOf(first.difficulty) -
                    levels.indexOf(second.difficulty)
            );
        }

        if (sort === "Recently practiced") {
            items = [...items].sort(
                (first, second) =>
                    (
                        lastAttempt(second)?.date || ""
                    ).localeCompare(
                        lastAttempt(first)?.date || ""
                    )
            );
        }

        return items;
    }, [
        questions,
        topic,
        difficulty,
        status,
        tab,
        query,
        view,
        sort,
    ]);

    const pages = Math.max(
        1,
        Math.ceil(filtered.length / PAGE_SIZE)
    );

    const currentPage = Math.min(page, pages);

    const visible = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    function saveEditor(values) {
        const question = modal.question;

        if (modal.type === "practice") {
            const {
                date,
                minutes,
                language,
                outcome,
                note,
                confidence,
                revision,
            } = values;

            const attempt = {
                id: crypto.randomUUID(),
                date,
                minutes,
                language: language.trim(),
                outcome,
                note,
            };

            patchQuestion(question.id, {
                attempts: [
                    attempt,
                    ...question.attempts,
                ],
                status: outcome,
                confidence,
                revision,
            });
        } else if (question) {
            patchQuestion(question.id, values);
        } else {
            if (questions.length >= LIBRARY_LIMIT) {
                setToast("Your library is full. Remove questions before adding more.");
                return;
            }
            const added = {
                id: crypto.randomUUID(),
                notes: "",
                solution: "",
                time: "",
                space: "",
                confidence: "Learning",
                bookmarked: false,
                attempts: [],
                ...values,
            };

            setData((previous) => ({
                ...previous,
                questions: [
                    added,
                    ...previous.questions,
                ],
            }));

            navigate("Questions");
            setPage(1);
            setSelectedId(added.id);
            setDetailTab("Notes");
        }

        setToast(
            modal.type === "practice"
                ? "Practice logged. Keep going!"
                : "Changes updated."
        );

        setModal(null);
    }

    function confirmChange() {
        if (modal.type === "delete") {
            setData((previous) => ({
                ...previous,

                questions:
                    previous.questions.filter(
                        (question) =>
                            question.id !==
                            modal.question.id
                    ),
            }));

            setSelectedId(null);
        }

        if (modal.type === "reset") {
            setData((previous) => ({
                ...previous,

                questions: previous.questions.map(
                    (question) => ({
                        ...question,
                        status: "Not started",
                        confidence: "Learning",
                        revision: "",
                        attempts: [],
                    })
                ),
            }));
        }

        if (modal.type === "import") {
            setData(modal.data);
            setSelectedId(null);
            clearFilters();
        }

        if (modal.type === "reload") {
            reloadWorkspace();
            setModal(null);
            return;
        }

        setModal(null);
        setToast("Workspace updated.");
    }

    async function importBackup(event) {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) {
            return;
        }

        try {
            if (file.size > 10 * 1024 * 1024) {
                throw new Error("File too large");
            }

            const imported = JSON.parse(
                await file.text()
            );

            if (!validateBackup(imported)) {
                throw new Error("Invalid backup");
            }

            setModal({
                type: "import",
                data: imported,
            });
        } catch {
            setToast(
                "Invalid backup. Use a DSA Space JSON export under 10 MB."
            );
        }
    }

    const modalTitle = modal
        ? {
            question: modal.question
                ? "Edit question"
                : "Add question",
            notes: "Edit notes & solution",
            practice: "Log practice",
            delete: "Remove from My Questions?",
            reset: "Reset practice progress?",
            import: "Import backup?",
            reload: "Load the cloud version?",
        }[modal.type]
        : "";

    let confirmationText = "";

    if (modal?.type === "delete") {
        confirmationText =
            `Remove “${modal.question.title}” from your personal questions, including its notes and practice history?${modal.question.catalog_id ? " The catalog question stays available and can be added again." : ""} Export a backup first if you want to keep that history.`;
    } else if (modal?.type === "reset") {
        confirmationText =
            "Clear all practice logs, statuses, confidence, and revision dates? Questions, notes, solutions, and bookmarks stay.";
    } else if (modal?.type === "import") {
        confirmationText =
            `Replace this workspace with ${modal.data.questions.length} questions from the backup? Export your current data first if needed.`;
    } else if (modal?.type === "reload") {
        confirmationText =
            "Discard your unsaved changes and load the latest cloud version? Export a backup first if you want to keep your changes.";
    }

    const listTabs =
        view === "Today"
            ? ["Due for review", "Completed"]
            : [
                "All questions",
                "To revise",
                "Bookmarked",
            ];

    return (
        <div
            className={`app ${
                selected && showLibrary
                    ? "with-details"
                    : ""
            }`}
        >
            {mobileNav && (
                <button
                    className="nav-scrim"
                    aria-label="Close navigation"
                    onClick={() =>
                        setMobileNav(false)
                    }
                />
            )}

            <aside
                className={`sidebar ${
                    mobileNav ? "mobile-open" : ""
                }`}
            >
                <a
                    className="logo"
                    href="#"
                    onClick={(event) => {
                        event.preventDefault();
                        navigate("Questions");
                    }}
                >
                    DSA <span>Space</span>
                </a>

                <nav
                    className="primary-nav"
                    aria-label="Main navigation"
                >
                    {[
                        [FileText, "Questions"],
                        [Books, "Catalog"],
                        [CalendarBlank, "Today"],
                        [ChartBar, "Progress"],
                    ].map(([Icon, name]) => (
                        <button
                            key={name}
                            className={`nav-item ${
                                view === name
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                navigate(name)
                            }
                        >
                            <Icon size={23} />
                            {name === "Questions" ? "My Questions" : name}
                        </button>
                    ))}
                </nav>

                <div className="topics-heading">
                    <span>YOUR TOPICS</span>
                    <span>
            {topics.filter((item) => item.total > 0).length} topics
          </span>
                </div>

                <nav
                    className="topic-nav"
                    aria-label="Question topics"
                >
                    <button
                        className={`topic-item ${
                            topic === "All questions" &&
                            view === "Questions"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            chooseTopic("All questions")
                        }
                    >
                        <FileText size={21} />

                        <span>
              <span className="topic-label">
                <span>All questions</span>
                <small>
                  {solved} /{" "}
                    {questions.length}
                </small>
              </span>

              <Bar
                  value={solved}
                  total={questions.length}
                  brand
              />
            </span>
                    </button>

                    {topics.filter((item) => item.total > 0).map(
                        ({
                             name,
                             Icon,
                             total,
                             solved: count,
                         }) => (
                            <button
                                key={name}
                                className={`topic-item ${
                                    topic === name &&
                                    view === "Questions"
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    chooseTopic(name)
                                }
                            >
                                <Icon size={21} />

                                <span>
                  <span className="topic-label">
                    <span>{name}</span>
                    <small>
                      {count} / {total}
                    </small>
                  </span>

                  <Bar
                      value={count}
                      total={total}
                  />
                </span>
                            </button>
                        )
                    )}
                </nav>

                <div className="sidebar-bottom">
                    {onSignOut && (
                        <button className="nav-item" onClick={handleSignOut} disabled={signingOut}>
                            <ArrowSquareOut size={23} />
                            {signingOut ? "Signing out…" : "Sign out"}
                        </button>
                    )}
                    <button
                        className={`nav-item ${
                            view === "Settings"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            navigate("Settings")
                        }
                    >
                        <GearSix size={23} />
                        Settings
                    </button>

                    <div className="save-indicator">
                        <Database size={21} />

                        <span
                            className={
                                saveError || saving || hasUnsavedChanges
                                    ? "save-dot warning"
                                    : "save-dot"
                            }
                        />

                        <span aria-live="polite">
              {saveError ? "Save failed" : saving || hasUnsavedChanges ? "Saving…" : "Cloud saved"}
            </span>
                    </div>
                </div>
            </aside>

            <main className="workspace">
                <div className="breadcrumbs">
                    <button
                        className="icon-button mobile-menu"
                        aria-label="Open navigation"
                        onClick={() =>
                            setMobileNav(true)
                        }
                    >
                        <List size={23} />
                    </button>

                    <span>{view}</span>
                    <CaretRight size={14} />

                    <span>
            {view === "Questions"
                ? topic === "All questions"
                    ? "Library"
                    : topic
                : "Overview"}
          </span>
                </div>

                <header className="page-heading">
                    <div>
                        <h1>
                            {view === "Questions"
                                ? topic === "All questions"
                                    ? "Your question library"
                                    : topic
                                : view === "Today"
                                    ? "Your practice today"
                                    : view === "Catalog"
                                        ? "Find your next question"
                                    : view === "Progress"
                                        ? "Your progress"
                                        : "Workspace settings"}
                        </h1>

                        <p>
                            {view === "Today"
                                ? `${doneToday} / ${data.dailyGoal} questions practiced today.`
                                : view === "Catalog"
                                    ? "Explore the catalog. Pick questions. Make them yours."
                                : view === "Settings"
                                    ? "Your preparation, your data."
                                    : "A little practice, every day."}
                        </p>
                    </div>

                    {showLibrary && (
                        <button
                            className="primary-button"
                            onClick={() =>
                                setModal({
                                    type: "question",
                                })
                            }
                        >
                            <Plus size={20} />
                            Add question
                        </button>
                    )}
                </header>

                {saveError && (
                    <div className="storage-warning" role="alert">
                        <p>{saveError}</p>
                        <div className="cloud-actions">
                            <button className="secondary-button" onClick={retrySave} disabled={saving}>Retry save</button>
                            <button className="secondary-button" onClick={() => downloadBackup(data)}>Export backup</button>
                            <button className="secondary-button" onClick={() => setModal({ type: "reload" })} disabled={saving}>Load cloud version</button>
                        </div>
                    </div>
                )}

                {view !== "Settings" && view !== "Catalog" && (
                    <section
                        className="metrics"
                        aria-label="Preparation statistics"
                    >
                        <div>
                            <strong className="green">
                                {solved}
                            </strong>
                            <span>Solved</span>
                        </div>

                        <div>
                            <strong className="amber">
                                {revisits}
                            </strong>
                            <span>To revisit</span>
                        </div>

                        <div>
                            <strong className="orange">
                                {streak(questions)}-day
                            </strong>
                            <span>Streak</span>
                        </div>

                        <div className="overall-progress">
                            <p>
                                <b>
                                    {solved} /{" "}
                                    {questions.length}
                                </b>
                                <span>questions</span>
                            </p>

                            <Bar
                                value={solved}
                                total={questions.length}
                                brand
                            />
                        </div>
                    </section>
                )}

                {view === "Catalog" && <Catalog questions={questions} addQuestions={(items) => {
                    setData((previous) => addCatalogQuestions(previous, items).data);
                }} openLibrary={() => navigate("Questions")} />}

                {showLibrary && (
                    <>
                        <div className="search-toolbar">
                            <label className="search-box">
                                <MagnifyingGlass
                                    size={21}
                                />

                                <input
                                    aria-label="Search questions"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search questions…"
                                />
                            </label>

                            <select
                                aria-label="Difficulty filter"
                                value={difficulty}
                                onChange={(event) =>
                                    setDifficulty(
                                        event.target.value
                                    )
                                }
                            >
                                {[
                                    "All difficulty",
                                    "Easy",
                                    "Medium",
                                    "Hard",
                                    "Unrated",
                                ].map((item) => (
                                    <option key={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>

                            <button
                                className={`icon-button filter-button ${
                                    filtersOpen
                                        ? "selected"
                                        : ""
                                }`}
                                aria-label="More filters"
                                aria-expanded={
                                    filtersOpen
                                }
                                onClick={() =>
                                    setFiltersOpen(
                                        !filtersOpen
                                    )
                                }
                            >
                                <FunnelSimple size={21} />
                            </button>
                        </div>

                        {filtersOpen && (
                            <div className="extra-filters">
                                <Field label="Status">
                                    <select
                                        value={status}
                                        onChange={(event) =>
                                            setStatus(
                                                event.target.value
                                            )
                                        }
                                    >
                                        {[
                                            "All statuses",
                                            ...STATUSES,
                                        ].map((item) => (
                                            <option key={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Sort by">
                                    <select
                                        value={sort}
                                        onChange={(event) =>
                                            setSort(
                                                event.target.value
                                            )
                                        }
                                    >
                                        {[
                                            "Library order",
                                            "Title A–Z",
                                            "Difficulty",
                                            "Recently practiced",
                                        ].map((item) => (
                                            <option key={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <button
                                    className="text-button"
                                    onClick={clearFilters}
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}

                        <div
                            className="tabs library-tabs"
                            role="tablist"
                            aria-label="Question list"
                        >
                            {listTabs.map((item) => {
                                const active =
                                    tab === item ||
                                    (view === "Today" &&
                                        item ===
                                        "Due for review" &&
                                        tab ===
                                        "All questions");

                                return (
                                    <button
                                        key={item}
                                        role="tab"
                                        aria-selected={active}
                                        className={
                                            active
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setTab(item)
                                        }
                                    >
                                        {item}
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            className="question-table"
                            role="table"
                            aria-label="Question library"
                        >
                            <div
                                className="table-head question-row"
                                role="row"
                            >
                                <Square size={19} />

                                <span role="columnheader">
                  Question
                </span>

                                <span role="columnheader">
                  Difficulty
                </span>

                                <span role="columnheader">
                  Status
                </span>

                                <span role="columnheader">
                  Last practiced
                </span>

                                <span />
                            </div>

                            {visible.map((question) => {
                                const attempt =
                                    lastAttempt(question);

                                return (
                                    <div
                                        role="row"
                                        className={`question-row ${
                                            selectedId ===
                                            question.id
                                                ? "selected-row"
                                                : ""
                                        }`}
                                        key={question.id}
                                        onClick={() =>
                                            openQuestion(
                                                question
                                            )
                                        }
                                    >
                                        <button
                                            className="icon-button row-select"
                                            aria-label={`Show details for ${question.title}`}
                                            aria-pressed={
                                                selectedId ===
                                                question.id
                                            }
                                            onClick={(
                                                event
                                            ) => {
                                                event.stopPropagation();

                                                setSelectedId(
                                                    selectedId ===
                                                    question.id
                                                        ? null
                                                        : question.id
                                                );
                                            }}
                                        >
                                            {selectedId ===
                                            question.id ? (
                                                <CheckSquare
                                                    size={21}
                                                    weight="fill"
                                                />
                                            ) : (
                                                <Square
                                                    size={21}
                                                />
                                            )}
                                        </button>

                                        <div
                                            role="cell"
                                            className="question-name"
                                        >
                                            <button
                                                onClick={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();
                                                    openQuestion(
                                                        question
                                                    );
                                                }}
                                            >
                                                {question.title}
                                            </button>

                                            <small>
                                                {question.topic}
                                            </small>
                                        </div>

                                        <span
                                            role="cell"
                                            className={`difficulty ${question.difficulty.toLowerCase()}`}
                                        >
                      {
                          question.difficulty
                      }
                    </span>

                                        <div role="cell">
                                            <Status
                                                value={
                                                    question.status
                                                }
                                            />
                                        </div>

                                        <div
                                            role="cell"
                                            className="last-practiced"
                                        >
                                            {formatDay(
                                                attempt?.date
                                            )}

                                            {attempt?.date ===
                                                today() && (
                                                    <small>
                                                        {new Date(
                                                            `${today()}T12:00:00`
                                                        ).toLocaleDateString(
                                                            undefined,
                                                            {
                                                                month:
                                                                    "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            }
                                                        )}
                                                    </small>
                                                )}
                                        </div>

                                        <CaretRight
                                            className="row-chevron"
                                            size={17}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {!visible.length && (
                            <div className="empty-state">
                                <MagnifyingGlass
                                    size={30}
                                />

                                <h2>
                                    {view === "Today"
                                        ? "Nothing here for today"
                                        : "No questions found"}
                                </h2>

                                <p>
                                    Try another filter or
                                    choose a question from
                                    your library.
                                </p>

                                <button
                                    className="secondary-button"
                                    onClick={
                                        view === "Today"
                                            ? () =>
                                                navigate(
                                                    "Questions"
                                                )
                                            : clearFilters
                                    }
                                >
                                    {view === "Today"
                                        ? "Open library"
                                        : "Clear filters"}
                                </button>
                            </div>
                        )}

                        <footer className="table-footer">
              <span>
                Showing{" "}
                  {visible.length
                      ? (currentPage - 1) *
                      PAGE_SIZE +
                      1
                      : 0}
                  –
                  {Math.min(
                      currentPage *
                      PAGE_SIZE,
                      filtered.length
                  )}{" "}
                  of {filtered.length}
              </span>

                            <div className="pagination">
                                <button
                                    className="icon-button"
                                    aria-label="Previous page"
                                    disabled={
                                        currentPage === 1
                                    }
                                    onClick={() =>
                                        setPage(
                                            currentPage - 1
                                        )
                                    }
                                >
                                    <CaretLeft
                                        size={16}
                                    />
                                </button>

                                {Array.from(
                                    {
                                        length: Math.min(
                                            5,
                                            pages
                                        ),
                                    },
                                    (_, index) =>
                                        Math.max(
                                            1,
                                            Math.min(
                                                currentPage - 2,
                                                pages - 4
                                            )
                                        ) + index
                                ).map((number) => (
                                    <button
                                        key={number}
                                        aria-label={`Page ${number}`}
                                        aria-current={
                                            number ===
                                            currentPage
                                                ? "page"
                                                : undefined
                                        }
                                        className={
                                            number ===
                                            currentPage
                                                ? "current"
                                                : ""
                                        }
                                        onClick={() =>
                                            setPage(number)
                                        }
                                    >
                                        {number}
                                    </button>
                                ))}

                                <button
                                    className="icon-button"
                                    aria-label="Next page"
                                    disabled={
                                        currentPage ===
                                        pages
                                    }
                                    onClick={() =>
                                        setPage(
                                            currentPage + 1
                                        )
                                    }
                                >
                                    <CaretRight
                                        size={16}
                                    />
                                </button>
                            </div>
                        </footer>
                    </>
                )}

                {view === "Progress" && (
                    <section className="progress-view">
                        <h2>Topic-wise breakdown</h2>

                        <p className="muted">
                            Solved counts follow each
                            question&apos;s current
                            status.
                        </p>

                        {topics.map((item) => (
                            <button
                                key={item.name}
                                className="progress-topic"
                                onClick={() =>
                                    chooseTopic(item.name)
                                }
                            >
                                <item.Icon size={23} />

                                <span>
                  {item.name}

                                    <Bar
                                        value={item.solved}
                                        total={item.total}
                                    />
                </span>

                                <b>
                                    {item.solved} /{" "}
                                    {item.total}
                                </b>

                                <CaretRight size={17} />
                            </button>
                        ))}

                        <div className="practice-summary">
                            <h2>Practice history</h2>

                            <p>
                                <strong>
                                    {questions.reduce(
                                        (sum, question) =>
                                            sum +
                                            question.attempts
                                                .length,
                                        0
                                    )}
                                </strong>{" "}
                                attempts ·{" "}
                                <strong>
                                    {questions.reduce(
                                        (sum, question) =>
                                            sum +
                                            question.attempts.reduce(
                                                (
                                                    minutes,
                                                    attempt
                                                ) =>
                                                    minutes +
                                                    attempt.minutes,
                                                0
                                            ),
                                        0
                                    )}
                                </strong>{" "}
                                minutes practiced
                            </p>
                        </div>
                    </section>
                )}

                {view === "Settings" && (
                    <section className="settings-view">
                        <div className="setting-row">
                            <div>
                                <h2>
                                    Daily practice goal
                                </h2>
                                <p>
                                    Count distinct questions
                                    practiced each day.
                                </p>
                            </div>

                            <select
                                aria-label="Daily practice goal"
                                value={data.dailyGoal}
                                onChange={(event) =>
                                    setData({
                                        ...data,
                                        dailyGoal: Number(
                                            event.target.value
                                        ),
                                    })
                                }
                            >
                                {Array.from(
                                    { length: 20 },
                                    (_, index) => (
                                        <option
                                            key={index}
                                            value={index + 1}
                                        >
                                            {index + 1} questions
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="setting-row">
                            <div>
                                <h2>Export a backup</h2>
                                <p>
                                    Questions, notes,
                                    solutions, and all
                                    practice logs.
                                </p>
                            </div>

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    downloadBackup(data)
                                }
                            >
                                <DownloadSimple
                                    size={20}
                                />
                                Export JSON
                            </button>
                        </div>

                        <div className="setting-row">
                            <div>
                                <h2>Import a backup</h2>
                                <p>
                                    Review the import before
                                    replacing this
                                    workspace.
                                </p>
                            </div>

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    fileRef.current.click()
                                }
                            >
                                <UploadSimple size={20} />
                                Import JSON
                            </button>
                        </div>

                        <div className="setting-row">
                            <div>
                                <h2>
                                    Reset practice progress
                                </h2>
                                <p>
                                    Keep questions and
                                    notes; clear attempts
                                    and revision dates.
                                </p>
                            </div>

                            <button
                                className="secondary-button danger"
                                onClick={() =>
                                    setModal({
                                        type: "reset",
                                    })
                                }
                            >
                                Reset progress
                            </button>
                        </div>

                        {browserBackup && (
                            <div className="setting-row">
                                <div>
                                    <h2>Import previous browser data</h2>
                                    <p>{browserBackup.questions.length} questions saved in this browser before cloud saving. Review before replacing your cloud workspace.</p>
                                </div>
                                <button className="secondary-button" onClick={() => setModal({ type: "import", data: browserBackup })}>
                                    Import browser data
                                </button>
                            </div>
                        )}

                        <p className="storage-note">
                            <Database size={20} />

                            <span>
                Questions, notes and practice history are saved to your Supabase account.
                Sign in on another device to load your workspace.
                JSON backups are available for export and import.
              </span>
                        </p>
                    </section>
                )}
            </main>

            {selected && showLibrary && (
                <aside
                    className="detail-panel"
                    aria-label="Question details"
                >
                    <div className="detail-heading">
                        <h2>{selected.title}</h2>

                        <div className="detail-heading-actions">
                            {safeUrl(
                                selected.url
                            ) && (
                                <a
                                    className="icon-button"
                                    href={safeUrl(
                                        selected.url
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Open question source"
                                >
                                    <ArrowSquareOut
                                        size={23}
                                    />
                                </a>
                            )}

                            <button
                                className={`icon-button ${
                                    selected.bookmarked
                                        ? "starred"
                                        : ""
                                }`}
                                aria-label={
                                    selected.bookmarked
                                        ? "Remove bookmark"
                                        : "Bookmark question"
                                }
                                onClick={() =>
                                    patchQuestion(
                                        selected.id,
                                        {
                                            bookmarked:
                                                !selected.bookmarked,
                                        }
                                    )
                                }
                            >
                                <Star
                                    size={23}
                                    weight={
                                        selected.bookmarked
                                            ? "fill"
                                            : "regular"
                                    }
                                />
                            </button>

                            <button
                                className="icon-button"
                                aria-label="Remove from My Questions"
                                title="Remove from My Questions"
                                onClick={() => setModal({ type: "delete", question: selected })}
                            >
                                <Trash size={21} />
                            </button>

                            <button
                                className="icon-button"
                                aria-label="Close question details"
                                onClick={() =>
                                    setSelectedId(null)
                                }
                            >
                                <X size={23} />
                            </button>
                        </div>
                    </div>

                    <p className="detail-meta">
            <span
                className={`difficulty ${selected.difficulty.toLowerCase()}`}
            >
              {selected.difficulty}
            </span>

                        <span>{selected.topic}</span>
                    </p>

                    <div
                        className="tabs detail-tabs"
                        role="tablist"
                        aria-label="Question detail tabs"
                    >
                        {[
                            ...(selected.catalog_id ? ["Question"] : []),
                            "Overview",
                            "Notes",
                            "Attempts",
                        ].map((item) => (
                            <button
                                role="tab"
                                aria-selected={
                                    detailTab === item
                                }
                                key={item}
                                className={
                                    detailTab === item
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setDetailTab(item)
                                }
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    <div className="detail-content">
                        {detailTab === "Question" && selected.catalog_id && (
                            <QuestionContent key={selected.id} id={selected.catalog_id}
                                version={selected.catalog_version}
                                updateVersion={(version) => patchQuestion(selected.id, { catalog_version: version })} />
                        )}
                        {detailTab === "Notes" && (
                            <>
                                <div className="section-title">
                                    <h3>My notes</h3>

                                    <button
                                        className="text-button"
                                        onClick={() =>
                                            setModal({
                                                type: "notes",
                                                question:
                                                selected,
                                            })
                                        }
                                    >
                                        <PencilSimple
                                            size={18}
                                        />
                                        Edit
                                    </button>
                                </div>

                                <div
                                    className={`note-box ${
                                        !selected.notes
                                            ? "muted"
                                            : ""
                                    }`}
                                >
                                    {selected.notes ||
                                        "Capture your approach, mistakes, and key insights here."}
                                </div>

                                <details className="solution">
                                    <summary>
                                        My solution / code
                                    </summary>

                                    {selected.solution ? (
                                        <pre>
                      <code>
                        {
                            selected.solution
                        }
                      </code>
                    </pre>
                                    ) : (
                                        <p className="muted">
                                            Add a solution using
                                            Edit.
                                        </p>
                                    )}
                                </details>

                                <div className="complexity">
                                    <div>
                    <span>
                      Time complexity
                    </span>
                                        <b>
                                            {selected.time ||
                                                "—"}
                                        </b>
                                    </div>

                                    <div>
                    <span>
                      Space complexity
                    </span>
                                        <b>
                                            {selected.space ||
                                                "—"}
                                        </b>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <ChartBar size={25} />

                                    <div>
                    <span>
                      Confidence
                    </span>

                                        <strong>
                                            {
                                                selected.confidence
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <CalendarBlank
                                        size={25}
                                    />

                                    <div>
                    <span>
                      Next revision
                    </span>

                                        <strong>
                                            {selected.revision
                                                ? new Date(
                                                    `${selected.revision}T12:00:00`
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        month:
                                                            "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    }
                                                )
                                                : "Not scheduled"}
                                        </strong>

                                        {selected.revision && (
                                            <small>
                                                {selected.revision <=
                                                today()
                                                    ? "Ready to review"
                                                    : "Scheduled for review"}
                                            </small>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <Clock size={25} />

                                    <div>
                    <span>
                      Recent practice
                    </span>

                                        <strong>
                                            {recent
                                                ? `${formatDay(recent.date)} · ${recent.language} · ${recent.minutes} min`
                                                : "No practice logged yet"}
                                        </strong>

                                        {recent && (
                                            <small
                                                className={
                                                    recent.outcome ===
                                                    "Solved"
                                                        ? "green"
                                                        : "amber"
                                                }
                                            >
                                                {recent.outcome}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {detailTab === "Overview" && (
                            <>
                                <div className="section-title">
                                    <h3>
                                        Question details
                                    </h3>

                                    <button
                                        className="text-button"
                                        onClick={() =>
                                            setModal({
                                                type: "question",
                                                question:
                                                selected,
                                            })
                                        }
                                    >
                                        <PencilSimple
                                            size={18}
                                        />
                                        Edit
                                    </button>
                                </div>

                                <dl className="overview-list">
                                    <dt>Status</dt>
                                    <dd>
                                        <Status
                                            value={
                                                selected.status
                                            }
                                        />
                                    </dd>

                                    <dt>Topic</dt>
                                    <dd>{selected.topic}</dd>

                                    <dt>Difficulty</dt>
                                    <dd>
                                        {
                                            selected.difficulty
                                        }
                                    </dd>

                                    <dt>Revision date</dt>
                                    <dd>
                                        {formatDay(
                                            selected.revision
                                        )}
                                    </dd>
                                </dl>

                                {safeUrl(
                                    selected.url
                                ) && (
                                    <a
                                        className="source-link"
                                        href={safeUrl(
                                            selected.url
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open original question
                                        <ArrowSquareOut
                                            size={18}
                                        />
                                    </a>
                                )}

                                <p className="muted overview-help">
                                    Read the problem at its
                                    source, then keep your
                                    own approach and
                                    solution in Notes.
                                </p>

                                <button
                                    className="text-button danger"
                                    onClick={() =>
                                        setModal({
                                            type: "delete",
                                            question: selected,
                                        })
                                    }
                                >
                                    <Trash size={18} />
                                    Remove from My Questions
                                </button>
                            </>
                        )}

                        {detailTab === "Attempts" && (
                            <>
                                <h3>
                                    Practice history{" "}
                                    <span className="muted">
                    (
                                        {
                                            selected.attempts
                                                .length
                                        }
                                        )
                  </span>
                                </h3>

                                {!selected.attempts
                                    .length && (
                                    <p className="muted">
                                        Log your first
                                        practice session to
                                        start tracking.
                                    </p>
                                )}

                                {[...selected.attempts]
                                    .sort(
                                        (first, second) =>
                                            second.date.localeCompare(
                                                first.date
                                            )
                                    )
                                    .map((attempt) => (
                                        <article
                                            className="attempt"
                                            key={attempt.id}
                                        >
                                            <div>
                                                <b>
                                                    {formatDay(
                                                        attempt.date
                                                    )}
                                                </b>

                                                <Status
                                                    value={
                                                        attempt.outcome
                                                    }
                                                />
                                            </div>

                                            <p>
                                                {
                                                    attempt.language
                                                }{" "}
                                                ·{" "}
                                                {attempt.minutes}{" "}
                                                min
                                            </p>

                                            {attempt.note && (
                                                <p className="attempt-note">
                                                    {attempt.note}
                                                </p>
                                            )}
                                        </article>
                                    ))}
                            </>
                        )}

                        <button
                            className="primary-button log-practice"
                            onClick={() =>
                                setModal({
                                    type: "practice",
                                    question: selected,
                                })
                            }
                        >
                            <Play
                                size={17}
                                weight="fill"
                            />
                            Log practice
                        </button>
                    </div>
                </aside>
            )}

            <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={importBackup}
            />

            {modal && (
                <Dialog
                    title={modalTitle}
                    close={() => setModal(null)}
                >
                    {[
                        "question",
                        "notes",
                        "practice",
                    ].includes(modal.type) ? (
                        <Editor
                            mode={modal.type}
                            question={modal.question}
                            topic={topic}
                            save={saveEditor}
                            close={() =>
                                setModal(null)
                            }
                        />
                    ) : (
                        <>
                            <p className="confirmation-text">
                                {confirmationText}
                            </p>

                            <div className="form-actions">
                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        setModal(null)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    className="primary-button"
                                    onClick={
                                        confirmChange
                                    }
                                >
                                    {modal.type === "delete"
                                        ? "Remove question"
                                        : `Confirm ${modal.type === "new" ? "replacement" : modal.type}`}
                                </button>
                            </div>
                        </>
                    )}
                </Dialog>
            )}

            {toast && (
                <div
                    className="toast"
                    role="status"
                >
                    <Check size={19} />
                    {toast}
                </div>
            )}
        </div>
    );
}
