import fs from "node:fs/promises";
import OpenTimestamps from "opentimestamps";

const { DetachedTimestampFile, Ops } = OpenTimestamps;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.replace(/^--/, "");
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    }
  }
  return args;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const mock = process.env.DISCLOSE_OTS_MOCK === "1";

  if (!command) {
    console.error("Missing command");
    process.exit(1);
  }

  if (command === "stamp") {
    const digest = args.digest;
    const out = args.out;
    const calendars = args.calendars ? String(args.calendars).split(",") : undefined;
    if (!digest || !out) {
      console.error("Missing --digest or --out");
      process.exit(1);
    }
    const hash = Buffer.from(digest, "hex");
    const detached = DetachedTimestampFile.fromHash(new Ops.OpSHA256(), hash);
    if (mock) {
      const pending = new OpenTimestamps.Notary.PendingAttestation("mock://local-calendar");
      detached.timestamp.attestations.push(pending);
    } else {
      await OpenTimestamps.stamp(detached, calendars);
    }
    const bytes = detached.serializeToBytes();
    await fs.writeFile(out, Buffer.from(bytes));
    console.log(JSON.stringify({ ok: true, receipt_path: out, mock }));
    return;
  }

  if (command === "upgrade") {
    const receipt = args.receipt;
    if (!receipt) {
      console.error("Missing --receipt");
      process.exit(1);
    }
    if (mock) {
      console.log(JSON.stringify({ ok: true, changed: false, mock }));
      return;
    }
    const file = await fs.readFile(receipt);
    const detached = DetachedTimestampFile.deserialize(file);
    const changed = await OpenTimestamps.upgrade(detached);
    if (changed) {
      const bytes = detached.serializeToBytes();
      await fs.writeFile(receipt, Buffer.from(bytes));
    }
    console.log(JSON.stringify({ ok: true, changed }));
    return;
  }

  if (command === "info") {
    const receipt = args.receipt;
    if (!receipt) {
      console.error("Missing --receipt");
      process.exit(1);
    }
    const file = await fs.readFile(receipt);
    const detached = DetachedTimestampFile.deserialize(file);
    const info = OpenTimestamps.info(detached);
    console.log(JSON.stringify({ ok: true, info }));
    return;
  }

  if (command === "verify") {
    const receipt = args.receipt;
    const digest = args.digest;
    if (!receipt || !digest) {
      console.error("Missing --receipt or --digest");
      process.exit(1);
    }
    const file = await fs.readFile(receipt);
    const detachedOts = DetachedTimestampFile.deserialize(file);
    const hash = Buffer.from(digest, "hex");
    if (mock) {
      const receiptDigest = Buffer.from(detachedOts.fileDigest()).toString("hex");
      const verified = receiptDigest.toLowerCase() === digest.toLowerCase();
      console.log(JSON.stringify({ ok: true, verified, result: { mock: true } }));
      return;
    }
    const detached = DetachedTimestampFile.fromHash(new Ops.OpSHA256(), hash);
    const options = {
      ignoreBitcoinNode: true,
      timeout: args.timeout ? Number(args.timeout) : 5000
    };
    const verifyResult = await OpenTimestamps.verify(detachedOts, detached, options);
    const verified = Boolean(verifyResult);
    console.log(JSON.stringify({ ok: true, verified, result: verifyResult || null }));
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
