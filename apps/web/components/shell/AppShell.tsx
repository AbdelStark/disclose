import TopNav from "@/components/shell/TopNav";
import Footer from "@/components/shell/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
