import { sha256Hex } from "@/lib/hashing/sha256";

const WORKER_THRESHOLD_BYTES = 10 * 1024 * 1024;

export async function hashFile(file: File): Promise<string> {
  if (typeof Worker !== "undefined" && file.size >= WORKER_THRESHOLD_BYTES) {
    return hashFileWithWorker(file);
  }
  const buffer = await file.arrayBuffer();
  return sha256Hex(buffer);
}

function hashFileWithWorker(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./hash.worker.ts", import.meta.url));
    const cleanup = () => {
      worker.terminate();
    };
    worker.onmessage = (event) => {
      const { hex, error } = event.data as { hex?: string; error?: string };
      if (hex) {
        cleanup();
        resolve(hex);
        return;
      }
      cleanup();
      reject(new Error(error || "Hash worker failed"));
    };
    worker.onerror = (err) => {
      cleanup();
      reject(err);
    };
    worker.postMessage({ file });
  });
}
