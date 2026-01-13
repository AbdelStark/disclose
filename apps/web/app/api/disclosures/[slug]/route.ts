import { NextResponse } from "next/server";
import { getPublicDisclosure } from "@/lib/disclosures";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const disclosure = await getPublicDisclosure(params.slug);
  if (!disclosure) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(disclosure);
}
