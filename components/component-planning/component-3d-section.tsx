import dynamic from "next/dynamic";

export const Component3DSection = dynamic(() => import("./component-3d-preview").then((mod) => mod.Component3DPreview), {
  ssr: false,
  loading: () => (
    <section className="flex h-[340px] items-center justify-center rounded-md border border-border/80 bg-black/20">
      <div className="technical-label text-muted">Loading component 3D preview</div>
    </section>
  )
});
