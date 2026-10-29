import { useState } from "react";

export type BrandSlot = "logo" | "krowe-standing" | "krowe-sleeping" | "krowe-thinking" | "krowe-shipped";

/** Shows /brand/<slot>.png, or a neutral placeholder until that file is uploaded. */
export function BrandImage({ slot, alt, className = "", label }: { slot: BrandSlot; alt: string; className?: string; label?: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-foreground/25 bg-secondary font-mono text-xs uppercase tracking-widest text-muted-foreground ${className}`}
      >
        {label ?? slot}
      </div>
    );
  }
  return <img src={`/brand/${slot}.png`} alt={alt} onError={() => setMissing(true)} className={`object-contain ${className}`} />;
}
