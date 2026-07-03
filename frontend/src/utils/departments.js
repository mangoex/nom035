export const normalizeDepartments = (value) => {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  return value
    .map((item) => String(item || "").trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};
