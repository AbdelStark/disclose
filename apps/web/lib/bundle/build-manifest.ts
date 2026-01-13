import { gradeToApproxPercent } from "@/lib/assistance";
import { DisclosureManifest, ProofItemDraft, WizardDraft } from "@/lib/types";

function buildProofItems(items: ProofItemDraft[]): DisclosureManifest["proof"]["items"] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    kind: item.kind,
    path: item.path,
    mime: item.mime,
    size_bytes: item.sizeBytes,
    sha256: item.sha256 || "",
    created_before_ai: item.createdBeforeAi,
    notes: item.notes,
    git: item.git
  }));
}

export function buildManifest(draft: WizardDraft, bundleRoot?: string, receiptSha?: string): DisclosureManifest {
  if (!draft.template) {
    throw new Error("Template is required");
  }

  const stages = draft.template.stages.map((stage) => {
    const grade = draft.assistance.stageGrades[stage.key] || "none";
    return {
      key: stage.key,
      label: stage.label,
      grade,
      approx_ai_percent: gradeToApproxPercent(grade)
    };
  });

  const manifest: DisclosureManifest = {
    version: "1.0.0",
    id: draft.id,
    created_at: draft.createdAt,
    template: {
      slug: draft.template.slug,
      version: draft.template.version
    },
    project: {
      title: draft.project.title,
      author: draft.project.author || undefined,
      links: draft.project.links.length ? draft.project.links : undefined,
      audience: draft.project.audience || undefined
    },
    ai_tools: draft.aiTools.length ? draft.aiTools : undefined,
    assistance: {
      global: {
        human_percent: draft.assistance.global.human,
        ai_percent: draft.assistance.global.ai
      },
      stages: stages.length ? stages : undefined,
      notes: draft.assistance.notes || undefined
    },
    proof: {
      items: buildProofItems(draft.proofItems),
      bundle_root_sha256: bundleRoot || undefined
    },
    timestamps: draft.timestamps.enabled
      ? {
          opentimestamps: {
            enabled: true,
            status: draft.timestamps.status === "complete" ? "complete" : "pending",
            receipt_sha256: receiptSha,
            receipt_filename: draft.timestamps.receiptFilename
          }
        }
      : undefined
  };

  return manifest;
}
