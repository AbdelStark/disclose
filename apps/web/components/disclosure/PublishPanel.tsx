import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { DisclosureManifest, HashesJson } from "@/lib/types";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

type PublishPanelProps = {
  manifest?: DisclosureManifest;
  hashes?: HashesJson;
  receipt?: { filename: string; bytes: Uint8Array };
};

export default function PublishPanel({ manifest, hashes, receipt }: PublishPanelProps) {
  const [publishReceipt, setPublishReceipt] = useState(true);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!manifest || !hashes) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        manifest,
        hashes,
        receipts:
          receipt && publishReceipt
            ? [{ filename: receipt.filename, bytes_base64: toBase64(receipt.bytes) }]
            : []
      };
      const res = await fetch("/api/disclosures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Publish failed");
      }
      const data = (await res.json()) as { url: string };
      setUrl(data.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold">Publish Disclosure</h3>
          <p className="text-sm text-muted">
            Publishes manifest + hashes only. Proof files never leave your device.
          </p>
        </div>
        <div className="dc-stamp bg-warning text-fg">Public</div>
      </div>
      {receipt ? (
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={publishReceipt}
            onChange={(event) => setPublishReceipt(event.target.checked)}
          />
          Include OpenTimestamps receipt in public record
        </label>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {url ? (
        <div className="mt-4 rounded-dc0 border-2 border-border bg-paper/60 p-4 text-sm">
          Published: <a className="underline" href={url}>{url}</a>
        </div>
      ) : null}
      <div className="mt-4">
        <Button type="button" variant="primary" onClick={handlePublish} disabled={!manifest || !hashes || busy}>
          {busy ? "Publishing..." : "Publish disclosure"}
        </Button>
      </div>
    </Card>
  );
}
