export type FileReadyPayload = {
  fileName: string;
  sourceFile?: import("@/lib/scraper").ProjectFile | null;
  pdfBase64?: string | null;
  storeName?: string | null;
  fileKey?: string | null;
  reused?: boolean;
};

export type ChatTab = {
  id: string;
  fileKey: string;
  title: string;
  messages: import("@/lib/types").ChatTurn[];
  sortOrder: number;
};
