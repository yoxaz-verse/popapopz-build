export function normalizeSupabaseUrl(value: string | undefined) {
  const normalized = normalizeEnvValue(value);
  const markdownUrl = normalized.match(/\((https:\/\/[^)]+)\)/)?.[1];
  return markdownUrl ?? normalized;
}

export function normalizeSupabaseKey(value: string | undefined) {
  return normalizeEnvValue(value).replaceAll("\\_", "_");
}

function normalizeEnvValue(value: string | undefined) {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}
