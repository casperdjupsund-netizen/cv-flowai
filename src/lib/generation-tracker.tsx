import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { DocType } from "./usage";
import { DOC_TYPE_LABELS } from "./usage";

export type GenJobStatus = "running" | "done" | "error";

export interface GenJob {
  id: string;
  type: DocType;
  jobPosting: string;
  status: GenJobStatus;
  documentId?: string;
  error?: string;
  startedAt: number;
  finishedAt?: number;
}

type RunResult =
  | { ok: true; id: string }
  | { ok: false; error: string; upgrade?: boolean };

interface TrackerCtx {
  jobs: GenJob[];
  start: (type: DocType, jobPosting: string, run: () => Promise<RunResult>) => string;
  dismiss: (id: string) => void;
  /** Subscribe to "job done" events for refreshing lists/usage. */
  onJobDone: (cb: (job: GenJob) => void) => () => void;
}

const Ctx = createContext<TrackerCtx | null>(null);

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function GenerationTrackerProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<GenJob[]>([]);
  const navigate = useNavigate();
  const listenersRef = useRef<Set<(j: GenJob) => void>>(new Set());

  const onJobDone: TrackerCtx["onJobDone"] = useCallback((cb) => {
    listenersRef.current.add(cb);
    return () => {
      listenersRef.current.delete(cb);
    };
  }, []);

  const start: TrackerCtx["start"] = useCallback(
    (type, jobPosting, run) => {
      const id = newId();
      setJobs((prev) => [
        { id, type, jobPosting, status: "running", startedAt: Date.now() },
        ...prev,
      ]);

      void (async () => {
        let finalJob: GenJob | null = null;
        try {
          const res = await run();
          setJobs((prev) =>
            prev.map((j) => {
              if (j.id !== id) return j;
              const updated: GenJob = res.ok
                ? { ...j, status: "done", documentId: res.id, finishedAt: Date.now() }
                : { ...j, status: "error", error: res.error, finishedAt: Date.now() };
              finalJob = updated;
              return updated;
            }),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Generointi epäonnistui";
          setJobs((prev) =>
            prev.map((j) => {
              if (j.id !== id) return j;
              const updated: GenJob = { ...j, status: "error", error: message, finishedAt: Date.now() };
              finalJob = updated;
              return updated;
            }),
          );
        }

        if (finalJob) {
          const job = finalJob as GenJob;
          listenersRef.current.forEach((cb) => cb(job));
          if (job.status === "done" && job.documentId) {
            const docId = job.documentId;
            toast.success(`${DOC_TYPE_LABELS[job.type]} on valmis!`, {
              action: {
                label: "Avaa preview",
                onClick: () => {
                  setJobs((prev) => prev.filter((j) => j.id !== id));
                  navigate({ to: "/documents/$id", params: { id: docId } });
                },
              },
              duration: 10_000,
            });
          } else if (job.status === "error") {
            toast.error(`${DOC_TYPE_LABELS[job.type]}: ${job.error ?? "virhe"}`);
          }
        }
      })();

      return id;
    },
    [navigate],
  );

  const dismiss = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  return <Ctx.Provider value={{ jobs, start, dismiss, onJobDone }}>{children}</Ctx.Provider>;
}

export function useGenerationTracker() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGenerationTracker must be used within GenerationTrackerProvider");
  return ctx;
}

/** Run a callback whenever any generation job finishes (done or error). */
export function useOnGenerationDone(cb: (job: GenJob) => void) {
  const { onJobDone } = useGenerationTracker();
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  }, [cb]);
  useEffect(() => {
    return onJobDone((job) => cbRef.current(job));
  }, [onJobDone]);
}
