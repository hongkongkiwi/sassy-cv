export {};

declare global {
  type PagesFunction<Env = any, Params extends string = any> = (context: {
    request: Request;
    env: Env & Record<string, string>;
    params: Record<Params, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: () => Promise<Response>;
    data: unknown;
  }) => Promise<Response> | Response;
}
