import { supabase } from "../../lib/supabase.js";
import { validateBackup } from "./questionModel.js";

export async function readWorkspace(userId) {
  const { data, error } = await supabase.rpc("read_question_workspace", {
    p_user_id: userId,
  });

  if (error) throw error;

  if (!data || !Number.isSafeInteger(data.revision) || !validateBackup(data.data)) {
    throw new Error(
      "The saved workspace could not be read. Your cloud data has not been replaced."
    );
  }

  return data;
}

export async function saveChanges(request) {
  const { data, error } = await supabase.rpc("save_question_changes", request);

  if (error) throw error;

  if (!Number.isSafeInteger(data)) {
    throw new Error("Could not confirm the cloud save.");
  }

  return data;
}

export function saveErrorMessage(error) {
  if (error?.code === "40001") {
    return "This workspace changed on another device. Export your unsaved changes, then reload the cloud version before editing again.";
  }

  return "Your changes have not been saved to Supabase. Check your connection and retry, or export a backup.";
}