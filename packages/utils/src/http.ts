export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: string,
  ) {
    super(`${url} failed with ${status}: ${body}`);
    this.name = "HttpError";
  }
}

export interface FetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function build(options: FetchOptions): RequestInit {
  const hasBody = options.body !== undefined;
  return {
    method: options.method ?? (hasBody ? "POST" : "GET"),
    headers: hasBody
      ? { "content-type": "application/json", ...options.headers }
      : { ...options.headers },
    body: hasBody ? JSON.stringify(options.body) : null,
    signal: options.signal ?? null,
  };
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetch(url, build(options));
  if (!response.ok) throw new HttpError(response.status, url, await response.text());
  return (await response.json()) as T;
}

export async function fetchBytes(url: string, options: FetchOptions = {}): Promise<Uint8Array> {
  const response = await fetch(url, build(options));
  if (!response.ok) throw new HttpError(response.status, url, await response.text());
  return new Uint8Array(await response.arrayBuffer());
}
