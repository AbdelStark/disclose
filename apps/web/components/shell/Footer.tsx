export default function Footer() {
  return (
    <footer className="border-t-[3px] border-border bg-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm">
        <div className="font-extrabold uppercase tracking-widest">Notary Pop Edition</div>
        <div className="text-muted">Local-first disclosures - Optional OpenTimestamps</div>
      </div>
    </footer>
  );
}
