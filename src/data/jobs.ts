import type { PrototypeJob } from '../types/game';

export const prototypeJob: PrototypeJob = {
  id: 'andersen-auto-service-exterior',
  customer: 'Andersen Auto Service',
  title: 'Udvendig vinduespudsning',
  paymentDkk: 450,
  windows: [
    { id: 'aas-front-1', x: 450, y: 280, width: 118, height: 122, completed: false },
    { id: 'aas-front-2', x: 610, y: 280, width: 118, height: 122, completed: false },
    { id: 'aas-front-3', x: 770, y: 280, width: 118, height: 122, completed: false },
    { id: 'aas-lower-1', x: 456, y: 438, width: 126, height: 108, completed: false },
    { id: 'aas-lower-2', x: 636, y: 438, width: 126, height: 108, completed: false },
    { id: 'aas-lower-3', x: 816, y: 438, width: 126, height: 108, completed: false },
  ],
};
