import type { PrototypeJob } from '../types/game';

export const prototypeJob: PrototypeJob = {
  id: 'andersen-auto-service-exterior',
  customer: 'Andersen Auto Service',
  title: 'Udvendig vinduespudsning',
  paymentDkk: 450,
  windows: [
    { id: 'aas-front-1', x: 534, y: 370, width: 176, height: 36, completed: false },
    { id: 'aas-front-2', x: 764, y: 370, width: 176, height: 36, completed: false },
    { id: 'aas-front-3', x: 992, y: 370, width: 176, height: 36, completed: false },
    { id: 'aas-lower-1', x: 534, y: 475, width: 176, height: 154, completed: false },
    { id: 'aas-lower-2', x: 764, y: 475, width: 176, height: 154, completed: false },
    { id: 'aas-lower-3', x: 992, y: 475, width: 176, height: 154, completed: false },
  ],
};
