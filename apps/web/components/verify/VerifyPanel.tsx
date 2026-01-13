"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import { bundleRootHex } from "@/lib/hashing/merkle";
import { receiptInfo } from "@/lib/ots/ots-client";

export default function VerifyPanel() {
  const [hashesJson, setHashesJson] = useState<any>();
  const [computedRoot, setComputedRoot] = useState<string | null>(null);
  const [receiptDetails, setReceiptDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleHashesUpload = async (file: File) => {
    setError(null);
    setComputedRoot(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setHashesJson(parsed);
      if (parsed?.manifest_sha256 && parsed?.proof) {
        const proofHashes = parsed.proof.map((item: any) => item.sha256);
        const root = await bundleRootHex(parsed.manifest_sha256, proofHashes);
        setComputedRoot(root);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleReceiptUpload = async (file: File) => {
    setError(null);
    setReceiptDetails(null);
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const info = await receiptInfo(buffer);
      if ("error" in info) {
        setError(info.error);
      } else {
        setReceiptDetails(info.body);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-3xl font-black tracking-tight">Verify a bundle</h1>
        <p className="mt-2 text-sm text-muted">
          This checker validates bundle hashes client-side. Full OpenTimestamps verification is best done
          with the CLI.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Upload hashes.json</h3>
          <label htmlFor="hashes-upload" className="dc-button dc-button-secondary cursor-pointer">
            Choose file
          </label>
        </div>
        <input
          id="hashes-upload"
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleHashesUpload(file);
          }}
        />
        {hashesJson ? (
          <div className="mt-4 text-sm">
            <p>Manifest hash: {hashesJson.manifest_sha256}</p>
            <p>Declared root: {hashesJson.bundle_root_sha256}</p>
            {computedRoot ? <p>Computed root: {computedRoot}</p> : null}
            {computedRoot && hashesJson.bundle_root_sha256 ? (
              <p className={computedRoot === hashesJson.bundle_root_sha256 ? "text-success" : "text-danger"}>
                {computedRoot === hashesJson.bundle_root_sha256 ? "Root matches" : "Root mismatch"}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Upload .ots receipt</h3>
          <label htmlFor="receipt-upload" className="dc-button dc-button-secondary cursor-pointer">
            Choose receipt
          </label>
        </div>
        <input
          id="receipt-upload"
          type="file"
          accept=".ots,application/octet-stream"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleReceiptUpload(file);
          }}
        />
        {receiptDetails ? (
          <pre className="mt-4 rounded-dc0 border-2 border-border bg-paper/60 p-4 text-xs">
            {receiptDetails}
          </pre>
        ) : null}
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
