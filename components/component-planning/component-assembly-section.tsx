import dynamic from "next/dynamic";

export const ComponentAssemblySection = dynamic(() => import("./component-assembly-viewport").then((mod) => mod.ComponentAssemblyViewport), {
  ssr: false,
  loading: () => (
    <section className="panel flex h-[620px] items-center justify-center rounded-lg">
      <div className="technical-label text-muted">Loading 3D component assembly</div>
    </section>
  )
});
