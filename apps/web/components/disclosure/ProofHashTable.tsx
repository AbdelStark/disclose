import Card from "@/components/ui/Card";
import { HashesJson } from "@/lib/types";

export default function ProofHashTable({ hashes }: { hashes: HashesJson }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-extrabold">Proof Hash Ledger</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="py-2 pr-4">ID</th>
              <th className="py-2 pr-4">Path</th>
              <th className="py-2 pr-4">Size</th>
              <th className="py-2">SHA-256</th>
            </tr>
          </thead>
          <tbody>
            {hashes.proof.map((item) => (
              <tr key={item.id} className="border-b border-border/30">
                <td className="py-2 pr-4 font-mono text-xs">{item.id}</td>
                <td className="py-2 pr-4 text-xs">{item.path || "(metadata)"}</td>
                <td className="py-2 pr-4 text-xs">{item.size_bytes ?? "-"}</td>
                <td className="py-2 font-mono text-xs">{item.sha256}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
