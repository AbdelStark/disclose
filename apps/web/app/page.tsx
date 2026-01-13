import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="dc-card p-8">
        <div className="flex flex-col gap-6">
          <div className="dc-stamp bg-stamp text-paper">Self-Reported</div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Disclose your AI usage with proof that stays local.
          </h1>
          <p className="text-lg text-muted">
            Create a public, verifiable disclosure without uploading your private files. Hashes and optional
            OpenTimestamps receipts only.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/new" className="dc-button dc-button-primary">
              Start a disclosure
            </Link>
            <Link href="/templates" className="dc-button dc-button-secondary">
              Browse templates
            </Link>
          </div>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        <div className="dc-card p-6">
          <h2 className="text-xl font-extrabold">Local-first proofs</h2>
          <p className="mt-3 text-sm text-muted">
            Proof files never leave your device unless you explicitly include them in an export bundle.
          </p>
        </div>
        <div className="dc-card p-6">
          <h2 className="text-xl font-extrabold">Transparent assistance</h2>
          <p className="mt-3 text-sm text-muted">
            Human vs AI contribution splits with optional per-stage grades make disclosures honest and specific.
          </p>
        </div>
        <div className="dc-card p-6">
          <h2 className="text-xl font-extrabold">Optional timestamping</h2>
          <p className="mt-3 text-sm text-muted">
            OpenTimestamps receipts can prove your proof bundle existed at or before a point in time.
          </p>
        </div>
      </section>
    </div>
  );
}
