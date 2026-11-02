import { safeUrl } from "../questions/questionModel.js";

export const LIBRARY_LIMIT = 2000;
export const SELECTION_LIMIT = 100;

// Match links from manual questions and backups, including old GFG URLs.
export function questionLinkKey(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.replace(/\/+$/, "");
    if (host === "leetcode.com") {
      const slug = path.match(/^\/problems\/([^/]+)/)?.[1];
      if (slug) return `leetcode:${slug}`;
    }
    if (host === "geeksforgeeks.org" || host === "practice.geeksforgeeks.org") {
      const slug = path.match(/\/problems\/([^/]+)/)?.[1];
      if (slug) return `gfg:${slug}`;
    }
    return `${host}${path}`;
  } catch {
    return "";
  }
}

export function libraryIndex(questions) {
  return {
    ids: new Set(questions.map((q) => q.catalog_id).filter(Boolean)),
    links: new Set(
      questions.map((q) => questionLinkKey(q.url)).filter(Boolean),
    ),
  };
}

export function isInLibrary(question, index) {
  return (
    index.ids.has(question.id) || index.links.has(questionLinkKey(question.url))
  );
}

export function addCatalogQuestions(data, selected) {
  const index = libraryIndex(data.questions);
  const added = [];
  for (const question of selected) {
    if (isInLibrary(question, index)) continue;
    if (data.questions.length + added.length >= LIBRARY_LIMIT) break;
    if (!safeUrl(question.url)) continue;
    added.push({
      id: `catalog:${question.id}`,
      catalog_id: question.id,
      title: question.title,
      topic: question.topic,
      difficulty: question.difficulty,
      url: question.url,
      status: "Not started",
      notes: "",
      solution: "",
      time: "",
      space: "",
      revision: "",
      confidence: "Learning",
      bookmarked: false,
      attempts: [],
    });
    index.ids.add(question.id);
    index.links.add(questionLinkKey(question.url));
  }
  return {
    data: { ...data, questions: [...added, ...data.questions] },
    added: added.length,
  };
}
