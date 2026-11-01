export const TOPICS = [
    "Arrays & hashing",
    "Two pointers",
    "Sliding window",
    "Stacks",
    "Binary search",
    "Linked lists",
    "Trees",
    "Graphs",
];

// E = Easy, M = Medium, H = Hard.
const LIBRARY = [
    [
        "Two Sum|E",
        "Contains Duplicate|E",
        "Valid Anagram|E",
        "Group Anagrams|M",
        "Top K Frequent Elements|M",
        "Product of Array Except Self|M",
        "Valid Sudoku|M",
        "Longest Consecutive Sequence|M",
        "Best Time to Buy and Sell Stock|E",
        "Merge Intervals|M",
        "Maximum Subarray|M",
        "Rotate Array|M",
        "Missing Number|E",
        "Subarray Sum Equals K|M",
        "First Missing Positive|H",
    ],

    [
        "Valid Palindrome|E",
        "Two Sum II - Input Array Is Sorted|M",
        "3Sum|M",
        "Container With Most Water|M",
        "Move Zeroes|E",
        "Trapping Rain Water|H",
        "Sort Colors|M",
        "Remove Duplicates from Sorted Array|E",
        "Squares of a Sorted Array|E",
        "4Sum|M",
        "Reverse String|E",
        "Backspace String Compare|E",
    ],

    [
        "Longest Substring Without Repeating Characters|M",
        "Longest Repeating Character Replacement|M",
        "Permutation in String|M",
        "Minimum Window Substring|H",
        "Sliding Window Maximum|H",
        "Minimum Size Subarray Sum|M",
        "Find All Anagrams in a String|M",
        "Fruit Into Baskets|M",
        "Max Consecutive Ones III|M",
        "Maximum Average Subarray I|E",
    ],

    [
        "Valid Parentheses|E",
        "Min Stack|M",
        "Evaluate Reverse Polish Notation|M",
        "Daily Temperatures|M",
        "Car Fleet|M",
        "Largest Rectangle in Histogram|H",
        "Next Greater Element I|E",
        "Decode String|M",
        "Asteroid Collision|M",
        "Remove K Digits|M",
    ],

    [
        "Binary Search|E",
        "Search a 2D Matrix|M",
        "Koko Eating Bananas|M",
        "Find Minimum in Rotated Sorted Array|M",
        "Search in Rotated Sorted Array|M",
        "Time Based Key-Value Store|M",
        "Median of Two Sorted Arrays|H",
        "Find Peak Element|M",
        "Search Insert Position|E",
        "Find First and Last Position of Element in Sorted Array|M",
    ],

    [
        "Merge Two Sorted Lists|E",
        "Reorder List|M",
        "Remove Nth Node From End of List|M",
        "Copy List with Random Pointer|M",
        "Add Two Numbers|M",
        "Linked List Cycle|E",
        "Reverse Linked List|E",
        "Find the Duplicate Number|M",
        "LRU Cache|M",
        "Merge k Sorted Lists|H",
        "Reverse Nodes in k-Group|H",
        "Intersection of Two Linked Lists|E",
        "Palindrome Linked List|E",
        "Sort List|M",
        "Swap Nodes in Pairs|M",
    ],

    [
        "Invert Binary Tree|E",
        "Maximum Depth of Binary Tree|E",
        "Diameter of Binary Tree|E",
        "Balanced Binary Tree|E",
        "Same Tree|E",
        "Subtree of Another Tree|E",
        "Lowest Common Ancestor of a Binary Search Tree|M",
        "Binary Tree Level Order Traversal|M",
        "Binary Tree Right Side View|M",
        "Count Good Nodes in Binary Tree|M",
        "Validate Binary Search Tree|M",
        "Kth Smallest Element in a BST|M",
        "Construct Binary Tree from Preorder and Inorder Traversal|M",
        "Binary Tree Maximum Path Sum|H",
        "Serialize and Deserialize Binary Tree|H",
        "Path Sum|E",
        "Path Sum II|M",
        "Symmetric Tree|E",
        "Binary Tree Inorder Traversal|E",
        "Binary Tree Zigzag Level Order Traversal|M",
        "Flatten Binary Tree to Linked List|M",
        "Sum Root to Leaf Numbers|M",
        "Lowest Common Ancestor of a Binary Tree|M",
    ],

    [
        "Clone Graph|M",
        "Max Area of Island|M",
        "Pacific Atlantic Water Flow|M",
        "Surrounded Regions|M",
        "Rotting Oranges|M",
        "Course Schedule|M",
        "Course Schedule II|M",
        "Redundant Connection|M",
        "Word Ladder|H",
        "Number of Islands|M",
        "Network Delay Time|M",
        "Reconstruct Itinerary|H",
        "Min Cost to Connect All Points|M",
        "Swim in Rising Water|H",
        "Cheapest Flights Within K Stops|M",
        "Is Graph Bipartite?|M",
        "Find if Path Exists in Graph|E",
        "Find the Town Judge|E",
        "Keys and Rooms|M",
        "Find Eventual Safe States|M",
        "Shortest Path in Binary Matrix|M",
        "Number of Provinces|M",
        "Evaluate Division|M",
        "Accounts Merge|M",
        "01 Matrix|M",
    ],
];

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

export function createSeed() {
    // Sample progress makes the first screen match the chosen design.
    // Settings → Reset progress clears the sample practice history.
    const solvedCounts = [8, 5, 3, 4, 4, 6, 10, 8];

    const questions = LIBRARY.flatMap((items, topicIndex) =>
        items.map((entry, index) => {
            const [title, level] = entry.split("|");

            let status = "Not started";

            if (index < solvedCounts[topicIndex]) {
                status = "Solved";
            } else if (index === solvedCounts[topicIndex]) {
                status = "Revisit";
            }

            const date = shiftDay(
                today(),
                -((index + topicIndex) % 12)
            );

            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9 -]/g, "")
                .replace(/\s+-\s+/g, "-")
                .replace(/\s+/g, "-");

            const difficulty = {
                E: "Easy",
                M: "Medium",
                H: "Hard",
            }[level];

            let revision = "";

            if (status === "Revisit") {
                revision = today();
            } else if (status === "Solved") {
                revision = shiftDay(today(), 3);
            }

            return {
                id: `seed-${topicIndex}-${index}`,
                title,
                topic: TOPICS[topicIndex],
                difficulty,
                status,
                url: `https://leetcode.com/problems/${slug}/`,
                bookmarked: index === 0,
                notes: "",
                solution: "",
                time: "",
                space: "",
                confidence:
                    status === "Solved" ? "Comfortable" : "Learning",
                revision,
                attempts:
                    status === "Not started"
                        ? []
                        : [
                            {
                                id: `${topicIndex}-${index}`,
                                date,
                                minutes: 12 + index,
                                language: "Java",
                                outcome: status,
                                note: "",
                            },
                        ],
            };
        })
    );

    const first = questions[0];

    first.notes =
        "Use a hash map to find the complement in one pass.";

    first.time = "O(n)";
    first.space = "O(n)";

    first.solution = [
        "Map<Integer, Integer> seen = new HashMap<>();",
        "",
        "for (int i = 0; i < nums.length; i++) {",
        "    int complement = target - nums[i];",
        "",
        "    if (seen.containsKey(complement)) {",
        "        return new int[] {seen.get(complement), i};",
        "    }",
        "",
        "    seen.put(nums[i], i);",
        "}",
    ].join("\n");

    first.attempts = Array.from({ length: 12 }, (_, index) => ({
        id: `streak-${index}`,
        date: shiftDay(today(), -index),
        minutes: 12 + index,
        language: "Java",
        outcome: "Solved",
        note: "",
    }));

    const priorityTitles = [
        "Two Sum",
        "Best Time to Buy and Sell Stock",
        "Valid Parentheses",
        "Binary Search",
        "Merge Intervals",
        "Reverse Linked List",
        "Number of Islands",
        "Longest Substring Without Repeating Characters",
    ];

    const priorityQuestions = priorityTitles.map((title) =>
        questions.find((question) => question.title === title)
    );

    const remainingQuestions = questions.filter(
        (question) => !priorityTitles.includes(question.title)
    );

    return {
        version: 1,
        dailyGoal: 3,
        questions: [...priorityQuestions, ...remainingQuestions],
    };
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