import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { buildBundleZip } from "@/lib/bundle/export";
import { DisclosureManifest, HashesJson, ProofItemDraft } from "@/lib/types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type ExportPanelProps = {
  manifest?: DisclosureManifest;
  hashes?: HashesJson;
  proofItems: ProofItemDraft[];
  receipt?: { filename: string; bytes: Uint8Array };
};

export default function ExportPanel({ manifest, hashes, proofItems, receipt }: ExportPanelProps) {
  const [includeProof, setIncludeProof] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (!manifest || !hashes) return;
    setBusy(true);
    try {
      const blob = await buildBundleZip({
        manifest,
        hashes,
        receipts: receipt ? [receipt] : [],
        proofItems,
        includeProofCopies: includeProof
      });
      downloadBlob(blob, "disclosure-bundle.zip");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold">Export Bundle</h3>
          <p className="text-sm text-muted">Zip includes manifest, hashes, and receipts.</p>
        </div>
        <div className="dc-badge bg-paper text-fg">Local-only</div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <input type="checkbox" checked={includeProof} onChange={(e) => setIncludeProof(e.target.checked)} />
        <span className="text-sm">Include proof file copies</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="primary" onClick={handleExport} disabled={!manifest || !hashes || busy}>
          {busy ? "Preparing..." : "Download bundle (.zip)"}
        </Button>
        {manifest ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadBlob(new Blob([JSON.stringify(manifest, null, 2)]), "disclosure.json")}
          >
            Download manifest
          </Button>
        ) : null}
        {hashes ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadBlob(new Blob([JSON.stringify(hashes, null, 2)]), "hashes.json")}
          >
            Download hashes
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
