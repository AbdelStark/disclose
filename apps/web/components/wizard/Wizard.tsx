"use client";

import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import Button from "@/components/ui/Button";
import StepIndicator from "@/components/ui/StepIndicator";
import TemplatePicker from "@/components/wizard/TemplatePicker";
import ProjectInfoForm from "@/components/wizard/ProjectInfoForm";
import ProofLedger from "@/components/proof/ProofLedger";
import AssistanceMeter from "@/components/meter/AssistanceMeter";
import AiToolsForm from "@/components/wizard/AiToolsForm";
import TimestampStep from "@/components/timestamp/TimestampStep";
import DisclosurePreview from "@/components/disclosure/DisclosurePreview";
import ExportPanel from "@/components/disclosure/ExportPanel";
import PublishPanel from "@/components/disclosure/PublishPanel";
import { buildManifest } from "@/lib/bundle/build-manifest";
import { buildHashes } from "@/lib/bundle/hashes";
import { hashFile } from "@/lib/hashing/hash-file";
import { sha256Hex } from "@/lib/hashing/sha256";
import { stampDigest, upgradeReceipt } from "@/lib/ots/ots-client";
import { DisclosureManifest, HashesJson, Template, WizardDraft } from "@/lib/types";

const STORAGE_KEY = "disclose_draft_v1";

const steps = [
  "Template",
  "Project",
  "Proof",
  "AI usage",
  "Timestamp",
  "Preview",
  "Publish"
];

const defaultDraft = (): WizardDraft => ({
  id: `dsc_${nanoid()}`,
  createdAt: new Date().toISOString(),
  project: {
    title: "",
    author: "",
    links: [],
    audience: "public"
  },
  aiTools: [],
  assistance: {
    global: { human: 70, ai: 30 },
    stageGrades: {},
    notes: ""
  },
  proofItems: [],
  timestamps: {
    enabled: false,
    status: "idle"
  }
});

function serializeDraft(draft: WizardDraft): string {
  const stripped = {
    ...draft,
    proofItems: draft.proofItems.map((item) => ({
      ...item,
      file: undefined
    })),
    timestamps: {
      ...draft.timestamps,
      receiptBytes: draft.timestamps.receiptBytes ? Array.from(draft.timestamps.receiptBytes) : undefined
    }
  };
  return JSON.stringify(stripped);
}

function hydrateDraft(raw: string): WizardDraft {
  const parsed = JSON.parse(raw) as WizardDraft & { timestamps?: { receiptBytes?: number[] } };
  return {
    ...parsed,
    timestamps: {
      ...parsed.timestamps,
      receiptBytes: parsed.timestamps?.receiptBytes ? new Uint8Array(parsed.timestamps.receiptBytes) : undefined
    }
  } as WizardDraft;
}

export default function Wizard({
  templates,
  initialTemplateSlug
}: {
  templates: Template[];
  initialTemplateSlug?: string;
}) {
  const [draft, setDraft] = useState<WizardDraft>(() => defaultDraft());
  const [step, setStep] = useState(0);
  const [manifest, setManifest] = useState<DisclosureManifest | undefined>();
  const [hashes, setHashes] = useState<HashesJson | undefined>();
  const [rootHash, setRootHash] = useState<string | undefined>();

  const selectedTemplate = draft.template;

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        setDraft(hydrateDraft(stored));
      } catch {
        setDraft(defaultDraft());
      }
    }
  }, []);

  useEffect(() => {
    if (draft.template || !initialTemplateSlug) return;
    const template = templates.find((t) => t.slug === initialTemplateSlug);
    if (!template) return;
    setDraft((prev) => {
      const stageGrades = { ...prev.assistance.stageGrades };
      template.stages.forEach((stage) => {
        if (!stageGrades[stage.key]) stageGrades[stage.key] = "none";
      });
      return { ...prev, template, assistance: { ...prev.assistance, stageGrades } };
    });
  }, [draft.template, initialTemplateSlug, templates]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, serializeDraft(draft));
    }
  }, [draft]);

  useEffect(() => {
    const compute = async () => {
      if (!draft.template) {
        setManifest(undefined);
        setHashes(undefined);
        setRootHash(undefined);
        return;
      }
      const missingHash = draft.proofItems.some((item) => !item.sha256);
      if (missingHash) {
        setManifest(undefined);
        setHashes(undefined);
        setRootHash(undefined);
        return;
      }
      const receiptSha = draft.timestamps.receiptBytes
        ? await sha256Hex(draft.timestamps.receiptBytes)
        : undefined;
      const baseManifest = buildManifest(draft, undefined, receiptSha);
      const { bundleRootSha256, hashes: nextHashes } = await buildHashes(baseManifest);
      const nextManifest = buildManifest(draft, bundleRootSha256, receiptSha);
      setManifest(nextManifest);
      setHashes(nextHashes);
      setRootHash(bundleRootSha256);
    };
    void compute();
  }, [draft]);

  const handleTemplateSelect = (slug: string) => {
    const template = templates.find((t) => t.slug === slug);
    if (!template) return;
    setDraft((prev) => {
      const stageGrades = { ...prev.assistance.stageGrades };
      template.stages.forEach((stage) => {
        if (!stageGrades[stage.key]) stageGrades[stage.key] = "none";
      });
      return { ...prev, template, assistance: { ...prev.assistance, stageGrades } };
    });
  };

  const handleAddFiles = async (files: File[]) => {
    const newItems = files.map((file) => ({
      id: nanoid(),
      label: file.name,
      kind: "file" as const,
      path: file.name,
      mime: file.type,
      sizeBytes: file.size,
      createdBeforeAi: true,
      file,
      addedAtIso: new Date().toISOString()
    }));

    setDraft((prev) => ({ ...prev, proofItems: [...prev.proofItems, ...newItems] }));

    for (const item of newItems) {
      try {
        const hash = await hashFile(item.file);
        setDraft((prev) => ({
          ...prev,
          proofItems: prev.proofItems.map((proof) =>
            proof.id === item.id ? { ...proof, sha256: hash } : proof
          )
        }));
      } catch {
        setDraft((prev) => ({
          ...prev,
          proofItems: prev.proofItems.map((proof) =>
            proof.id === item.id ? { ...proof, sha256: undefined } : proof
          )
        }));
      }
    }
  };

  const handleEditProof = (id: string, patch: Partial<WizardDraft["proofItems"][number]>) => {
    setDraft((prev) => ({
      ...prev,
      proofItems: prev.proofItems.map((item) => (item.id === id ? { ...item, ...patch } : item))
    }));
  };

  const handleRemoveProof = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      proofItems: prev.proofItems.filter((item) => item.id !== id)
    }));
  };

  const handleStamp = async () => {
    if (!rootHash || !draft.timestamps.enabled) return;
    setDraft((prev) => ({ ...prev, timestamps: { ...prev.timestamps, status: "stamping" } }));
    const result = await stampDigest(rootHash);
    if ("error" in result) {
      setDraft((prev) => ({ ...prev, timestamps: { ...prev.timestamps, status: "error" } }));
      return;
    }
    setDraft((prev) => ({
      ...prev,
      timestamps: {
        ...prev.timestamps,
        status: "pending",
        receiptBytes: result.receipt,
        receiptFilename: "bundle-root.ots"
      }
    }));
  };

  const handleUpgrade = async () => {
    if (!draft.timestamps.receiptBytes) return;
    setDraft((prev) => ({ ...prev, timestamps: { ...prev.timestamps, status: "stamping" } }));
    const result = await upgradeReceipt(draft.timestamps.receiptBytes);
    if ("error" in result) {
      setDraft((prev) => ({ ...prev, timestamps: { ...prev.timestamps, status: "error" } }));
      return;
    }
    setDraft((prev) => ({
      ...prev,
      timestamps: {
        ...prev.timestamps,
        status: "complete",
        receiptBytes: result.receipt
      }
    }));
  };

  const receipt = useMemo(() => {
    if (!draft.timestamps.receiptBytes || !draft.timestamps.receiptFilename) return undefined;
    return { filename: draft.timestamps.receiptFilename, bytes: draft.timestamps.receiptBytes };
  }, [draft.timestamps.receiptBytes, draft.timestamps.receiptFilename]);

  return (
    <div className="space-y-8">
      <StepIndicator steps={steps} current={step} />

      {step === 0 ? (
        <TemplatePicker
          templates={templates}
          selected={selectedTemplate?.slug}
          onSelect={handleTemplateSelect}
        />
      ) : null}

      {step === 1 ? (
        <ProjectInfoForm
          value={draft.project}
          onChange={(project) => setDraft((prev) => ({ ...prev, project }))}
        />
      ) : null}

      {step === 2 ? (
        <ProofLedger
          template={selectedTemplate}
          items={draft.proofItems}
          onAddFiles={handleAddFiles}
          onEdit={handleEditProof}
          onRemove={handleRemoveProof}
        />
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <AiToolsForm
            tools={draft.aiTools}
            notes={draft.assistance.notes}
            onChangeTools={(tools) => setDraft((prev) => ({ ...prev, aiTools: tools }))}
            onChangeNotes={(notes) =>
              setDraft((prev) => ({ ...prev, assistance: { ...prev.assistance, notes } }))
            }
          />
          {selectedTemplate ? (
            <AssistanceMeter
              global={draft.assistance.global}
              stages={selectedTemplate.stages}
              stageGrades={draft.assistance.stageGrades}
              onChangeGlobal={(global) =>
                setDraft((prev) => ({ ...prev, assistance: { ...prev.assistance, global } }))
              }
              onChangeStage={(key, grade) =>
                setDraft((prev) => ({
                  ...prev,
                  assistance: {
                    ...prev.assistance,
                    stageGrades: { ...prev.assistance.stageGrades, [key]: grade }
                  }
                }))
              }
            />
          ) : null}
        </div>
      ) : null}

      {step === 4 ? (
        <TimestampStep
          enabled={draft.timestamps.enabled}
          status={draft.timestamps.status}
          rootHash={rootHash}
          onToggle={(enabled) =>
            setDraft((prev) => ({
              ...prev,
              timestamps: { ...prev.timestamps, enabled, status: enabled ? prev.timestamps.status : "idle" }
            }))
          }
          onStamp={handleStamp}
          onUpgrade={draft.timestamps.receiptBytes ? handleUpgrade : undefined}
        />
      ) : null}

      {step === 5 ? (
        <div className="space-y-6">
          <DisclosurePreview manifest={manifest} hashes={hashes} />
          <ExportPanel manifest={manifest} hashes={hashes} proofItems={draft.proofItems} receipt={receipt} />
        </div>
      ) : null}

      {step === 6 ? (
        <PublishPanel manifest={manifest} hashes={hashes} receipt={receipt} />
      ) : null}

      <div className="flex flex-wrap justify-between gap-4">
        <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Back
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDraft(defaultDraft());
              setStep(0);
            }}
          >
            Reset draft
          </Button>
          <Button type="button" variant="primary" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
