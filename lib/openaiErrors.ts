import OpenAI from "openai";
import { MSG } from "@/lib/messages";

export type ClassifiedOpenAiError = {
  httpStatus: number;
  userMessage: string;
  code: string;
};

export function classifyOpenAiError(err: unknown): ClassifiedOpenAiError {
  if (err instanceof Error && err.message === "missing_openai_api_key") {
    return {
      httpStatus: 400,
      code: "MISSING_USER_OPENAI_KEY",
      userMessage: MSG.missingOpenaiApiKey,
    };
  }

  if (err instanceof Error && err.message === "empty_response") {
    return {
      httpStatus: 422,
      code: "MODEL_EMPTY_RESPONSE",
      userMessage: MSG.modelEmptyResponse,
    };
  }

  if (err instanceof OpenAI.APIError) {
    const st = err.status ?? 0;
    const detail = `${err.message} ${err.code ?? ""}`.toLowerCase();

    if (st === 401 || st === 403) {
      return {
        httpStatus: 401,
        code: "OPENAI_AUTH",
        userMessage: MSG.openaiAuth,
      };
    }
    if (st === 429) {
      return {
        httpStatus: 429,
        code: "OPENAI_RATE_LIMIT",
        userMessage: MSG.openaiRateLimit,
      };
    }
    if (st === 404) {
      return {
        httpStatus: 502,
        code: "OPENAI_MODEL_NOT_FOUND",
        userMessage: MSG.openaiModel,
      };
    }
    if (
      st === 400 &&
      (detail.includes("too large") ||
        detail.includes("exceed") ||
        detail.includes("payload") ||
        detail.includes("size") ||
        detail.includes("context length"))
    ) {
      return {
        httpStatus: 413,
        code: "OPENAI_PAYLOAD_LIMIT",
        userMessage: MSG.openaiPayloadLimit,
      };
    }
    if (st === 400) {
      const short =
        err.message.length > 220
          ? `${err.message.slice(0, 217)}…`
          : err.message;
      return {
        httpStatus: 400,
        code: "OPENAI_BAD_REQUEST",
        userMessage: short
          ? `${MSG.openaiBadRequestPrefix} ${short}`
          : MSG.openaiBadRequestGeneric,
      };
    }
    if (st >= 500) {
      return {
        httpStatus: 503,
        code: "OPENAI_UPSTREAM",
        userMessage: MSG.aiUnavailable,
      };
    }
    return {
      httpStatus: 502,
      code: "OPENAI_API",
      userMessage: MSG.aiUnavailable,
    };
  }

  return {
    httpStatus: 503,
    code: "UNKNOWN",
    userMessage: MSG.aiUnavailable,
  };
}

export function openaiErrorResponse(
  err: unknown,
  routeLabel: string
): Response {
  const classified = classifyOpenAiError(err);
  console.error(`[${routeLabel}] OpenAI error`, classified.code, err);

  const body: Record<string, unknown> = {
    error: classified.userMessage,
    code: classified.code,
  };

  if (process.env.NODE_ENV === "development") {
    if (err instanceof OpenAI.APIError) {
      body.debug = {
        status: err.status,
        code: err.code,
        type: err.type,
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
