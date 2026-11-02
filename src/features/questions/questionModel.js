import { TOPICS } from "../../config/topics.js";
import { today, shiftDay } from "../../lib/dates.js";

export function safeUrl(value) {
    try {
        const url = new URL(value);

        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }

        return "";
    } catch {
        return "";
    }
}

export function lastAttempt(question) {
    return [...question.attempts].sort((first, second) =>
        second.date.localeCompare(first.date)
    )[0];
}

export function streak(questions) {
    const dates = new Set(
        questions.flatMap((question) =>
            question.attempts.map((attempt) => attempt.date)
        )
    );

    let day = dates.has(today())
        ? today()
        : shiftDay(today(), -1);

    let count = 0;

    while (dates.has(day)) {
        count++;
        day = shiftDay(day, -1);
    }

    return count;
}

export function validateBackup(data) {
    const isText = (value) =>
        typeof value === "string" && value.length <= 100000;

    const isDate = (value) =>
        value === "" ||
        (typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(value) &&
            shiftDay(value, 0) === value);

    if (
        !data ||
        data.version !== 1 ||
        !Number.isInteger(data.dailyGoal) ||
        data.dailyGoal < 1 ||
        data.dailyGoal > 20 ||
        !Array.isArray(data.questions) ||
        data.questions.length > 2000
    ) {
        return false;
    }

    const ids = new Set();

    return data.questions.every((question) => {
        if (
            !question ||
            !isText(question.id) ||
            question.id.length === 0 ||
            ids.has(question.id)
        ) {
            return false;
        }

        ids.add(question.id);

        return (
            isText(question.title) &&
            question.title.trim().length > 0 &&
            TOPICS.includes(question.topic) &&
            ["Easy", "Medium", "Hard"].includes(question.difficulty) &&
            ["Not started", "Learning", "Solved", "Revisit"].includes(
                question.status
            ) &&
            ["Learning", "With a hint", "Comfortable"].includes(
                question.confidence
            ) &&
            typeof question.bookmarked === "boolean" &&
            ["notes", "solution", "time", "space", "url"].every((key) =>
                isText(question[key])
            ) &&
            (!question.url || Boolean(safeUrl(question.url))) &&
            isDate(question.revision) &&
            Array.isArray(question.attempts) &&
            question.attempts.length <= 10000 &&
            question.attempts.every(
                (attempt) =>
                    attempt &&
                    isText(attempt.id) &&
                    attempt.date &&
                    isDate(attempt.date) &&
                    Number.isFinite(attempt.minutes) &&
                    attempt.minutes > 0 &&
                    attempt.minutes <= 1440 &&
                    isText(attempt.language) &&
                    isText(attempt.note) &&
                    ["Solved", "Revisit", "Learning"].includes(
                        attempt.outcome
                    )
            )
        );
    });
}
