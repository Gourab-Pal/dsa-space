export function today() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function shiftDay(day, amount) {
    const date = new Date(`${day}T12:00:00`);

    date.setDate(date.getDate() + amount);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const resultDay = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${resultDay}`;
}

export function formatDay(day) {
    if (!day) {
        return "—";
    }

    if (day === today()) {
        return "Today";
    }

    return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

