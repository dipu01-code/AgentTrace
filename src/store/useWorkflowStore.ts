import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentEvent, WorkflowRun, StateDiff } from '../types';

type WorkflowStore = {
  // State
  runs: WorkflowRun[];
  events: AgentEvent[];
  currentRunId: string | null;
  selectedEventId: string | null;
  loading: boolean;
  error: string | null;
  loopsDetected: string[]; // event IDs flagged as loops
  deterministic: boolean; // last compared run determinism result

  // Actions
  setRuns: (runs: WorkflowRun[]) => void;
  addRun: (run: WorkflowRun) => void;
  updateRun: (runId: string, partial: Partial<WorkflowRun>) => void;
  setEvents: (events: AgentEvent[]) => void;
  addEvent: (event: AgentEvent) => void;
  setCurrentRun: (runId: string | null) => void;
  setSelectedEvent: (eventId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLoopsDetected: (eventIds: string[]) => void;
  setDeterministic: (value: boolean) => void;
  clearStore: () => void;

  // Selectors / derived
  getEventsForRun: (runId: string) => AgentEvent[];
  getCurrentRun: () => WorkflowRun | undefined;
  getLoopEvents: () => AgentEvent[];
};

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      runs: [],
      events: [],
      currentRunId: null,
      selectedEventId: null,
      loading: false,
      error: null,
      loopsDetected: [],
      deterministic: true,

      setRuns: (runs) => set({ runs }),
      addRun: (run) =>
        set((state) => ({ runs: [run, ...state.runs] })),
      updateRun: (runId, partial) =>
        set((state) => ({
          runs: state.runs.map((r) =>
            r.id === runId ? { ...r, ...partial } : r
          ),
        })),
      setEvents: (events) => set({ events }),
      addEvent: (event) =>
        set((state) => ({ events: [...state.events, event] })),
      setCurrentRun: (runId) => set({ currentRunId: runId }),
      setSelectedEvent: (eventId) => set({ selectedEventId: eventId }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setLoopsDetected: (eventIds) => set({ loopsDetected: eventIds }),
      setDeterministic: (value) => set({ deterministic: value }),
      clearStore: () =>
        set({
          runs: [],
          events: [],
          currentRunId: null,
          selectedEventId: null,
          loading: false,
          error: null,
          loopsDetected: [],
          deterministic: true,
        }),

      getEventsForRun: (runId) =>
        get().events.filter((e) => e.runId === runId),
      getCurrentRun: () =>
        get().runs.find((r) => r.id === get().currentRunId),
      getLoopEvents: () =>
        get().events.filter((e) => get().loopsDetected.includes(e.id)),
    }),
    {
      name: 'agenttrace-store',
      partialize: (state) => ({
        runs: state.runs,
        loopsDetected: state.loopsDetected,
        deterministic: state.deterministic,
      }),
    }
  )
);

export type { WorkflowRun, AgentEvent, StateDiff };
