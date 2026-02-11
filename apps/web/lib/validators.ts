/**
 * Shared validation for server actions and routes.
 * Use for stability and consistent error messages.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function isValidProjectId(projectId: unknown): projectId is string {
  return isUuid(projectId);
}
