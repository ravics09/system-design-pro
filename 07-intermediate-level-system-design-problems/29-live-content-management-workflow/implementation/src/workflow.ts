export type Status = 'draft' | 'under_review' | 'scheduled' | 'published' | 'rejected' | 'archived';
export type Action =
  | 'submit'
  | 'approve_publish'
  | 'approve_schedule'
  | 'request_changes'
  | 'reject'
  | 'publish_due'
  | 'unschedule'
  | 'archive'
  | 'revise'
  | 'restore';

/** The single source of truth for legal transitions — anything not here is rejected. */
export const TRANSITIONS: Record<Status, Partial<Record<Action, Status>>> = {
  draft: { submit: 'under_review' },
  under_review: {
    approve_publish: 'published',
    approve_schedule: 'scheduled',
    request_changes: 'draft',
    reject: 'rejected',
  },
  scheduled: { publish_due: 'published', unschedule: 'draft' },
  published: { archive: 'archived' },
  rejected: { revise: 'draft' },
  archived: { restore: 'draft' },
};

/** Returns the next status for an action, or null if the transition is illegal. Pure. */
export function nextStatus(current: Status, action: Action): Status | null {
  return TRANSITIONS[current]?.[action] ?? null;
}
