export interface PrototypeJob {
  id: string;
  customer: string;
  title: string;
  windows: WindowData[];
  paymentDkk: number;
}

export interface WindowData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  completed: boolean;
}

export interface JobResult {
  customer: string;
  paymentDkk: number;
  completedWindows: number;
}
