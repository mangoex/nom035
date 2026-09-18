// frontend/src/utils/criticalDimensions.js

const RISK_WEIGHTS = {
  "Muy Alto": 4,
  "Alto": 3,
  "Medio": 2,
  "Bajo": 1,
  "Nulo": 0
};

const CRITICAL_RISKS = new Set(["Medio", "Alto", "Muy Alto"]);

/**
 * Ordena las dimensiones críticas por severidad de riesgo y luego por puntaje descendente.
 * @param {Array} dimensions 
 * @returns {Array}
 */
export function sortCriticalDimensions(dimensions) {
  if (!Array.isArray(dimensions)) return [];
  return [...dimensions].sort((a, b) => {
    const weightDiff = (RISK_WEIGHTS[b.risk] || 0) - (RISK_WEIGHTS[a.risk] || 0);
    if (weightDiff !== 0) return weightDiff;
    return (b.score || 0) - (a.score || 0);
  });
}

/**
 * Filtra la lista de dimensiones críticas por departamento y/o riesgo mínimo.
 * @param {Array} dimensions 
 * @param {Object} options 
 * @param {string} [options.department]
 * @param {string} [options.minRisk]
 * @returns {Array}
 */
export function filterCriticalDimensions(dimensions, { department, minRisk } = {}) {
  if (!Array.isArray(dimensions)) return [];
  return dimensions.filter((item) => {
    if (!item) return false;
    // Por defecto, solo riesgos críticos (Medio, Alto, Muy Alto)
    if (!CRITICAL_RISKS.has(item.risk)) return false;

    // Filtro por departamento opcional
    if (department && item.department !== department) {
      return false;
    }

    // Filtro por umbral específico si se proporciona
    if (minRisk && (RISK_WEIGHTS[item.risk] || 0) < (RISK_WEIGHTS[minRisk] || 0)) {
      return false;
    }

    return true;
  });
}

/**
 * Determina si la muestra departamental es reducida (< 3 respuestas) para alertar sobre privacidad.
 * @param {Object} item 
 * @returns {boolean}
 */
export function hasLowSampleWarning(item) {
  if (!item || typeof item.responses_count !== "number") return false;
  return item.responses_count < 3;
}

/**
 * Construye una etiqueta textual accesible para la dimensión crítica.
 * @param {Object} item 
 * @returns {string}
 */
export function formatCriticalDimensionLabel(item) {
  if (!item) return "";
  const dept = item.department || "General";
  const dim = item.dimension || "Dimensión";
  const risk = item.risk || "Nulo";
  const score = item.score !== undefined ? ` (Puntaje: ${item.score})` : "";
  return `${dim} en ${dept} — Riesgo ${risk}${score}`;
}
