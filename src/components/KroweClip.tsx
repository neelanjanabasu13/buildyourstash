import { useEffect, useRef, useState } from "react";
import munchMp4 from "@/assets/krowe1.mp4.asset.json";
import munchWebm from "@/assets/krowe1.webm.asset.json";
import munchPic from "@/assets/krowe1-poster.jpg.asset.json";
import shardMp4 from "@/assets/krowe2.mp4.asset.json";
import shardWebm from "@/assets/krowe2.webm.asset.json";
import shardPic from "@/assets/krowe2-poster.jpg.asset.json";
import bulbMp4 from "@/assets/krowe3.mp4.asset.json";
import bulbWebm from "@/assets/krowe3.webm.asset.json";
import bulbPic from "@/assets/krowe3-poster.jpg.asset.json";
import typingMp4 from "@/assets/krowe4.mp4.asset.json";
import typingWebm from "@/assets/krowe4.webm.asset.json";
import typingPic from "@/assets/krowe4-poster.jpg.asset.json";
import sleepMp4 from "@/assets/krowe5.mp4.asset.json";
import sleepWebm from "@/assets/krowe5.webm.asset.json";
import sleepPic from "@/assets/krowe5-poster.jpg.asset.json";
import riseMp4 from "@/assets/krowe6.mp4.asset.json";
import riseWebm from "@/assets/krowe6.webm.asset.json";
import risePic from "@/assets/krowe6-poster.jpg.asset.json";
import shippedMp4 from "@/assets/krowe7.mp4.asset.json";
import shippedWebm from "@/assets/krowe7.webm.asset.json";
import shippedPic from "@/assets/krowe7-poster.jpg.asset.json";

export type ClipSlot = "munch" | "shard" | "bulb" | "typing" | "sleep" | "rise" | "shipped";

/**
 * A short KROWE clip that either plays once and holds, or loops quietly.
 * Each clip ships in two formats: the browser takes the first one it can play.
 * The tile behind it is the same cream the clip was drawn on, so the picture
 * sits inside the card with no visible edge, and the first frame shows before
 * playback and whenever motion is switched off in the browser.
 */
const CLIPS: Record<ClipSlot, { mp4: string; webm: string; poster: string; alt: string; loop: boolean; cream: string }> = {
  munch: { mp4: munchMp4.url, webm: munchWebm.url, poster: munchPic.url, alt: "KROWE crunches a golden chip, then looks up", loop: false, cream: "#e5e3d7" },
  shard: { mp4: shardMp4.url, webm: shardWebm.url, poster: shardPic.url, alt: "KROWE digs a glowing shard out of the pile and holds it up", loop: false, cream: "#e0e0d4" },
  bulb: { mp4: bulbMp4.url, webm: bulbWebm.url, poster: bulbPic.url, alt: "KROWE holds a laptop while a lightbulb flares above it", loop: true, cream: "#dfdfd3" },
  typing: { mp4: typingMp4.url, webm: typingWebm.url, poster: typingPic.url, alt: "KROWE types on a laptop while perched on a branch", loop: true, cream: "#dedfd3" },
  sleep: { mp4: sleepMp4.url, webm: sleepWebm.url, poster: sleepPic.url, alt: "KROWE asleep beside a laptop, Zs floating up", loop: true, cream: "#e7e8d8" },
  rise: { mp4: riseMp4.url, webm: riseWebm.url, poster: risePic.url, alt: "KROWE gets up out of a collapsed pile and one neat card floats above", loop: false, cream: "#e6e7d8" },
  shipped: { mp4: shippedMp4.url, webm: shippedWebm.url, poster: shippedPic.url, alt: "KROWE holds a laptop whose screen reads SHIPPED", loop: false, cream: "#e3e1d4" },
};

export function KroweClip({ slot, className = "" }: { slot: ClipSlot; className?: string }) {
  const c = CLIPS[slot];
  const [asPicture, setAsPicture] = useState(false);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Browsers only let a clip start by itself while muted, and some drop the attribute.
  useEffect(() => {
    const v = ref.current;
    if (!v || asPicture || reduced) return;
    v.muted = true;
    v.play().catch(() => setAsPicture(true));
  }, [asPicture, reduced, slot]);

  const frame = `overflow-hidden rounded-xl border border-paper-line ${className}`;

  if (reduced || asPicture) {
    return (
      <div className={frame} style={{ backgroundColor: c.cream }}>
        <img src={c.poster} alt={c.alt} className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div className={frame} style={{ backgroundColor: c.cream }}>
      <video
        ref={ref}
        poster={c.poster}
        muted
        autoPlay
        playsInline
        loop={c.loop}
        aria-label={c.alt}
        onError={() => setAsPicture(true)}
        className="h-full w-full object-contain"
      >
        <source src={c.mp4} type="video/mp4" />
        <source src={c.webm} type="video/webm" />
      </video>
    </div>
  );
}
