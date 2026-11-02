import { useCallback, useEffect, useRef, useState } from "react";
import { readWorkspace, saveChanges, saveErrorMessage } from "./questionRepository.js";
import { validateBackup } from "./questionModel.js";
import { buildSaveRequest, sameWorkspace as same } from "./workspaceChanges.js";

function readBrowserBackup(userId) {
  try {
    const raw = localStorage.getItem(`dsa-space-v1:${userId}`);
    const data = raw ? JSON.parse(raw) : null;
    return validateBackup(data) ? data : null;
  } catch {
    return null;
  }
}

export function useQuestionWorkspace(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [browserBackup] = useState(() => readBrowserBackup(userId));

  const active = useRef(false);
  const confirmed = useRef(null);
  const latest = useRef(null);
  const pendingRequest = useRef(null);
  const inFlight = useRef(null);

  useEffect(() => {
    let cancelled = false;
    active.current = true;
    setLoading(true);
    setLoadError("");

    readWorkspace(userId).then((workspace) => {
      if (cancelled) return;
      confirmed.current = workspace;
      latest.current = workspace.data;
      pendingRequest.current = null;
      setData(workspace.data);
      setSaveError("");
    }).catch(() => {
      if (!cancelled) {
        setLoadError("Could not open your cloud workspace. Please retry or contact the administrator.");
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      active.current = false;
    };
  }, [userId, reloadCount]);

  const flush = useCallback(() => {
    if (inFlight.current) return inFlight.current;

    inFlight.current = (async () => {
      try {
        while (active.current && confirmed.current && latest.current &&
          (pendingRequest.current || !same(latest.current, confirmed.current.data))) {
          setSaving(true);
          const snapshot = latest.current;
          if (!validateBackup(snapshot)) throw new Error("Invalid question data");

          // Retry the same request first if its previous response was lost.
          const pending = pendingRequest.current || {
            snapshot,
            request: buildSaveRequest(userId, confirmed.current, snapshot, crypto.randomUUID()),
          };
          pendingRequest.current = pending;
          const revision = await saveChanges(pending.request);
          if (!active.current) return;

          confirmed.current = { revision, data: pending.snapshot };
          pendingRequest.current = null;
          setSaveError("");
          // Changes made during this request are handled by the next iteration.
        }
      } catch (error) {
        if (active.current) setSaveError(saveErrorMessage(error));
        throw error;
      } finally {
        if (active.current) setSaving(false);
      }
    })().finally(() => {
      inFlight.current = null;
    });

    return inFlight.current;
  }, [userId]);

  useEffect(() => {
    if (!data || loading || loadError) return;
    latest.current = data;
    if (same(data, confirmed.current?.data) && !pendingRequest.current) return;
    const timer = setTimeout(() => { flush().catch(() => {}); }, 450);
    return () => clearTimeout(timer);
  }, [data, loading, loadError, flush]);

  const hasUnsavedChanges = Boolean(data && confirmed.current &&
    (pendingRequest.current || !same(data, confirmed.current.data)));

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  function reloadWorkspace() {
    if (inFlight.current) return;
    setReloadCount((value) => value + 1);
  }

  return {
    data, setData, loading, loadError, saveError, saving, hasUnsavedChanges,
    browserBackup, flush, reloadWorkspace,
    retrySave: () => flush().catch(() => {}),
  };
}
