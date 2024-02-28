import { withAuthGate } from './authGate';
import type { Handler } from './Handler';

export const handleHelixRequest: Handler = async (request: Request) => {
  return await withAuthGate(request);
}