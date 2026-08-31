import type { ZodType, ZodIssue } from 'zod';

/** A validation outcome: either the clean typed value, or structured errors. */
export type Validated<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: Record<string, string[]>; formErrors: string[] };

/**
 * Turn Zod issues into a field-keyed error map with **dot-paths** (`address.zip`) so a
 * UI can render each message next to its input; issues with an empty path (cross-field
 * refinements) become top-level `formErrors`.
 */
export function issuesToErrors(issues: ZodIssue[]): {
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
} {
  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];
  for (const issue of issues) {
    if (issue.path.length === 0) {
      formErrors.push(issue.message);
    } else {
      const key = issue.path.join('.');
      (fieldErrors[key] ??= []).push(issue.message);
    }
  }
  return { fieldErrors, formErrors };
}

/**
 * Parse (not merely check) input against a schema: coerces types, applies defaults, and
 * strips unknown keys (Zod objects strip by default). Returns the typed value or errors.
 */
export function validate<T>(schema: ZodType<T>, input: unknown): Validated<T> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, ...issuesToErrors(result.error.issues) };
}
