import Card from "@/components/ui/Card";
import Stamp from "@/components/ui/Stamp";
import { DisclosureManifest, HashesJson } from "@/lib/types";

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "");

type DisclosurePreviewProps = {
  manifest?: DisclosureManifest;
  hashes?: HashesJson;
};

export default function DisclosurePreview({ manifest, hashes }: DisclosurePreviewProps) {
  if (!manifest) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted">Complete earlier steps to preview the disclosure card.</p>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Disclosure</p>
          <h3 className="text-2xl font-black tracking-tight">{manifest.project.title}</h3>
          <p className="text-sm text-muted">{manifest.project.author || "Anonymous"}</p>
          <p className="text-xs text-muted">Created {formatDate(manifest.created_at)}</p>
        </div>
        <div className="flex gap-3">
          <Stamp>Self-Reported</Stamp>
          {manifest.timestamps?.opentimestamps?.enabled ? <Stamp tone="timestamp">Timestamped</Stamp> : null}
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Template</p>
          <p className="font-semibold">{manifest.template.slug}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Assistance</p>
          <p className="font-semibold">
            Human {manifest.assistance.global.human_percent}% - AI {manifest.assistance.global.ai_percent}%
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Proof items</p>
          <p className="font-semibold">{manifest.proof.items.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Bundle root</p>
          <p className="font-mono text-xs">{hashes?.bundle_root_sha256 || ""}</p>
        </div>
      </div>
      {manifest.assistance.stages?.length ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-muted">Per-stage grades</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {manifest.assistance.stages.map((stage) => (
              <div key={stage.key} className="rounded-dc0 border-2 border-border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>{stage.label}</span>
                  <span className="font-mono text-xs">AI ~{stage.approx_ai_percent}%</span>
                </div>
                <p className="text-xs text-muted">{stage.grade}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
