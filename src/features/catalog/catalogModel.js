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
    if (host === "hackerrank.com") {
      const slug = path.match(/\/challenges\/([^/]+)/)?.[1];
      if (slug) return `hackerrank:${slug}`;
    }
    if (host === "naukri.com" || host === "codingninjas.com") {
      const slug = path.match(
        /\/(?:code360|codestudio)\/problems\/([^/]+)/,
      )?.[1];
      if (slug) return `code360:${slug}`;
    }
    if (host === "hackerearth.com") {
      const slug = path.match(/\/(?:algorithm|approximate)\/([^/]+)/)?.[1];
      if (slug) return `hackerearth:${slug}`;
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
    index.ids.has(question.id) ||
    (question.variant_ids || []).some((id) => index.ids.has(id)) ||
    index.links.has(questionLinkKey(question.url)) ||
    (question.source_links || []).some((source) =>
      index.links.has(questionLinkKey(source.url)),
    )
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
      catalog_version: question.content_version || null,
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
    for (const id of question.variant_ids || []) index.ids.add(id);
    for (const source of question.source_links || [])
      index.links.add(questionLinkKey(source.url));
    index.links.add(questionLinkKey(question.url));
  }
  return {
    data: { ...data, questions: [...added, ...data.questions] },
    added: added.length,
  };
}
