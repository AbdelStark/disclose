export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function sha256(data: ArrayBuffer | Uint8Array | string): Promise<Uint8Array> {
  let buffer: ArrayBuffer;
  if (typeof data === "string") {
    buffer = new TextEncoder().encode(data).buffer;
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } else {
    buffer = data;
  }
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return new Uint8Array(digest);
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const digest = await sha256(data);
  return toHex(digest);
}
