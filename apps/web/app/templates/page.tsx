import Link from "next/link";
import Card from "@/components/ui/Card";
import { loadTemplates } from "@/lib/templates/load-templates";

export default async function TemplatesPage() {
  const templates = await loadTemplates();

  return (
    <div className="space-y-8">
      <div className="dc-card p-6">
        <h1 className="text-3xl font-black tracking-tight">Templates</h1>
        <p className="mt-2 text-sm text-muted">
          Choose a disclosure template that matches your work. Each template suggests proof types and stages.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.slug} className="p-6" hoverable>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold">{template.label}</h2>
                <p className="text-xs uppercase tracking-widest text-muted">v{template.version}</p>
              </div>
              <div className="dc-badge bg-paper text-fg">{template.slug}</div>
            </div>
            {template.recommended_proof?.length ? (
              <ul className="mt-4 list-disc list-inside text-sm text-muted">
                {template.recommended_proof.map((proof) => (
                  <li key={proof}>{proof}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4">
              <Link href={`/new?template=${template.slug}`} className="dc-button dc-button-primary">
                Start with template
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
