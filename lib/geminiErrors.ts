import {
  GoogleGenerativeAIAbortError,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIRequestInputError,
  GoogleGenerativeAIResponseError,
} from "@google/generative-ai";
import { MSG } from "@/lib/messages";

export type ClassifiedGeminiError = {
  httpStatus: number;
  userMessage: string;
  code: string;
};

function tailAfterStatusBracket(message: string): string {
  const idx = message.lastIndexOf("] ");
  if (idx >= 0) return message.slice(idx + 2).trim();
  return message.replace(/^\[GoogleGenerativeAI Error\]:\s*/i, "").trim();
}

function combinedDetail(err: GoogleGenerativeAIFetchError): string {
  const base = tailAfterStatusBracket(err.message).toLowerCase();
  const details = err.errorDetails
    ? JSON.stringify(err.errorDetails).toLowerCase()
    : "";
  return `${base} ${details}`;
}

/**
 * Maps SDK / Google API failures to HTTP status + plain-English copy.
 * Log the raw `err` on the server; only return `userMessage` to the client.
 */
export function classifyGeminiError(err: unknown): ClassifiedGeminiError {
  if (err instanceof Error && err.message === "missing_api_key") {
    return {
      httpStatus: 500,
      code: "MISSING_API_KEY",
      userMessage: MSG.missingApiKey,
    };
  }

  if (err instanceof Error && err.message === "empty_response") {
    return {
      httpStatus: 422,
      code: "MODEL_EMPTY_RESPONSE",
      userMessage: MSG.modelEmptyResponse,
    };
  }

  if (err instanceof GoogleGenerativeAIRequestInputError) {
    return {
      httpStatus: 400,
      code: "GEMINI_BAD_INPUT",
      userMessage: MSG.geminiBadInput,
    };
  }

  if (err instanceof GoogleGenerativeAIResponseError) {
    const hint = tailAfterStatusBracket(err.message);
    return {
      httpStatus: 422,
      code: "GEMINI_RESPONSE_BLOCKED",
      userMessage: hint
        ? `${MSG.geminiBlockedPrefix} ${hint}`
        : MSG.geminiBlockedGeneric,
    };
  }

  if (err instanceof GoogleGenerativeAIFetchError) {
    const st = err.status ?? 0;
    const detail = combinedDetail(err);

    if (st === 401 || st === 403) {
      return {
        httpStatus: 401,
        code: "GEMINI_AUTH",
        userMessage: MSG.geminiAuth,
      };
    }

    if (
      st === 400 &&
      (detail.includes("api key") ||
        detail.includes("api_key") ||
        (detail.includes("invalid argument") && detail.includes("key")))
    ) {
      return {
        httpStatus: 401,
        code: "GEMINI_AUTH",
        userMessage: MSG.geminiAuth,
      };
    }

    if (st === 429) {
      return {
        httpStatus: 429,
        code: "GEMINI_RATE_LIMIT",
        userMessage: MSG.geminiRateLimit,
      };
    }

    if (st === 404) {
      return {
        httpStatus: 502,
        code: "GEMINI_MODEL_NOT_FOUND",
        userMessage: MSG.geminiModel,
      };
    }

    if (st === 400) {
      if (
        detail.includes("too large") ||
        detail.includes("exceed") ||
        detail.includes("payload") ||
        detail.includes("size")
      ) {
        return {
          httpStatus: 413,
          code: "GEMINI_PAYLOAD_LIMIT",
          userMessage: MSG.geminiPayloadLimit,
        };
      }
      const apiLine = tailAfterStatusBracket(err.message);
      const short =
        apiLine.length > 220 ? `${apiLine.slice(0, 217)}…` : apiLine;
      return {
        httpStatus: 400,
        code: "GEMINI_BAD_REQUEST",
        userMessage: short
          ? `${MSG.geminiBadRequestPrefix} ${short}`
          : MSG.geminiBadRequestGeneric,
      };
    }

    if (st >= 500) {
      return {
        httpStatus: 503,
        code: "GEMINI_UPSTREAM",
        userMessage: MSG.aiUnavailable,
      };
    }

    return {
      httpStatus: 502,
      code: "GEMINI_FETCH",
      userMessage: MSG.aiUnavailable,
    };
  }

  if (err instanceof GoogleGenerativeAIAbortError) {
    return {
      httpStatus: 504,
      code: "GEMINI_TIMEOUT",
      userMessage: MSG.geminiTimeout,
    };
  }

  return {
    httpStatus: 503,
    code: "UNKNOWN",
    userMessage: MSG.aiUnavailable,
  };
}

export function geminiErrorResponse(
  err: unknown,
  routeLabel: string
): Response {
  const classified = classifyGeminiError(err);
  console.error(`[${routeLabel}] Gemini error`, classified.code, err);

  const body: Record<string, unknown> = {
    error: classified.userMessage,
    code: classified.code,
  };

  if (process.env.NODE_ENV === "development") {
    if (err instanceof GoogleGenerativeAIFetchError) {
      body.debug = {
        status: err.status,
        statusText: err.statusText,
        errorDetails: err.errorDetails,
        message: err.message,
      };
    } else if (err instanceof Error) {
      body.debug = { name: err.name, message: err.message };
    } else {
      body.debug = { raw: String(err) };
    }
  }

  return Response.json(body, { status: classified.httpStatus });
}
