import { hexToBytes, sha256, toHex } from "@/lib/hashing/sha256";

export async function merkleRootHex(leavesHex: string[]): Promise<string> {
  if (leavesHex.length === 0) {
    throw new Error("Merkle root requires at least one leaf");
  }

  let level = leavesHex.map((leaf) => hexToBytes(leaf));

  while (level.length > 1) {
    if (level.length % 2 === 1) {
      level = [...level, level[level.length - 1]];
    }

    const nextLevel: Uint8Array[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1];
      const combined = new Uint8Array(left.length + right.length);
      combined.set(left);
      combined.set(right, left.length);
      const hashed = await sha256(combined);
      nextLevel.push(hashed);
    }
    level = nextLevel;
  }

  return toHex(level[0]);
}

export async function bundleRootHex(manifestHex: string, proofHexes: string[]): Promise<string> {
  const sortedProofs = [...proofHexes].sort();
  return merkleRootHex([manifestHex, ...sortedProofs]);
}
