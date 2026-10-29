import { useRef, useState, type DragEvent } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXAMPLE_PILE } from "@/lib/example-pile";
import { LIMITS } from "@/lib/models.config";

interface Props {
  disabled: boolean;
  sweepBlocked?: boolean;
  onSweep: (pile: string, isExample: boolean) => void;
}

interface LoadedFile {
  name: string;
  text: string;
}

const ACCEPT = [".txt", ".md", ".markdown", ".json"];

export function PileInput({ disabled, sweepBlocked = false, onSweep }: Props) {
  const [paste, setPaste] = useState("");
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [isExample, setIsExample] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pile = [paste.trim(), ...files.map((f) => `--- file: ${f.name} ---\n${f.text}`)].filter(Boolean).join("\n\n");
  const over = pile.length > LIMITS.maxPileChars;

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setWarning(null);
    const loaded: LoadedFile[] = [];
    for (const f of Array.from(list)) {
      if (!ACCEPT.some((ext) => f.name.toLowerCase().endsWith(ext))) {
        setWarning(`Skipped ${f.name}: only .txt, .md and .json for now.`);
        continue;
      }
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
    void addFiles(e.dataTransfer.files);
  }

  return (
    <div className="paper-card p-5 sm:p-7">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? "border-amber bg-paper-deep" : "border-paper-line hover:bg-paper-deep"
        }`}
      >
        <Upload className="h-6 w-6 text-amber-ink" />
        <p className="font-display text-lg">Drop your pile here</p>
        <p className="text-sm text-paper-muted">.txt, .md or .json notes. Read in your browser.</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT.join(",")}
          className="hidden"
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li key={f.name + i} className="flex items-center gap-1.5 rounded-full bg-paper-deep px-3 py-1 text-sm">
              <FileText className="h-3.5 w-3.5" /> {f.name}
              <button
                aria-label={`Remove ${f.name}`}
                onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                className="text-paper-muted hover:text-paper-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {warning && <p className="mt-2 text-sm text-amber-ink">{warning}</p>}

      <label className="mt-5 block">
        <span className="eyebrow text-paper-muted">Or paste notes</span>
        {isExample && (
          <span className="ml-2 rounded bg-amber px-2 py-0.5 text-xs font-semibold text-paper-foreground">EXAMPLE PILE loaded</span>
        )}
        <textarea
          value={paste}
          onChange={(e) => {
            setPaste(e.target.value);
            if (isExample && e.target.value !== EXAMPLE_PILE) setIsExample(false);
          }}
          placeholder="Old todo lists, half-written READMEs, journal bits, abandoned plans..."
          rows={7}
          className="mt-2 w-full resize-y rounded-lg border border-paper-line bg-paper p-3 font-mono text-sm text-paper-foreground placeholder:text-paper-muted focus:outline-none focus:ring-2 focus:ring-amber"
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className={over ? "font-semibold text-destructive" : "text-paper-muted"}>
          {pile.length.toLocaleString()} / {LIMITS.maxPileChars.toLocaleString()} characters
          {over && ": a bit too much, please trim it."}
        </span>
        <span className="text-paper-muted">Up to {LIMITS.maxIdeas} ideas per sweep, {LIMITS.sweepsPerDay} sweeps a day.</span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="amberOnPaper"
          size="lg"
          disabled={disabled || sweepBlocked || over || pile.trim().length < 20}
          onClick={() => onSweep(pile, isExample)}
          className="sm:flex-1"
        >
          Let KROWE sweep it
        </Button>
        <Button
          variant="paperOutline"
          size="lg"
          disabled={disabled}
          onClick={() => {
            setPaste(EXAMPLE_PILE);
            setFiles([]);
            setIsExample(true);
          }}
        >
          Try an example pile
        </Button>
      </div>
    </div>
  );
}
