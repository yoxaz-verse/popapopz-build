"use client";

import { create } from "zustand";

interface StudioState {
  selectedModuleId: string;
  hoveredModuleId: string | null;
  exploded: boolean;
  cutaway: boolean;
  machineColor: string;
  bodyColor: string;
  setSelectedModuleId: (id: string) => void;
  setHoveredModuleId: (id: string | null) => void;
  toggleExploded: () => void;
  toggleCutaway: () => void;
  setMachineColor: (color: string) => void;
  setBodyColor: (color: string) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  selectedModuleId: "boba",
  hoveredModuleId: null,
  exploded: false,
  cutaway: false,
  machineColor: "#ea580c",
  bodyColor: "#080b10",
  setSelectedModuleId: (id) => set({ selectedModuleId: id }),
  setHoveredModuleId: (id) => set({ hoveredModuleId: id }),
  toggleExploded: () => set((state) => ({ exploded: !state.exploded })),
  toggleCutaway: () => set((state) => ({ cutaway: !state.cutaway })),
  setMachineColor: (color) => set({ machineColor: color }),
  setBodyColor: (color) => set({ bodyColor: color })
}));
