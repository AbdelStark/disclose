type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };

function sortValue(value: any): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }
  if (value && typeof value === "object") {
    const sorted: { [key: string]: JsonValue } = {};
    const keys = Object.keys(value).sort();
    for (const key of keys) {
      const next = value[key];
      if (next === undefined) continue;
      sorted[key] = sortValue(next);
    }
    return sorted;
  }
  return value as JsonValue;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}
