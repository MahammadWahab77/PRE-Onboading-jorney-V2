type PagesFunction<TEnv = unknown> = (context: {
  request: Request;
  env: TEnv;
  params: Record<string, string | string[]>;
  data: Record<string, unknown>;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
  functionPath: string;
}) => Response | Promise<Response>;
