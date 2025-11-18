 /**
  * PUBLIC_INTERFACE
  * parseFeatureFlags
  * Parses a comma or semicolon separated env string such as:
  * "enableDistanceMatrix=true,foo=false"
  */
export function parseFeatureFlags(envString) {
  const flags = {};
  if (!envString || typeof envString !== 'string') return flags;
  const pairs = envString.split(/[;,]/).map(s => s.trim()).filter(Boolean);
  for (const p of pairs) {
    const [k, v] = p.split('=').map(s => s.trim());
    if (!k) continue;
    if (v == null || v === '') {
      flags[k] = true;
    } else {
      const lower = v.toLowerCase();
      flags[k] = (lower === 'true' || lower === '1' || lower === 'yes');
    }
  }
  return flags;
}
