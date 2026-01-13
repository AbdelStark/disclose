import Wizard from "@/components/wizard/Wizard";
import { loadTemplates } from "@/lib/templates/load-templates";

export default async function NewDisclosurePage({
  searchParams
}: {
  searchParams?: { template?: string };
}) {
  const templates = await loadTemplates();
  const initialTemplate = searchParams?.template;

  return (
    <div className="space-y-6">
      <div className="dc-card p-6">
        <h1 className="text-3xl font-black tracking-tight">New Disclosure</h1>
        <p className="mt-2 text-sm text-muted">
          Everything stays local until you publish. Proof files never leave your device by default.
        </p>
      </div>
      <Wizard templates={templates} initialTemplateSlug={initialTemplate} />
    </div>
  );
}
