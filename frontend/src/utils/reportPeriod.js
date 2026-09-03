const SPANISH_MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const toDateOnlyKey = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year
    || candidate.getUTCMonth() + 1 !== month
    || candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return `${yearText}-${monthText}-${dayText}`;
};

export const formatDateOnlyEsMx = (value) => {
  const dateKey = toDateOnlyKey(value);
  if (!dateKey) return null;

  const [year, month, day] = dateKey.split("-").map(Number);
  return `${day} de ${SPANISH_MONTHS[month - 1]} de ${year}`;
};

export const buildReportPeriodLines = ({
  surveySession = null,
  responses = [],
  generatedOn = new Date(),
} = {}) => {
  if (surveySession) {
    const startKey = toDateOnlyKey(surveySession.created_at);
    const closingKey = toDateOnlyKey(surveySession.fecha_fin);
    if (!startKey || !closingKey) {
      return [
        "Periodo de aplicación: No disponible",
        "Fecha de cierre del levantamiento: No disponible",
      ];
    }

    const start = formatDateOnlyEsMx(startKey);
    const closing = formatDateOnlyEsMx(closingKey);
    const generatedKey = toDateOnlyKey(generatedOn);
    const closingHasOccurred = typeof surveySession.closing_has_occurred === "boolean"
      ? surveySession.closing_has_occurred
      : Boolean(generatedKey && closingKey < generatedKey);
    const closingLabel = closingHasOccurred
      ? "Fecha de cierre del levantamiento"
      : "Fecha programada de cierre";

    return [
      `Periodo de aplicación: ${start} al ${closing}`,
      `${closingLabel}: ${closing}`,
    ];
  }

  const responseDateKeys = responses
    .map((response) => toDateOnlyKey(response?.created_at))
    .filter(Boolean)
    .sort();

  if (responseDateKeys.length === 0) {
    return ["Periodo de respuestas incluidas: No disponible"];
  }

  const firstDate = formatDateOnlyEsMx(responseDateKeys[0]);
  const lastDate = formatDateOnlyEsMx(responseDateKeys.at(-1));
  return [`Periodo de respuestas incluidas: ${firstDate} al ${lastDate}`];
};
