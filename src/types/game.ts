export interface PrototypeJob {
  id: string;
  customer: string;
  title: string;
  windows: WindowData[];
  paymentDkk: number;
}

export type WindowCleanPhase = 'dirty' | 'soaped' | 'clean';

export interface WindowData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  completed: boolean;
  phase?: WindowCleanPhase;
  soapProgressMs?: number;
  squeegeeProgressMs?: number;
}

export interface JobResult {
  customer: string;
  paymentDkk: number;
  completedWindows: number;
}
