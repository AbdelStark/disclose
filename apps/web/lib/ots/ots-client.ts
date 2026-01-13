import { hexToBytes } from "@/lib/hashing/sha256";

type OtsLibrary = {
  DetachedTimestampFile: {
    fromHash: (op: any, hash: Uint8Array) => any;
    deserialize: (bytes: Uint8Array) => any;
  };
  Ops: {
    OpSHA256: new () => any;
  };
  stamp: (timestamp: any, calendars?: string[]) => Promise<void>;
  upgrade: (timestamp: any, calendars?: string[]) => Promise<void | boolean>;
  info: (timestamp: any) => any;
};

export type OtsInfo = {
  body: string;
};

function ensureUint8(data: Uint8Array | ArrayBuffer): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

async function loadOts(): Promise<OtsLibrary> {
  if (typeof window === "undefined") {
    throw new Error("OpenTimestamps is only available in the browser");
  }
  if ((window as any).OpenTimestamps) {
    return (window as any).OpenTimestamps as OtsLibrary;
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/vendor/opentimestamps.min.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).OpenTimestamps) {
        resolve((window as any).OpenTimestamps as OtsLibrary);
      } else {
        reject(new Error("OpenTimestamps failed to load"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load OpenTimestamps script"));
    document.head.appendChild(script);
  });
}

export async function stampDigest(
  digestHex: string,
  calendars?: string[]
): Promise<{ receipt: Uint8Array; info: OtsInfo } | { error: string }> {
  try {
    const ots = await loadOts();
    const hashBytes = hexToBytes(digestHex);
    const detached = ots.DetachedTimestampFile.fromHash(new ots.Ops.OpSHA256(), hashBytes);
    await ots.stamp(detached, calendars);
    const bytes = detached.serializeToBytes ? detached.serializeToBytes() : detached.serializeBytes();
    const info = ots.info(detached);
    return { receipt: ensureUint8(bytes), info: { body: String(info) } };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function upgradeReceipt(
  receiptBytes: Uint8Array,
  calendars?: string[]
): Promise<{ receipt: Uint8Array; info: OtsInfo } | { error: string }> {
  try {
    const ots = await loadOts();
    const detached = ots.DetachedTimestampFile.deserialize(receiptBytes);
    await ots.upgrade(detached, calendars);
    const bytes = detached.serializeToBytes ? detached.serializeToBytes() : detached.serializeBytes();
    const info = ots.info(detached);
    return { receipt: ensureUint8(bytes), info: { body: String(info) } };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function receiptInfo(receiptBytes: Uint8Array): Promise<OtsInfo | { error: string }> {
  try {
    const ots = await loadOts();
    const detached = ots.DetachedTimestampFile.deserialize(receiptBytes);
    const info = ots.info(detached);
    return { body: String(info) };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
