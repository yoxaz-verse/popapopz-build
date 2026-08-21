"use client";

import type { ReactNode } from "react";
import { SectionProgressCard } from "@/components/access/section-progress-card";
import { dashboardSections } from "@/lib/access/sections";
import { useAccessStore } from "@/store/access-store";
import type { DashboardSectionId } from "@/types/access";

export function SectionGate({ sectionId, children }: { sectionId: DashboardSectionId; children: ReactNode }) {
  const canView = useAccessStore((state) => state.canViewSection(sectionId));
  const section = dashboardSections.find((item) => item.id === sectionId);

  if (!canView || !section) return null;

  return (
    <div id={section.anchor} className="space-y-3 scroll-mt-20">
      <SectionProgressCard sectionId={sectionId} />
      {children}
    </div>
  );
}
