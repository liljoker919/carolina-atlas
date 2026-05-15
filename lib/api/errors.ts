/**
 * Centralized API error handling for Carolina Atlas.
 *
 * All API routes should use `apiErrorResponse()` to return errors so that
 * every response follows the same shape:
 *
 *   { "error": { "message": "...", "code": "...", "status": 400 } }
 *
 * Callers (e.g. ArcGIS, Census, school APIs) can throw `ApiError` to signal
 * a specific HTTP status and machine-readable code; the route handler then
 * passes it to `apiErrorResponse()`.
 */

import { NextResponse } from "next/server";

// ─── Error code constants ──────────────────────────────────────────────────

/** The request contained invalid or malformed parameters. */
export const ERROR_CODE_VALIDATION = "VALIDATION_ERROR";

/** An upstream API (ArcGIS, Census, etc.) returned an error. */
export const ERROR_CODE_UPSTREAM = "UPSTREAM_API_ERROR";

/** An unexpected server-side failure occurred. */
export const ERROR_CODE_INTERNAL = "INTERNAL_ERROR";

// ─── ApiError class ────────────────────────────────────────────────────────

/**
 * Structured error thrown by service functions to communicate a specific HTTP
 * status and machine-readable code to the route handler.
 *
 * @example
 *   throw new ApiError("Invalid date format.", ERROR_CODE_VALIDATION, 400);
 */
export class ApiError extends Error {
  /** Machine-readable error identifier (one of the ERROR_CODE_* constants). */
  readonly code: string;
  /** HTTP status code that should be sent to the client. */
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

// ─── Response shape ────────────────────────────────────────────────────────

/** The standard error envelope returned by every Carolina Atlas API route. */
export interface ApiErrorBody {
  error: {
    message: string;
    code: string;
    status: number;
  };
}

// ─── Helper ────────────────────────────────────────────────────────────────

/**
 * Builds a `NextResponse` with the standard error envelope.
 *
 * @param message - Human-readable description of the error.
 * @param code    - Machine-readable error code (use an ERROR_CODE_* constant).
 * @param status  - HTTP status code (e.g. 400, 500).
 *
 * @example
 *   return apiErrorResponse("Invalid date.", ERROR_CODE_VALIDATION, 400);
 */
export function apiErrorResponse(
  message: string,
  code: string,
  status: number
): NextResponse<ApiErrorBody> {
  return NextResponse.json<ApiErrorBody>(
    { error: { message, code, status } },
    { status }
  );
}

/**
 * Converts an unknown caught value into a `NextResponse` with the standard
 * error envelope.  If the value is an `ApiError` its code and status are
 * preserved; otherwise a generic 500 INTERNAL_ERROR is used.
 *
 * Use this in route `catch` blocks to avoid repetitive boilerplate.
 *
 * @example
 *   } catch (err) {
 *     return apiErrorFromUnknown(err, "Failed to fetch incidents");
 *   }
 */
export function apiErrorFromUnknown(
  err: unknown,
  fallbackMessage: string
): NextResponse<ApiErrorBody> {
  if (err instanceof ApiError) {
    return apiErrorResponse(err.message, err.code, err.status);
  }

  if (err instanceof Error) {
    return apiErrorResponse(err.message, ERROR_CODE_INTERNAL, 500);
  }

  return apiErrorResponse(fallbackMessage, ERROR_CODE_INTERNAL, 500);
}
