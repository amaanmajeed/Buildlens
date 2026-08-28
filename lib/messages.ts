export const MSG = {
  pdfOnly: "Please upload a PDF file.",
  tooLarge: "This file is too large. Please upload a PDF under 20MB.",
  extractFailed: "Could not extract data. Please try again.",
  aiUnavailable:
    "AI service temporarily unavailable. Please wait a moment and try again.",
  noQuantities:
    "No quantities could be extracted from this drawing. You can add items manually below.",
  missingOpenaiApiKey:
    "Add your OpenAI API key in Settings (or set OPENAI_API_KEY for local bootstrap), then try again.",
  modelEmptyResponse:
    "The model returned no text. The PDF may be empty, encrypted, image-only without readable text, or too large for a single request. Try a smaller PDF.",
  openaiAuth:
    "OpenAI rejected your API key. Update it in Settings, or check OPENAI_API_KEY if using bootstrap.",
  openaiRateLimit:
    "Too many requests to OpenAI. Wait a minute and try again, or check your quota.",
  openaiPayloadLimit:
    "This PDF is too large for the model in one request. Try a smaller file (under 20MB), fewer pages per upload, or split the document.",
  openaiBadRequestPrefix: "Request could not be processed:",
  openaiBadRequestGeneric:
    "The AI service could not accept this document or prompt. Try another PDF or try again.",
  openaiModel:
    "The configured model is not available for this API key. Pick another model in Settings.",
} as const;
