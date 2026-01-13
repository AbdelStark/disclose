type OtsLibrary = {
  DetachedTimestampFile: {
    fromHash: (op: any, hash: Uint8Array) => any;
    fromBytes?: (op: any, bytes: Uint8Array) => any;
    deserialize: (bytes: Uint8Array) => any;
  };
  Ops: {
    OpSHA256: new () => any;
  };
  stamp: (timestamp: any, calendars?: string[] | undefined) => Promise<void>;
  upgrade: (timestamp: any, calendars?: string[] | undefined) => Promise<void | boolean>;
  info: (timestamp: any) => any;
  verify?: (receipt: any, detached: any, options?: any) => Promise<any>;
};

declare global {
  interface Window {
    OpenTimestamps?: OtsLibrary;
  }
  const OpenTimestamps: OtsLibrary;
}

export {};
