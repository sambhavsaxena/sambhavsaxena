import { AppError } from './errors';

/**
 * Minimal typed JSON client for a REST backend. Every failure becomes an `AppError`.
 * Pass TanStack Query's `signal` through so unmounted screens cancel their requests.
 * If the app uses a vendor SDK (Supabase, Firebase), wrap that SDK's errors into
 * `AppError` in the same way instead of using this class.
 */

const DEFAULT_TIMEOUT_MS = 20_000;

export type RequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

type TokenProvider = () => Promise<string | null> | string | null;

export class ApiClient {
  constructor(
    readonly service: string,
    private readonly baseUrl: string,
    private readonly getToken?: TokenProvider,
  ) {}

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>('POST', path, body, options);
  }

  patch<T>(path: string, body: unknown, options?: RequestOptions) {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(method: string, path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    const endpoint = `${method} ${path}`;
    const { signal, cleanup, didTimeout } = linkSignals(options.signal, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const token = await this.getToken?.();
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
    } catch (cause) {
      if (didTimeout()) throw new AppError('timeout', 'Request timed out', { service: this.service, endpoint, cause });
      if (options.signal?.aborted) {
        throw new AppError('aborted', 'Request aborted', { service: this.service, endpoint, cause });
      }
      throw new AppError('network', 'Network request failed', { service: this.service, endpoint, cause });
    } finally {
      cleanup();
    }

    const text = await response.text();
    const payload = parseMaybeJson(text);

    if (!response.ok) {
      const message = extractMessage(payload) ?? `HTTP ${response.status}`;
      const meta = { service: this.service, endpoint, status: response.status };
      if (response.status === 401) throw new AppError('unauthorized', message, meta);
      if (response.status === 403) throw new AppError('forbidden', message, meta);
      if (response.status === 404) throw new AppError('not_found', message, meta);
      throw new AppError('http', message, meta);
    }

    if (response.status === 204 || text.length === 0) return undefined as T;
    if (typeof payload === 'string') {
      throw new AppError('protocol', 'Expected a JSON response', { service: this.service, endpoint });
    }
    return payload as T;
  }
}

function parseMaybeJson(text: string): unknown {
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const { error, message } = payload as { error?: unknown; message?: unknown };
    if (typeof message === 'string' && message) return message;
    if (typeof error === 'string' && error) return error;
  }
  return undefined;
}

/** Combines a caller's abort signal with a timeout (AbortSignal.any is not on every runtime). */
function linkSignals(external: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort();

  if (external?.aborted) controller.abort();
  external?.addEventListener('abort', onAbort);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener('abort', onAbort);
    },
  };
}
