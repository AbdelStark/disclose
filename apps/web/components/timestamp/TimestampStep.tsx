import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export type TimestampStatus = "idle" | "stamping" | "pending" | "complete" | "error";

type TimestampStepProps = {
  enabled: boolean;
  status: TimestampStatus;
  rootHash?: string;
  onToggle: (next: boolean) => void;
  onStamp: () => Promise<void>;
  onUpgrade?: () => Promise<void>;
};

const statusLabel: Record<TimestampStatus, string> = {
  idle: "Not started",
  stamping: "Stamping",
  pending: "Receipt created (Pending)",
  complete: "Receipt upgraded (Complete)",
  error: "Error"
};

export default function TimestampStep({
  enabled,
  status,
  rootHash,
  onToggle,
  onStamp,
  onUpgrade
}: TimestampStepProps) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold">OpenTimestamps</h3>
            <p className="text-sm text-muted">
              Creates a detached receipt proving the bundle digest existed at or before a time.
            </p>
          </div>
          <Badge tone={enabled ? "success" : "warning"}>{enabled ? "Enabled" : "Optional"}</Badge>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          <span className="text-sm">Timestamp this disclosure bundle</span>
        </div>
        {rootHash ? (
          <div className="mt-4 rounded-dc0 border-2 border-border bg-paper/60 p-3 font-mono text-xs">
            Bundle root hash: {rootHash}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" disabled={!enabled || status === "stamping"} onClick={onStamp}>
            {status === "stamping" ? "Stamping..." : "Stamp now"}
          </Button>
          {onUpgrade ? (
            <Button type="button" variant="secondary" disabled={!enabled} onClick={onUpgrade}>
              Upgrade receipt
            </Button>
          ) : null}
          <span className="text-sm text-muted">Status: {statusLabel[status]}</span>
        </div>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-muted">
          OpenTimestamps proves existence of a digest at or before a time. It does not prove authorship.
        </p>
      </Card>
    </div>
  );
}
