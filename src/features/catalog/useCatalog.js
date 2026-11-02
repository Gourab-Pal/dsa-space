import { useEffect, useState } from "react";
import { readCatalogMeta, readCatalogPage } from "./catalogRepository.js";

const INITIAL_FILTERS = {
  query: "",
  topic: "",
  platform: "",
  difficulty: "",
  collection: "",
};

export function useCatalog() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({
    questions: [],
    total: 0,
    pageSize: 25,
  });
  const [meta, setMeta] = useState({ sources: [], collections: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [metaError, setMetaError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    readCatalogMeta(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setMeta(data);
          setMetaError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setMetaError(true);
      });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      readCatalogPage(filters, page, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setResult(data);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              "Could not load the catalog. Check your connection and retry. If this continues, contact the administrator.",
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters, page, retry]);

  function filter(key, value) {
    setLoading(true);
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return {
    ...result,
    meta,
    filters,
    page,
    loading,
    error,
    metaError,
    filter,
    setPage: (next) => {
      setLoading(true);
      setPage(next);
    },
    reset: () => {
      setLoading(true);
      setPage(1);
      setFilters({ ...INITIAL_FILTERS });
    },
    retry: () => setRetry((value) => value + 1),
  };
}
