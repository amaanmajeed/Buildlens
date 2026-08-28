export const MSG = {
  pdfOnly: "Please upload a PDF file.",
  tooLarge: "This file is too large. Please upload a PDF under 20MB.",
  extractFailed: "Could not extract data. Please try again.",
  aiUnavailable:
    "AI service temporarily unavailable. Please wait a moment and try again.",
  noQuantities:
    "No quantities could be extracted from this drawing. You can add items manually below.",
  missingApiKey:
    "Server missing a Gemini API key. Set GEMINI_API_KEY in .env.local, then restart the dev server.",
  missingOpenaiApiKey:
    "Server missing an OpenAI API key. Set OPENAI_API_KEY in .env.local, then restart the dev server.",
  modelEmptyResponse:
    "The model returned no text. The PDF may be empty, encrypted, image-only without readable text, or too large for a single request. Try a smaller PDF.",
  geminiAuth:
    "Gemini rejected your API key. Confirm GEMINI_API_KEY in .env.local (Google AI Studio), save, and restart npm run dev.",
  geminiRateLimit:
    "Too many requests to Gemini. Wait a minute and try again, or check quota in Google AI Studio.",
  geminiBadInput: "Invalid input to the AI service. Try another PDF or refresh the page.",
  geminiBlockedPrefix: "The model could not return text:",
  geminiBlockedGeneric:
    "The model could not return text (safety block or policy). Try a different question or a smaller excerpt.",
  geminiPayloadLimit:
    "This PDF is too large for the model in one request. Try a smaller file (under 20MB), fewer pages per upload, or split the document.",
  geminiBadRequestPrefix: "Request could not be processed:",
  geminiBadRequestGeneric:
    "The AI service could not accept this document or prompt. Try another PDF or try again.",
  geminiModel:
    "The configured model is not available for this API key. Check model access in Google AI Studio.",
  geminiTimeout: "The AI request timed out. Try a smaller PDF or try again.",
} as const;
