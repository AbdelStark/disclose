import { NextResponse } from "next/server";
import { loadTemplates } from "@/lib/templates/load-templates";

export async function GET() {
  const templates = await loadTemplates();
  return NextResponse.json({ templates });
}
