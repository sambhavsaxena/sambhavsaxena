import { Platform } from 'react-native';

/**
 * Single error type for every remote call. Screens show a precise message and the
 * query client decides whether a retry makes sense from `isRetryable`.
 */

export type AppErrorKind =
  | 'network' // no connectivity, DNS failure, CORS block on web
  | 'timeout' // request exceeded the client timeout
  | 'http' // non-2xx HTTP status not covered below
  | 'unauthorized' // 401: session expired or missing
  | 'forbidden' // 403: signed in but not allowed (RLS, role)
  | 'not_found' // 404 or an unknown resource reported by the server
  | 'protocol' // malformed or unexpected payload
  | 'server' // the server ran but reported a domain failure
  | 'aborted'; // caller cancelled the request

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly service: string;
  readonly endpoint?: string;
  readonly status?: number;

  constructor(
    kind: AppErrorKind,
    message: string,
    options: { service: string; endpoint?: string; status?: number; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.kind = kind;
    this.service = options.service;
    this.endpoint = options.endpoint;
    this.status = options.status;
  }

  /** Transient failures worth retrying automatically. */
  get isRetryable(): boolean {
    if (this.kind === 'network' || this.kind === 'timeout') return true;
    if (this.kind === 'http') return this.status === undefined || this.status >= 500 || this.status === 429;
    return false;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Human-readable message for any thrown value. Rewrite the copy for the app's domain. */
export function describeError(error: unknown): string {
  if (isAppError(error)) {
    switch (error.kind) {
      case 'network':
        return Platform.OS === 'web'
          ? 'Could not reach the server. If this only happens in the browser, the server may be blocking it (CORS).'
          : 'Could not reach the server. Check your connection and try again.';
      case 'timeout':
        return 'The server took too long to respond.';
      case 'unauthorized':
        return 'Your session has expired. Please sign in again.';
      case 'forbidden':
        return "You don't have access to this.";
      case 'not_found':
        return error.message || 'Not found.';
      case 'http':
        return `The server returned an error (HTTP ${error.status ?? 'unknown'}).`;
      case 'server':
        return `The request could not be completed: ${error.message}`;
      case 'protocol':
        return 'The server sent an unexpected response.';
      case 'aborted':
        return 'Request cancelled.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}
