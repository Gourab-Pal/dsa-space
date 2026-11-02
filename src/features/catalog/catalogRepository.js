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
  return data;
}
