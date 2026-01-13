import JSZip from "jszip";
import { DisclosureManifest, HashesJson, ProofItemDraft } from "@/lib/types";

export type ReceiptBundle = { filename: string; bytes: Uint8Array };

export async function buildBundleZip(params: {
  manifest: DisclosureManifest;
  hashes: HashesJson;
  receipts: ReceiptBundle[];
  proofItems: ProofItemDraft[];
  includeProofCopies: boolean;
}): Promise<Blob> {
  const { manifest, hashes, receipts, proofItems, includeProofCopies } = params;
  const zip = new JSZip();

  zip.file("disclosure.json", JSON.stringify(manifest, null, 2));
  zip.file("hashes.json", JSON.stringify(hashes, null, 2));

  if (receipts.length) {
    const receiptsFolder = zip.folder("receipts");
    receipts.forEach((receipt) => {
      receiptsFolder?.file(receipt.filename, receipt.bytes);
    });
  }

  if (includeProofCopies) {
    const proofFolder = zip.folder("proof");
    for (const item of proofItems) {
      if (item.file) {
        proofFolder?.file(item.path || item.file.name, item.file);
      }
    }
  }

  return zip.generateAsync({ type: "blob" });
}
