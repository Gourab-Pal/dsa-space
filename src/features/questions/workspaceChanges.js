import { validateBackup } from "./questionModel.js";

export const sameWorkspace = (first, second) => JSON.stringify(first) === JSON.stringify(second);

export function buildSaveRequest(userId, confirmed, snapshot, mutationId) {
  if (!validateBackup(snapshot)) throw new Error("Invalid question data");
  const previous = new Map(confirmed.data.questions.map((q) => [q.id, q]));
  const nextIds = new Set(snapshot.questions.map((q) => q.id));
  return {
    p_user_id: userId,
    p_expected_revision: confirmed.revision,
    p_mutation_id: mutationId,
    p_daily_goal: snapshot.dailyGoal,
    p_question_order: snapshot.questions.map((q) => q.id),
    p_changes: snapshot.questions.filter((q) => !sameWorkspace(q, previous.get(q.id))),
    p_deleted_ids: confirmed.data.questions.filter((q) => !nextIds.has(q.id)).map((q) => q.id),
  };
}
