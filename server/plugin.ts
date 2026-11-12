import type { Plugin } from 'vite';
import { receiptMiddleware, type ReceiptApiOptions } from './receiptApi.ts';
import { coachMiddleware, type CoachApiOptions } from './coachApi.ts';

export function receiptApiPlugin(opts: ReceiptApiOptions & CoachApiOptions): Plugin {
  const receiptMw = receiptMiddleware(opts);
  const coachMw = coachMiddleware(opts);
  return {
    name: 'mesh-api',
    configureServer(server) {
      server.middlewares.use(receiptMw);
      server.middlewares.use(coachMw);
    },
    configurePreviewServer(server) {
      server.middlewares.use(receiptMw);
      server.middlewares.use(coachMw);
    },
  };
}
