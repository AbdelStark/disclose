import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { validateManifest } from "@/lib/validation/manifest";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

function sha256Hex(data: Uint8Array) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { manifest, hashes, receipts } = body as {
      manifest: any;
      hashes: any;
      receipts?: Array<{ filename: string; bytes_base64: string }>;
    };

    const validation = validateManifest(manifest);
    if (!validation.ok) {
      return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
    }

    if (!hashes?.manifest_sha256 || !hashes?.bundle_root_sha256) {
      return NextResponse.json({ ok: false, error: "Invalid hashes payload" }, { status: 400 });
    }

    const origin = BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    const slug = nanoid(8);
    const publishedAt = new Date().toISOString();
    const url = `${origin}/d/${slug}`;

    const manifestToStore = {
      ...manifest,
      publication: {
        slug,
        url,
        published_at: publishedAt
      }
    };

    const receiptData = (receipts || []).map((receipt) => {
      const bytes = Buffer.from(receipt.bytes_base64, "base64");
      return {
        filename: receipt.filename,
        bytes,
        sha256: sha256Hex(bytes)
      };
    });

    await prisma.disclosure.create({
      data: {
        slug,
        manifest: manifestToStore,
        hashes,
        proofItems: manifest.proof.items.length
          ? {
              create: manifest.proof.items.map((item: any) => ({
                proofId: item.id,
                label: item.label,
                kind: item.kind,
                path: item.path,
                mime: item.mime,
                sizeBytes: item.size_bytes,
                sha256: item.sha256,
                createdBeforeAi: item.created_before_ai,
                notes: item.notes,
                gitRepo: item.git?.repo,
                gitCommit: item.git?.commit
              }))
            }
          : undefined,
        receipts: receiptData.length
          ? {
              create: receiptData
            }
          : undefined
      }
    });

    return NextResponse.json({ slug, url });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
