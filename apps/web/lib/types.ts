export type TemplateStage = {
  key: string;
  label: string;
  description?: string;
};

export type Template = {
  slug: string;
  version: string;
  label: string;
  recommended_proof?: string[];
  stages: TemplateStage[];
};

export type AssistanceGrade = "none" | "light" | "moderate" | "heavy" | "full";

export type AiTool = {
  name: string;
  provider?: string;
  model?: string;
  notes?: string;
};

export type ProofKind = "file" | "git_commit" | "text_note";

export type ProofItemDraft = {
  id: string;
  label: string;
  kind: ProofKind;
  path?: string;
  mime?: string;
  sizeBytes?: number;
  sha256?: string;
  createdBeforeAi: boolean;
  notes?: string;
  file?: File;
  git?: {
    repo: string;
    commit: string;
  };
  addedAtIso: string;
};

export type WizardDraft = {
  id: string;
  createdAt: string;
  template?: Template;
  project: {
    title: string;
    author?: string;
    links: string[];
    audience?: \"public\" | \"employer\" | \"school\" | \"publisher\" | \"private\";
  };
  aiTools: AiTool[];
  assistance: {
    global: { human: number; ai: number };
    stageGrades: Record<string, AssistanceGrade>;
    notes?: string;
  };
  proofItems: ProofItemDraft[];
  timestamps: {
    enabled: boolean;
    status: \"idle\" | \"stamping\" | \"pending\" | \"complete\" | \"error\";
    receiptBytes?: Uint8Array;
    receiptFilename?: string;
  };
};

export type DisclosureManifest = {
  version: string;
  id: string;
  created_at: string;
  template: {
    slug: string;
    version: string;
  };
  project: {
    title: string;
    author?: string;
    links?: string[];
    audience?: "public" | "employer" | "school" | "publisher" | "private";
  };
  ai_tools?: AiTool[];
  assistance: {
    global: {
      human_percent: number;
      ai_percent: number;
    };
    stages?: Array<{
      key: string;
      label: string;
      grade: AssistanceGrade;
      approx_ai_percent: number;
    }>;
    notes?: string;
  };
  proof: {
    items: Array<{
      id: string;
      label: string;
      kind: ProofKind;
      path?: string;
      mime?: string;
      size_bytes?: number;
      sha256: string;
      created_before_ai?: boolean;
      notes?: string;
      git?: {
        repo: string;
        commit: string;
      };
    }>;
    bundle_root_sha256?: string;
  };
  timestamps?: {
    opentimestamps?: {
      enabled?: boolean;
      status?: "none" | "pending" | "complete";
      receipt_sha256?: string;
      receipt_filename?: string;
    };
  };
  publication?: {
    slug?: string;
    url?: string;
    published_at?: string;
  };
};

export type HashesJson = {
  algo: "sha256+merkle/v1";
  manifest_sha256: string;
  proof: Array<{
    id: string;
    sha256: string;
    size_bytes?: number;
    path?: string;
  }>;
  bundle_root_sha256: string;
};
