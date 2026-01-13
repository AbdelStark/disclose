"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

function downloadBase64(bytesBase64: string, filename: string) {
  const binary = atob(bytesBase64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([array], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type TimestampReceiptPanelProps = {
  receipts: Array<{ filename: string; bytes_base64: string }>;
};

export default function TimestampReceiptPanel({ receipts }: TimestampReceiptPanelProps) {
  if (!receipts.length) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-extrabold">OpenTimestamps</h3>
        <p className="mt-2 text-sm text-muted">No receipt published for this disclosure.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-extrabold">Timestamp Receipts</h3>
      <p className="mt-2 text-sm text-muted">Download receipts to verify with the CLI.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {receipts.map((receipt) => (
          <Button
            key={receipt.filename}
            type="button"
            variant="secondary"
            onClick={() => downloadBase64(receipt.bytes_base64, receipt.filename)}
          >
            Download {receipt.filename}
          </Button>
        ))}
      </div>
    </Card>
  );
}
