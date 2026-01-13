import fs from "node:fs/promises";
import path from "node:path";
import { Template } from "@/lib/types";

const templatesDir = path.resolve(process.cwd(), "..", "..", "shared", "templates");

export async function loadTemplates(): Promise<Template[]> {
  const files = await fs.readdir(templatesDir);
  const templates: Template[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const content = await fs.readFile(path.join(templatesDir, file), "utf8");
    templates.push(JSON.parse(content));
  }

  templates.sort((a, b) => a.label.localeCompare(b.label));
  return templates;
}
