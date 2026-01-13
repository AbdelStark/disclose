import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { WizardDraft } from "@/lib/types";

const audiences = [
  { value: "public", label: "Public" },
  { value: "employer", label: "Employer" },
  { value: "school", label: "School" },
  { value: "publisher", label: "Publisher" },
  { value: "private", label: "Private" }
];

type ProjectInfoFormProps = {
  value: WizardDraft["project"];
  onChange: (next: WizardDraft["project"]) => void;
};

export default function ProjectInfoForm({ value, onChange }: ProjectInfoFormProps) {
  const updateLink = (index: number, next: string) => {
    const links = [...value.links];
    links[index] = next;
    onChange({ ...value, links });
  };

  const addLink = () => onChange({ ...value, links: [...value.links, ""] });

  const removeLink = (index: number) => {
    const links = value.links.filter((_, i) => i !== index);
    onChange({ ...value, links });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-widest text-muted">Title</label>
        <Input
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
          placeholder="Project title"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-muted">Author</label>
        <Input
          value={value.author || ""}
          onChange={(event) => onChange({ ...value, author: event.target.value })}
          placeholder="Your name or handle"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-muted">Audience</label>
        <select
          className="dc-input"
          value={value.audience || "public"}
          onChange={(event) => onChange({ ...value, audience: event.target.value as WizardDraft["project"]["audience"] })}
        >
          {audiences.map((audience) => (
            <option key={audience.value} value={audience.value}>
              {audience.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-widest text-muted">Links</label>
          <Button type="button" variant="ghost" onClick={addLink}>
            Add link
          </Button>
        </div>
        {value.links.map((link, index) => (
          <div key={`${index}-${link}`} className="flex gap-2">
            <Input
              value={link}
              onChange={(event) => updateLink(index, event.target.value)}
              placeholder="https://example.com"
            />
            <Button type="button" variant="ghost" onClick={() => removeLink(index)}>
              Remove
            </Button>
          </div>
        ))}
        {!value.links.length ? (
          <p className="text-sm text-muted">Add repo, draft, or publication URLs.</p>
        ) : null}
      </div>
      <div className="dc-card border-warning bg-warning/20 p-4">
        <p className="text-sm text-muted">
          These details are public if you publish. Keep private notes out of the title and links.
        </p>
      </div>
    </div>
  );
}
