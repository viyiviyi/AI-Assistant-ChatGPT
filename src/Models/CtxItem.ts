import { CtxRole } from './CtxRole';
import { ToolCalls } from './Executor';

export type CtxItem = {
  role: CtxRole;
  content: string;
  name?: string;
  tool_calls?: ToolCalls[];
  tool_call_id?: string;
};
