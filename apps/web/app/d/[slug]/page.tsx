import { notFound } from "next/navigation";
import DisclosurePreview from "@/components/disclosure/DisclosurePreview";
import ProofHashTable from "@/components/disclosure/ProofHashTable";
import TimestampReceiptPanel from "@/components/disclosure/TimestampReceiptPanel";
import VerificationHints from "@/components/disclosure/VerificationHints";
import { getPublicDisclosure } from "@/lib/disclosures";

export default async function PublicDisclosurePage({ params }: { params: { slug: string } }) {
  const disclosure = await getPublicDisclosure(params.slug);

  if (!disclosure) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <DisclosurePreview manifest={disclosure.manifest} hashes={disclosure.hashes} />
      <ProofHashTable hashes={disclosure.hashes} />
      <TimestampReceiptPanel receipts={disclosure.receipts} />
      <VerificationHints />
    </div>
  );
}
