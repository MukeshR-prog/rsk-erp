import { create } from "zustand";
import { persist } from "zustand/middleware";

type Workspace = "trading" | "manufacturing";

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  setWorkspace: (workspace: Workspace | null) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      setWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      clearWorkspace: () => set({ currentWorkspace: null }),
    }),
    {
      name: "rsk-workspace-store",
    }
  )
);
