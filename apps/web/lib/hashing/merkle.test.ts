import { webcrypto } from "node:crypto";
import { expect, test } from "vitest";
import { bundleRootHex } from "@/lib/hashing/merkle";

if (!globalThis.crypto) {
  // @ts-expect-error -- Node 18 fallback
  globalThis.crypto = webcrypto;
}

test("bundle root matches known vector", async () => {
  const manifest = "aa".repeat(32);
  const proofs = ["bb".repeat(32), "cc".repeat(32), "dd".repeat(32)];
  const root = await bundleRootHex(manifest, proofs);
  expect(root).toBe("81952b5c47f0703b5f2543a6dde2be50c5271e327c438e85c70874adf5b10e12");
});
