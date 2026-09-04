import type { PrototypeJob } from '../types/game';

export const prototypeJob: PrototypeJob = {
  id: 'andersen-auto-service-exterior',
  customer: 'Andersen Auto Service',
  title: 'Udvendig vinduespudsning',
  paymentDkk: 450,
  windows: [
    { id: 'aas-front-1', x: 531, y: 405, width: 170, height: 58, completed: false },
    { id: 'aas-front-2', x: 789, y: 405, width: 170, height: 58, completed: false },
    { id: 'aas-front-3', x: 1047, y: 405, width: 170, height: 58, completed: false },
    { id: 'aas-lower-1', x: 531, y: 521, width: 170, height: 150, completed: false },
    { id: 'aas-lower-2', x: 789, y: 521, width: 170, height: 150, completed: false },
    { id: 'aas-lower-3', x: 1047, y: 521, width: 170, height: 150, completed: false },
  ],
};
