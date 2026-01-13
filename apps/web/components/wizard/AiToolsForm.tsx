import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { AiTool } from "@/lib/types";

type AiToolsFormProps = {
  tools: AiTool[];
  notes?: string;
  onChangeTools: (next: AiTool[]) => void;
  onChangeNotes: (notes: string) => void;
};

export default function AiToolsForm({ tools, notes, onChangeTools, onChangeNotes }: AiToolsFormProps) {
  const updateTool = (index: number, patch: Partial<AiTool>) => {
    const next = tools.map((tool, i) => (i === index ? { ...tool, ...patch } : tool));
    onChangeTools(next);
  };

  const addTool = () => onChangeTools([...tools, { name: "" }]);
  const removeTool = (index: number) => onChangeTools(tools.filter((_, i) => i !== index));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold">AI Tools Used</h3>
          <Button type="button" variant="ghost" onClick={addTool}>
            Add tool
          </Button>
        </div>
        <div className="mt-4 space-y-4">
          {tools.map((tool, index) => (
            <div key={`${index}-${tool.name}`} className="dc-card p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted">Tool name</label>
                  <Input
                    value={tool.name}
                    onChange={(event) => updateTool(index, { name: event.target.value })}
                    placeholder="ChatGPT"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted">Provider</label>
                  <Input
                    value={tool.provider || ""}
                    onChange={(event) => updateTool(index, { provider: event.target.value })}
                    placeholder="OpenAI"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted">Model</label>
                  <Input
                    value={tool.model || ""}
                    onChange={(event) => updateTool(index, { model: event.target.value })}
                    placeholder="GPT-4.1"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted">Notes</label>
                  <Input
                    value={tool.notes || ""}
                    onChange={(event) => updateTool(index, { notes: event.target.value })}
                    placeholder="Idea generation"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button type="button" variant="ghost" onClick={() => removeTool(index)}>
                  Remove tool
                </Button>
              </div>
            </div>
          ))}
          {!tools.length ? <p className="text-sm text-muted">Optional but recommended.</p> : null}
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-muted">AI usage notes</label>
        <Textarea
          value={notes || ""}
          onChange={(event) => onChangeNotes(event.target.value)}
          placeholder="Describe what AI did and where you double-checked."
        />
      </div>
    </div>
  );
}
