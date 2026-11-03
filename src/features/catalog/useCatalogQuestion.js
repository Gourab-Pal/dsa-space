import { useEffect, useState } from "react";
import { readCatalogQuestion } from "./catalogRepository.js";

export function useCatalogQuestion(id, version) {
  const [state, setState] = useState({ loading: true, question: null, error: "" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, question: null, error: "" });
    readCatalogQuestion(id, version, controller.signal)
      .then((question) => {
        if (!controller.signal.aborted) setState({ loading: false, question, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ loading: false, question: null,
          error: error.code === "P0002"
            ? "Stored content is not available for this older question. Your notes and practice history are still safe."
            : "Could not load the saved question. Check your connection and retry." });
      });
    return () => controller.abort();
  }, [id, version, retry]);
  return { ...state, retry: () => setRetry((value) => value + 1) };
}
