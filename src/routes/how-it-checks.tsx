import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LIMITS } from "@/lib/models.config";
import { KroweClip } from "@/components/KroweClip";

export const Route = createFileRoute("/how-it-checks")({
  head: () => ({
    meta: [
      { title: "How STASH checks itself" },
      { name: "description", content: "What STASH verifies automatically, quotes and links, and what it cannot verify, the AI verdicts." },
      { property: "og:title", content: "How STASH checks itself" },
      { property: "og:description", content: "Quotes and links are machine-checked. Verdicts are AI opinions and can be wrong." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HowItChecks,
});

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="paper-card p-6 sm:p-8">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

function HowItChecks() {
  return (
    <div className="space-y-6 pt-6">
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">How STASH checks itself</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            KROWE is clever, but it is still an AI, so we built a few checks that run on our server before anything reaches your screen.
          </p>
        </div>
        <KroweClip slot="rise" className="hidden h-72 w-40 sm:block" />
      </div>

      <Block title="What is checked: your quotes are real">
        <p>
          Every claim STASH makes about you, such as why you stopped or what theme keeps coming back, must carry a quote from your own pile. Before
          showing it, our server takes the pile you sent, tidies both texts in the same way (ignoring capital letters, extra spaces and curly versus
          straight quote marks) and looks for the quote word for word. If it is not there, the claim is thrown away.
        </p>
        <p>That is what the line “quotes checked: N, invented quotes shown: 0” means, and it also tells you how many invented ones were caught.</p>
      </Block>

      <Block title="What is checked: the links are real">
        <p>
          Every piece of web evidence must point to a page that the live search actually returned during your sweep, and its quote must appear in
          the text of that search result. Evidence that fails either test is dropped. If nothing survives, the verdict says “nothing found”, and an
          idea cannot be marked REVIVE NOW without proof.
        </p>
      </Block>

      <Block title="What is NOT checked: the verdicts">
        <p>
          REVIVE NOW, NOT YET and STILL DEAD are opinions written by an AI model reading the evidence. They can be wrong, too hopeful, or miss news
          the search didn't find. The same goes for the revival kit, which is a starting draft rather than advice. Read the sources and decide for
          yourself.
        </p>
        <p>A real quote can also be read the wrong way, which is why each “why you stopped” has a quick “Not really” button.</p>
      </Block>

      <Block title="Fair use limits">
        <p>
          You don't need an account: each visitor gets a private guest session. Each session can run {LIMITS.sweepsPerDay} sweeps a day, with up to{" "}
          {LIMITS.maxPileChars.toLocaleString()} characters of notes and up to {LIMITS.maxIdeas} ideas per sweep. There is no canned data anywhere;
          even the example pile is read live.
        </p>
      </Block>
    </div>
  );
}
