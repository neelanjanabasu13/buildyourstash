import { useRef, useState, type DragEvent } from "react";
import { ArrowRight, FileText, Github, Loader2, MessageSquare, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXAMPLE_PILE } from "@/lib/example-pile";
import { LIMITS } from "@/lib/models.config";
import { GitHubError, readRepo, repoToPile } from "@/lib/github";
import { conversationsToPile, parseConversations, readExportFile } from "@/lib/chatgpt-export";

interface Props {
  disabled: boolean;
  sweepBlocked?: boolean;
  onSweep: (pile: string, isExample: boolean) => void;
}

interface LoadedFile {
  name: string;
  text: string;
  kind?: "file" | "github" | "chatgpt";
}

const ACCEPT = [".txt", ".md", ".markdown", ".json", ".zip"];
const isExport = (name: string) => /conversations\.json$/i.test(name) || name.toLowerCase().endsWith(".zip");

export function PileInput({ disabled, sweepBlocked = false, onSweep }: Props) {
  const [paste, setPaste] = useState("");
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [isExample, setIsExample] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [mode, setMode] = useState<"files" | "github" | "chatgpt">("files");
  const [notesOpen, setNotesOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addRepo() {
    if (!repoUrl.trim()) return;
    setWarning(null);
    setLoadingRepo(true);
    try {
      const info = await readRepo(repoUrl);
      const label = `${info.fullName}${info.looksDropped ? " (quiet)" : ""}${info.builtWithLovable ? ", built with Lovable" : ""}`;
      setFiles((prev) => [...prev.filter((f) => f.name !== label), { name: label, text: repoToPile(info), kind: "github" }]);
      setRepoUrl("");
      setIsExample(false);
    } catch (e) {
      setWarning(e instanceof GitHubError ? e.message : "KROWE couldn't reach GitHub just now. Please try again.");
    } finally {
      setLoadingRepo(false);
    }
  }

  const pile = [paste.trim(), ...files.map((f) => `--- ${f.kind ?? "file"}: ${f.name} ---\n${f.text}`)].filter(Boolean).join("\n\n");
  const over = pile.length > LIMITS.maxPileChars;

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setWarning(null);
    const loaded: LoadedFile[] = [];
    for (const f of Array.from(list)) {
      if (!ACCEPT.some((ext) => f.name.toLowerCase().endsWith(ext))) {
        setWarning(`Skipped ${f.name}: only .txt, .md, .json or a ChatGPT export .zip.`);
        continue;
      }
      if (isExport(f.name)) {
        try {
          const convs = parseConversations(await readExportFile(f));
          const budget = Math.max(2000, LIMITS.maxPileChars - pile.length);
          const { text, used } = conversationsToPile(convs, budget);
          if (!text) setWarning(`No idea-like chats found in ${f.name}.`);
          else loaded.push({ name: `ChatGPT: ${used} of ${convs.length} chats`, text, kind: "chatgpt" });
        } catch (e) {
          setWarning(e instanceof Error ? e.message : `Couldn't read ${f.name}.`);
        }
        continue;
      }
      if (f.name.toLowerCase().endsWith(".zip")) continue;
      if (f.size > 500_000) {
        setWarning(`Skipped ${f.name}: that file is too big.`);
        continue;
      }
      loaded.push({ name: f.name, text: await f.text() });
    }
    setFiles((prev) => [...prev, ...loaded]);
    setIsExample(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) void addFiles(e.dataTransfer.files);
  }

  return (
    <div className="sweep-input">
      <div role="tablist" aria-label="Add to your pile" className="grid grid-cols-3 border-b border-foreground/20">
        {([
          { id: "files", icon: Upload, label: "Drop files" },
          { id: "github", icon: Github, label: "GitHub link" },
          { id: "chatgpt", icon: MessageSquare, label: "ChatGPT export" },
        ] as const).map(({ id, icon: Icon, label }, index) => (
          <Button key={id} id={`import-tab-${id}`} role="tab" aria-selected={mode === id} aria-controls={`import-panel-${id}`} tabIndex={mode === id ? 0 : -1} disabled={disabled} variant="ghost"
            onClick={() => setMode(id)}
            onKeyDown={(e) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
              e.preventDefault();
              const ids = ["files", "github", "chatgpt"] as const;
              const next = e.key === "Home" ? 0 : e.key === "End" ? 2 : (index + (e.key === "ArrowRight" ? 1 : 2)) % 3;
              const nextMode = ids[next];
              if (!nextMode) return;
              setMode(nextMode);
              document.getElementById(`import-tab-${nextMode}`)?.focus();
            }}
            className={`h-auto min-h-16 flex-col gap-1.5 whitespace-normal rounded-none px-2 py-3 text-xs sm:flex-row sm:gap-2 sm:text-sm ${mode === id ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground"}`}>
            <Icon />{label}
          </Button>
        ))}
      </div>
      <div className="p-4 sm:p-6">
      <input ref={inputRef} type="file" multiple accept={mode === "chatgpt" ? ".json,.zip" : ACCEPT.join(",")} disabled={disabled} className="hidden" aria-label="Upload pile files"
        onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
      <div
        role="tabpanel" id={`import-panel-${mode}`} aria-labelledby={`import-tab-${mode}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex min-h-64 flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-4 py-7 text-center transition-colors sm:min-h-72 ${dragging ? "border-primary bg-primary/5" : "border-foreground/25 bg-background/50"}`}
      >
        {mode === "github" ? <>
          <Github className="h-8 w-8 text-primary" />
          <p className="font-display text-2xl font-semibold text-primary">That repo you left behind.</p>
          <div className="mt-2 flex w-full max-w-lg flex-col gap-2 sm:flex-row">
            <input aria-label="Public GitHub repo URL" value={repoUrl} disabled={disabled || loadingRepo} onChange={(e) => setRepoUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !disabled && !loadingRepo && void addRepo()}
              placeholder="https://github.com/you/that-project" className="min-w-0 flex-1 rounded-md border border-paper-line bg-paper px-3 py-3 text-sm text-paper-foreground placeholder:text-paper-muted focus:outline-none focus:ring-2 focus:ring-primary" />
            <Button variant="paperOutline" className="h-11" disabled={disabled || loadingRepo || !repoUrl.trim()} onClick={() => void addRepo()}>{loadingRepo ? <Loader2 className="animate-spin" /> : <ArrowRight />} Add repo</Button>
          </div>
          <p className="text-xs text-paper-muted">Public repos only</p>
        </> : <>
          {mode === "files" ? <Upload className="h-8 w-8 text-primary" /> : <MessageSquare className="h-8 w-8 text-primary" />}
          <p className="font-display text-2xl font-semibold text-primary">{dragging ? "I've got room for that." : mode === "files" ? "Drop your unfinished business." : "Those chats had an idea in them."}</p>
          <p className="text-sm text-paper-muted">{mode === "files" ? ".txt, .md, .json" : "conversations.json or your export .zip"}</p>
          <Button variant="paperOutline" disabled={disabled} onClick={() => inputRef.current?.click()} className="mt-2"><Upload />{mode === "files" ? "Choose files" : "Choose ChatGPT export"}</Button>
        </>}
      </div>

      {files.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li key={f.name + i} className="flex items-center gap-1.5 rounded-full bg-paper-deep px-3 py-1 text-sm">
              {f.kind === "github" ? <Github className="h-3.5 w-3.5" /> : f.kind === "chatgpt" ? <MessageSquare className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />} {f.name}
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-paper-muted" disabled={disabled}
                aria-label={`Remove ${f.name}`}
                onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {warning && <p className="mt-2 text-sm font-medium text-destructive">{warning}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="link" disabled={disabled} className="px-0 text-sm" aria-expanded={notesOpen} aria-controls="paste-notes" onClick={() => setNotesOpen((v) => !v)}><FileText />{notesOpen ? "Close pasted notes" : "Or paste notes"}</Button>
        <Button variant="link" disabled={disabled} className="px-0 text-sm text-paper-muted" onClick={() => { setPaste(EXAMPLE_PILE); setFiles([]); setIsExample(true); setNotesOpen(true); }}>Try an example pile</Button>
      </div>
      <label id="paste-notes" className={`mt-3 block ${notesOpen ? "" : "hidden"}`}>
        <span className="text-sm font-semibold">Your notes</span>
        {isExample && (
          <span className="ml-2 rounded bg-amber px-2 py-0.5 text-xs font-semibold text-paper-foreground">EXAMPLE PILE loaded</span>
        )}
        <textarea
          value={paste}
          disabled={disabled}
          onChange={(e) => {
            setPaste(e.target.value);
            if (isExample && e.target.value !== EXAMPLE_PILE) setIsExample(false);
          }}
          placeholder="Old todo lists, half-written READMEs, journal bits, abandoned plans..."
          rows={5}
          className="mt-2 w-full resize-y rounded-lg border border-paper-line bg-paper p-3 font-mono text-sm text-paper-foreground placeholder:text-paper-muted focus:outline-none focus:ring-2 focus:ring-amber"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={over ? "font-semibold text-destructive" : "text-paper-muted"}>
          {pile.length.toLocaleString()} / {LIMITS.maxPileChars.toLocaleString()} characters
          {over && ": a bit too much, please trim it."}
        </span>
        <span className="text-paper-muted">Up to {LIMITS.maxIdeas} ideas per sweep, {LIMITS.sweepsPerDay} sweeps a day.</span>
      </div>

      <div className="mt-5">
        <Button
          variant="amberOnPaper"
          size="lg"
          disabled={disabled || loadingRepo || sweepBlocked || over || pile.trim().length < 20}
          onClick={() => onSweep(pile, isExample)}
          className="h-14 w-full text-base"
        >
          Let KROWE sweep it <ArrowRight />
        </Button>
      </div>
      </div>
    </div>
  );
}
