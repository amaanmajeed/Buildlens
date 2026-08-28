"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { PortalProject, ProjectFile } from "@/lib/scraper";
import type { EstimateRow, SovRow } from "@/lib/types";
import type { AiModelId } from "@/lib/aiModels";
import { DEFAULT_AI_MODEL, parseAiModelId } from "@/lib/aiModels";

const STORAGE_PROJECT = "buildlens:portalProject";
const STORAGE_FILES = "buildlens:projectFiles";
const STORAGE_SOV = "buildlens:sovSchedule";
const STORAGE_SPEC_FILE_ID = "buildlens:specSourceFileId";
const STORAGE_AI_MODEL = "buildlens:aiModel";

export type PortalPdfCacheState = {
  fileId: string;
  base64: string;
  fileName: string;
} | null;

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `est-${Date.now()}-${Math.random()}`;
}

export type AppStateCtx = {
  selectedProject: PortalProject | null;
  setSelectedProject: React.Dispatch<
    React.SetStateAction<PortalProject | null>
  >;
  /** Sets project and clears files/SOV/spec file for a fresh flow */
  selectPortalProject: (p: PortalProject | null) => void;
  projectFiles: ProjectFile[];
  setProjectFiles: React.Dispatch<React.SetStateAction<ProjectFile[]>>;
  sovSchedule: SovRow[];
  setSovSchedule: React.Dispatch<React.SetStateAction<SovRow[]>>;
  specSourceFileId: string | null;
  setSpecSourceFileId: React.Dispatch<React.SetStateAction<string | null>>;
  estimateRows: EstimateRow[];
  setEstimateRows: React.Dispatch<React.SetStateAction<EstimateRow[]>>;
  appendFromPlan: (
    items: { item: string; quantity: number; unit: string }[]
  ) => void;
  sendToEstimateDraft: (
    planRows: { item: string; quantity: number; unit: string }[]
  ) => void;
  /** Last portal PDF bytes by file id — avoids re-downloading between Spec and Plan */
  portalPdfCache: PortalPdfCacheState;
  setPortalPdfCache: React.Dispatch<
    React.SetStateAction<PortalPdfCacheState>
  >;
  aiModel: AiModelId;
  setAiModel: React.Dispatch<React.SetStateAction<AiModelId>>;
};

const Ctx = createContext<AppStateCtx | null>(null);

function readStoredJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PortalProject | null>(
    null
  );
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [sovSchedule, setSovSchedule] = useState<SovRow[]>([]);
  const [specSourceFileId, setSpecSourceFileId] = useState<string | null>(null);
  const [portalPdfCache, setPortalPdfCache] =
    useState<PortalPdfCacheState>(null);
  const [estimateRows, setEstimateRows] = useState<EstimateRow[]>([]);
  const [aiModel, setAiModel] = useState<AiModelId>(DEFAULT_AI_MODEL);
  const [estimateHydrated, setEstimateHydrated] = useState(false);
  const estimateSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = readStoredJson<PortalProject>(STORAGE_PROJECT);
    const files = readStoredJson<ProjectFile[]>(STORAGE_FILES);
    const sov = readStoredJson<SovRow[]>(STORAGE_SOV);
    const specId = readStoredJson<string>(STORAGE_SPEC_FILE_ID);
    const storedModel = readStoredJson<string>(STORAGE_AI_MODEL);
    startTransition(() => {
      if (p) setSelectedProject(p);
      if (files?.length) setProjectFiles(files);
      if (sov?.length) setSovSchedule(sov);
      if (typeof specId === "string") setSpecSourceFileId(specId);
      setAiModel(parseAiModelId(storedModel));
      setHydrated(true);
    });
  }, []);

  // Load estimate draft from Supabase when project changes.
  useEffect(() => {
    if (!hydrated) return;
    const projectId = selectedProject?.id;
    let cancelled = false;

    (async () => {
      if (!projectId) {
        if (!cancelled) {
          startTransition(() => {
            setEstimateRows([]);
            setEstimateHydrated(true);
          });
        }
        return;
      }
      try {
        const res = await fetch(
          `/api/workspace/estimate?projectId=${projectId}`
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        startTransition(() => {
          if (res.ok && Array.isArray(data.estimateRows)) {
            setEstimateRows(data.estimateRows);
          } else {
            setEstimateRows([]);
          }
          setEstimateHydrated(true);
        });
      } catch {
        if (!cancelled) {
          startTransition(() => {
            setEstimateRows([]);
            setEstimateHydrated(true);
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProject?.id, hydrated]);

  // Debounced save of estimate rows (includes unit prices).
  useEffect(() => {
    if (!hydrated || !estimateHydrated || !selectedProject) return;
    if (estimateSaveTimer.current) clearTimeout(estimateSaveTimer.current);
    estimateSaveTimer.current = setTimeout(() => {
      void fetch("/api/workspace/estimate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          projectTitle: selectedProject.title,
          estimateRows,
        }),
      });
    }, 500);
    return () => {
      if (estimateSaveTimer.current) clearTimeout(estimateSaveTimer.current);
    };
  }, [estimateRows, selectedProject, hydrated, estimateHydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      if (selectedProject)
        sessionStorage.setItem(STORAGE_PROJECT, JSON.stringify(selectedProject));
      else sessionStorage.removeItem(STORAGE_PROJECT);
    } catch {
      /* ignore quota */
    }
  }, [selectedProject, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      if (projectFiles.length)
        sessionStorage.setItem(STORAGE_FILES, JSON.stringify(projectFiles));
      else sessionStorage.removeItem(STORAGE_FILES);
    } catch {
      /* ignore */
    }
  }, [projectFiles, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      if (sovSchedule.length)
        sessionStorage.setItem(STORAGE_SOV, JSON.stringify(sovSchedule));
      else sessionStorage.removeItem(STORAGE_SOV);
    } catch {
      /* ignore */
    }
  }, [sovSchedule, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      if (specSourceFileId)
        sessionStorage.setItem(
          STORAGE_SPEC_FILE_ID,
          JSON.stringify(specSourceFileId)
        );
      else sessionStorage.removeItem(STORAGE_SPEC_FILE_ID);
    } catch {
      /* ignore */
    }
  }, [specSourceFileId, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STORAGE_AI_MODEL, JSON.stringify(aiModel));
    } catch {
      /* ignore quota */
    }
  }, [aiModel, hydrated]);

  const selectPortalProject = useCallback((p: PortalProject | null) => {
    setSelectedProject(p);
    setProjectFiles([]);
    setSovSchedule([]);
    setSpecSourceFileId(null);
    setPortalPdfCache(null);
    // Estimate loads from Supabase for the new project id via effect.
  }, []);

  const appendFromPlan = useCallback(
    (items: { item: string; quantity: number; unit: string }[]) => {
      setEstimateRows((prev) => [
        ...prev,
        ...items.map((x) => ({
          id: newId(),
          item: x.item,
          quantity: x.quantity,
          unit: x.unit,
          unitPrice: 0,
        })),
      ]);
    },
    []
  );

  const sendToEstimateDraft = useCallback(
    (planRows: { item: string; quantity: number; unit: string }[]) => {
      const fromSov: EstimateRow[] = sovSchedule.map((r) => ({
        id: newId(),
        item: `[SOV] ${r.item}`,
        quantity: r.quantity,
        unit: r.unit,
        unitPrice: 0,
      }));
      const fromPlan: EstimateRow[] = planRows.map((r) => ({
        id: newId(),
        item: `[Plan] ${r.item}`,
        quantity: r.quantity,
        unit: r.unit,
        unitPrice: 0,
      }));
      setEstimateRows([...fromSov, ...fromPlan]);
      router.push("/estimate-draft");
    },
    [sovSchedule, router]
  );

  const value = useMemo(
    () => ({
      selectedProject,
      setSelectedProject,
      selectPortalProject,
      projectFiles,
      setProjectFiles,
      sovSchedule,
      setSovSchedule,
      specSourceFileId,
      setSpecSourceFileId,
      estimateRows,
      setEstimateRows,
      appendFromPlan,
      sendToEstimateDraft,
      portalPdfCache,
      setPortalPdfCache,
      aiModel,
      setAiModel,
    }),
    [
      selectedProject,
      selectPortalProject,
      projectFiles,
      sovSchedule,
      specSourceFileId,
      estimateRows,
      appendFromPlan,
      sendToEstimateDraft,
      portalPdfCache,
      aiModel,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return v;
}

/** @deprecated Use useAppState */
export function useWorkspaceState() {
  return useAppState();
}
