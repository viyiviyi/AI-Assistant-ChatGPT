import { CtxRole } from './CtxRole';
import { ToolCalls } from './Executor';

export type CtxItem = {
  role: CtxRole;
  content: string | { type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }[];
  name?: string;
  tool_calls?: ToolCalls[];
  tool_call_id?: string;
  tool_call_name?: string;
};
