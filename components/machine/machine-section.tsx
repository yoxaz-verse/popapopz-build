import dynamic from "next/dynamic";

export const MachineSection = dynamic(() => import("./machine-viewport").then((mod) => mod.MachineViewport), {
  ssr: false,
  loading: () => (
    <section className="panel flex h-[620px] items-center justify-center rounded-lg">
      <div className="technical-label text-muted">Loading 3D engineering viewport</div>
    </section>
  )
});
