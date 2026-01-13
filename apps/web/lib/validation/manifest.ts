import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "../../../../shared/schemas/disclosure.schema.json";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validate = ajv.compile(schema);

export function validateManifest(manifest: unknown): { ok: true } | { ok: false; errors: string[] } {
  const valid = validate(manifest);
  if (valid) {
    return { ok: true };
  }

  const errors = (validate.errors || []).map((error) => {
    const path = error.instancePath || "(root)";
    return `${path} ${error.message || "is invalid"}`;
  });

  return { ok: false, errors };
}
