import Link from "next/link";

export default function TopNav() {
  return (
    <header className="border-b-[3px] border-border bg-paper shadow-dc">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-black uppercase tracking-widest">
          Disclose
        </Link>
        <nav className="flex items-center gap-4 text-sm font-extrabold">
          <Link href="/templates" className="hover:underline">
            Templates
          </Link>
          <Link href="/verify" className="hover:underline">
            Verify
          </Link>
          <Link href="/new" className="dc-button dc-button-primary">
            Start Disclosure
          </Link>
        </nav>
      </div>
    </header>
  );
}
