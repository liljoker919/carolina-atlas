import { describe, expect, it } from "vitest";
import {
  ApiError,
  ERROR_CODE_INTERNAL,
  ERROR_CODE_UPSTREAM,
  ERROR_CODE_VALIDATION,
  apiErrorFromUnknown,
  apiErrorResponse,
} from "./errors";

describe("ApiError", () => {
  it("stores message, code, and status", () => {
    const err = new ApiError("bad input", ERROR_CODE_VALIDATION, 400);
    expect(err.message).toBe("bad input");
    expect(err.code).toBe(ERROR_CODE_VALIDATION);
    expect(err.status).toBe(400);
    expect(err.name).toBe("ApiError");
  });

  it("is an instance of Error", () => {
    const err = new ApiError("oops", ERROR_CODE_INTERNAL, 500);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("apiErrorResponse", () => {
  it("returns a response with the standard error envelope", async () => {
    const res = apiErrorResponse("Not found", ERROR_CODE_UPSTREAM, 404);
    expect(res.status).toBe(404);

    const body = await res.json() as { error: { message: string; code: string; status: number } };
    expect(body).toEqual({
      error: {
        message: "Not found",
        code: ERROR_CODE_UPSTREAM,
        status: 404,
      },
    });
  });

  it("sets the HTTP status to 400 for validation errors", async () => {
    const res = apiErrorResponse("Invalid date", ERROR_CODE_VALIDATION, 400);
    expect(res.status).toBe(400);

    const body = await res.json() as { error: { status: number } };
    expect(body.error.status).toBe(400);
  });
});

describe("apiErrorFromUnknown", () => {
  it("preserves code and status from an ApiError", async () => {
    const apiErr = new ApiError("upstream failed", ERROR_CODE_UPSTREAM, 502);
    const res = apiErrorFromUnknown(apiErr, "fallback");
    expect(res.status).toBe(502);

    const body = await res.json() as { error: { message: string; code: string; status: number } };
    expect(body.error).toEqual({
      message: "upstream failed",
      code: ERROR_CODE_UPSTREAM,
      status: 502,
    });
  });

  it("uses the Error message and INTERNAL_ERROR for a plain Error", async () => {
    const err = new Error("something broke");
    const res = apiErrorFromUnknown(err, "fallback message");
    expect(res.status).toBe(500);

    const body = await res.json() as { error: { message: string; code: string; status: number } };
    expect(body.error.message).toBe("something broke");
    expect(body.error.code).toBe(ERROR_CODE_INTERNAL);
    expect(body.error.status).toBe(500);
  });

  it("uses the fallback message for non-Error unknowns", async () => {
    const res = apiErrorFromUnknown("string error", "fallback message");
    expect(res.status).toBe(500);

    const body = await res.json() as { error: { message: string } };
    expect(body.error.message).toBe("fallback message");
  });
});
