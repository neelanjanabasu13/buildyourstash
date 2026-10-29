import { useEffect, useRef, useState } from "react";

export type BrandSlot = "logo" | "krowe-standing" | "krowe-sleeping" | "krowe-thinking" | "krowe-shipped";

/** Shows /brand/<slot>.png, or a neutral placeholder until that file is uploaded. */
export function BrandImage({ slot, alt, className = "", label }: { slot: BrandSlot; alt: string; className?: string; label?: string }) {
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // The image may have failed before hydration attached onError.
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);
  if (missing) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-foreground/25 bg-secondary text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground ${className}`}
      >
        {label ?? slot}
      </div>
    );
  }
  return <img ref={ref} src={`/brand/${slot}.png`} alt={alt} onError={() => setMissing(true)} className={`object-contain ${className}`} />;
}
