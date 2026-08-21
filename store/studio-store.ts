"use client";

import { create } from "zustand";

export type ViewPreset = "front" | "left" | "right" | "top";

interface StudioState {
  selectedModuleId: string;
  hoveredModuleId: string | null;
  exploded: boolean;
  cutaway: boolean;
  isolated: boolean;
  guidesVisible: boolean;
  labelsVisible: boolean;
  viewPreset: ViewPreset;
  machineColor: string;
  bodyColor: string;
  setSelectedModuleId: (id: string) => void;
  setHoveredModuleId: (id: string | null) => void;
  toggleExploded: () => void;
  toggleCutaway: () => void;
  toggleIsolated: () => void;
  toggleGuides: () => void;
  toggleLabels: () => void;
  setViewPreset: (preset: ViewPreset) => void;
  setMachineColor: (color: string) => void;
  setBodyColor: (color: string) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  selectedModuleId: "boba",
  hoveredModuleId: null,
  exploded: false,
  cutaway: false,
  isolated: false,
  guidesVisible: true,
  labelsVisible: true,
  viewPreset: "front",
  machineColor: "#ea580c",
  bodyColor: "#475569",
  setSelectedModuleId: (id) => set({ selectedModuleId: id }),
  setHoveredModuleId: (id) => set({ hoveredModuleId: id }),
  toggleExploded: () => set((state) => ({ exploded: !state.exploded })),
  toggleCutaway: () => set((state) => ({ cutaway: !state.cutaway })),
  toggleIsolated: () => set((state) => ({ isolated: !state.isolated })),
  toggleGuides: () => set((state) => ({ guidesVisible: !state.guidesVisible })),
  toggleLabels: () => set((state) => ({ labelsVisible: !state.labelsVisible })),
  setViewPreset: (preset) => set({ viewPreset: preset }),
  setMachineColor: (color) => set({ machineColor: color }),
  setBodyColor: (color) => set({ bodyColor: color })
}));
