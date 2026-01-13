import Card from "@/components/ui/Card";
import { Template } from "@/lib/types";
import clsx from "clsx";

type TemplatePickerProps = {
  templates: Template[];
  selected?: string;
  onSelect: (slug: string) => void;
};

export default function TemplatePicker({ templates, selected, onSelect }: TemplatePickerProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {templates.map((template) => (
        <Card
          key={template.slug}
          hoverable
          className={clsx(
            "cursor-pointer p-6 transition-colors",
            selected === template.slug && "border-[4px] border-accent"
          )}
          onClick={() => onSelect(template.slug)}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold">{template.label}</h3>
              <p className="text-xs uppercase tracking-widest text-muted">Template v{template.version}</p>
            </div>
            <div className="dc-badge bg-paper text-fg">{template.slug}</div>
          </div>
          {template.recommended_proof && template.recommended_proof.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest text-muted">Recommended proof</p>
              <ul className="mt-2 list-disc list-inside text-sm text-muted">
                {template.recommended_proof.map((proof) => (
                  <li key={proof}>{proof}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
