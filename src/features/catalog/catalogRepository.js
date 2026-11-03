import { supabase } from "../../lib/supabase.js";

export async function readCatalogMeta(signal) {
  const { data, error } = await supabase
    .rpc("catalog_metadata")
    .abortSignal(signal);
  if (error) throw error;
  if (
    !data ||
    !Array.isArray(data.sources) ||
    !Array.isArray(data.collections)
  ) {
    throw new Error("Invalid catalog response");
  }
  return data;
}

export async function readCatalogPage(filters, page, signal) {
  const { data, error } = await supabase
    .rpc("browse_catalog", {
      p_query: filters.query.trim(),
      p_topic: filters.topic,
      p_platform: filters.platform,
      p_difficulty: filters.difficulty,
      p_collection: filters.collection,
      p_page: page,
    })
    .abortSignal(signal);
  if (error) throw error;
  if (
    !data ||
    !Array.isArray(data.questions) ||
    !Number.isSafeInteger(data.total)
  ) {
    throw new Error("Invalid catalog response");
  }
  return {
    ...data,
    questions: data.questions.map((question) => {
      const preferred = question.source_links?.find(
        (source) => source.platform === filters.platform,
      );
      return preferred
        ? { ...question, platform: preferred.platform, url: preferred.url,
            source_id: preferred.source_id, access: preferred.access }
        : question;
    }),
  };
}

export async function readCatalogQuestion(id, version, signal) {
  const { data, error } = await supabase.rpc("read_catalog_question", {
    p_id: id, p_version: version || null,
  }).abortSignal(signal);
  if (error) throw error;
  if (!data?.content || !Array.isArray(data.content.examples) || !Array.isArray(data.approaches)) {
    throw new Error("Invalid stored content response");
  }
  return data;
}
