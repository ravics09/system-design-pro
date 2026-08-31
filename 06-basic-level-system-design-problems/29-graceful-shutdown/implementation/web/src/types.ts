export type Phase = 'running' | 'draining' | 'terminated';

export interface Status {
  phase: Phase;
  inFlight: number;
  acceptingNew: boolean;
  preStopMs: number;
  drainDeadlineMs: number;
}
