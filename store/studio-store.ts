"use client";

import { create } from "zustand";

interface StudioState {
  selectedModuleId: string;
  hoveredModuleId: string | null;
  exploded: boolean;
  cutaway: boolean;
  machineColor: string;
  setSelectedModuleId: (id: string) => void;
  setHoveredModuleId: (id: string | null) => void;
  toggleExploded: () => void;
  toggleCutaway: () => void;
  setMachineColor: (color: string) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  selectedModuleId: "boba",
  hoveredModuleId: null,
  exploded: false,
  cutaway: false,
  machineColor: "#ea580c",
  setSelectedModuleId: (id) => set({ selectedModuleId: id }),
  setHoveredModuleId: (id) => set({ hoveredModuleId: id }),
  toggleExploded: () => set((state) => ({ exploded: !state.exploded })),
  toggleCutaway: () => set((state) => ({ cutaway: !state.cutaway })),
  setMachineColor: (color) => set({ machineColor: color })
}));
