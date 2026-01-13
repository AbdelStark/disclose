import type { ChangeEvent } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ProofItemDraft, Template } from "@/lib/types";

const formatBytes = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

type ProofLedgerProps = {
  template?: Template;
  items: ProofItemDraft[];
  onAddFiles: (files: File[]) => void;
  onEdit: (id: string, patch: Partial<ProofItemDraft>) => void;
  onRemove: (id: string) => void;
};

export default function ProofLedger({ template, items, onAddFiles, onEdit, onRemove }: ProofLedgerProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length) {
      onAddFiles(files);
    }
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold">Human Proof Ledger</h3>
              <p className="text-sm text-muted">Proof files stay local. Only hashes are published.</p>
            </div>
            <Badge tone="info">Local-only</Badge>
          </div>
          {template?.recommended_proof?.length ? (
            <div className="rounded-dc0 border-2 border-dashed border-border bg-paper/60 p-4 text-sm">
              <p className="font-semibold">Suggested proof for this template:</p>
              <ul className="mt-2 list-disc list-inside text-muted">
                {template.recommended_proof.map((proof) => (
                  <li key={proof}>{proof}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <input
              id="proof-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="proof-upload" className="dc-button dc-button-secondary cursor-pointer">
              Add proof files
            </label>
            <span className="text-xs text-muted">PDF, images, audio, video, zip, or markdown.</span>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <input
                    className="dc-input max-w-[240px]"
                    value={item.label}
                    onChange={(event) => onEdit(item.id, { label: event.target.value })}
                  />
                  <Badge tone={item.sha256 ? "success" : "warning"}>
                    {item.sha256 ? "Hashed" : "Hashing"}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-muted">
                  {item.path} {item.sizeBytes ? `- ${formatBytes(item.sizeBytes)}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs uppercase tracking-widest text-muted">Created before AI</label>
                <input
                  type="checkbox"
                  checked={item.createdBeforeAi}
                  onChange={(event) => onEdit(item.id, { createdBeforeAi: event.target.checked })}
                />
                <Button type="button" variant="ghost" onClick={() => onRemove(item.id)}>
                  Remove
                </Button>
              </div>
            </div>
            {item.sha256 ? (
              <div className="mt-3 rounded-dc0 border-2 border-border bg-paper/60 p-3 font-mono text-xs">
                {item.sha256}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
