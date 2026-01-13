import { prisma } from "@/lib/db";

export type PublicDisclosure = {
  manifest: any;
  hashes: any;
  receipts: Array<{ filename: string; bytes_base64: string }>;
};

export async function getPublicDisclosure(slug: string): Promise<PublicDisclosure | null> {
  const disclosure = await prisma.disclosure.findUnique({
    where: { slug },
    include: { receipts: true }
  });

  if (!disclosure) return null;

  return {
    manifest: disclosure.manifest,
    hashes: disclosure.hashes,
    receipts: disclosure.receipts.map((receipt) => ({
      filename: receipt.filename,
      bytes_base64: Buffer.from(receipt.bytes).toString("base64")
    }))
  };
}
