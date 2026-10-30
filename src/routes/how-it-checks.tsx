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
    <section className="border-t border-foreground/20 py-6 sm:py-8">
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
            STASH is your idea museum. KROWE keeps the exhibits, checks whether your reason for stopping still holds, and makes a first draft you can pick up.
          </p>
        </div>
        <KroweClip slot="rise" className="hidden h-72 w-40 sm:block" />
      </div>

      <Block title="Stash it, mull it, pick it up">
        <p>One half-formed idea is enough. Type a thought, paste a link or import files, a public GitHub repo or a ChatGPT export. KROWE checks your own words for why you stopped, then searches the live web for what changed. A pattern across ideas is only a bonus after three exhibits.</p>
        <p>Each exhibit gets REVIVE NOW, NOT YET or STILL DEAD with receipts and sources. KROWE writes a pitch, three tiny steps and a finished landing-page headline and subhead. For an idea that isn't ready, the draft is a low-risk sketch, not a recommendation to launch. You can confirm the reason or correct it in one line.</p>
        <p>Your exhibits stay with this browser's guest session, so keep its site data if you want to return to the same museum. No voice-note recording is included yet. Non-GitHub links are references only; their pages are not imported.</p>
        <p>STASH is a hackathon project. Quotes and links are machine-checked; verdicts are AI opinions.</p>
      </Block>

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
        <p>KROWE's radar runs three targeted basic searches per exhibit check for recent blocker changes, competitors and open events. Due exhibits are checked while your museum is open and when you return after a day; there is no closed-browser monitoring or notification service. Check again starts a fresh round. Search-result dates can be missing, which is shown rather than invented. Open event deadlines and any prize must appear in the quoted source passage; unknown eligibility is not a promise of fit.</p>
        <p>Signals include a source-backed recommendation, confidence and what would change it. Exact quotes prove that the source said something, not that the recommendation is correct. Copyable pitches, page copy, first steps and outreach notes are generated draft artifacts, not deployed pages or sent messages.</p>
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
