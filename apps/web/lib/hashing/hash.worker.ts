/// <reference lib="webworker" />

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

self.onmessage = async (event: MessageEvent<{ file: File }>) => {
  try {
    const buffer = await event.data.file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const hex = toHex(new Uint8Array(digest));
    self.postMessage({ hex });
  } catch (error) {
    self.postMessage({ error: (error as Error).message });
  }
};
