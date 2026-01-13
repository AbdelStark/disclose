import { loadTemplates } from "@/lib/templates/load-templates";
import { Template } from "@/lib/types";

export async function getTemplateBySlug(slug: string): Promise<Template | undefined> {
  const templates = await loadTemplates();
  return templates.find((template) => template.slug === slug);
}
