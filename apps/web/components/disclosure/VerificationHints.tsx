import Card from "@/components/ui/Card";

export default function VerificationHints() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-extrabold">Verify with CLI</h3>
      <p className="mt-2 text-sm text-muted">
        Download the bundle or receipt and use the CLI to verify hashes and timestamps locally.
      </p>
      <pre className="mt-4 rounded-dc0 border-2 border-border bg-paper/60 p-4 text-xs">
        {`disclose verify --path ./my-disclosure --receipt receipts/bundle-root.ots\n`}
      </pre>
    </Card>
  );
}
