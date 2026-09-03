import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReportPeriodLines,
  formatDateOnlyEsMx,
} from "./reportPeriod.js";

test("TDD-TC-004 formats stored calendar dates without timezone shifts", () => {
  assert.equal(formatDateOnlyEsMx("2026-08-30"), "30 de agosto de 2026");
  assert.equal(
    formatDateOnlyEsMx("2026-08-30T23:59:00.000Z"),
    "30 de agosto de 2026",
  );
});

test("TDD-TC-004 reports an occurred session closing separately from emission", () => {
  const lines = buildReportPeriodLines({
    surveySession: {
      created_at: "2026-08-01T12:00:00",
      fecha_fin: "2026-08-30",
      closing_has_occurred: true,
    },
    generatedOn: "2026-09-02",
  });

  assert.deepEqual(lines, [
    "Periodo de aplicación: 1 de agosto de 2026 al 30 de agosto de 2026",
    "Fecha de cierre del levantamiento: 30 de agosto de 2026",
  ]);
});

test("TDD-TC-004 labels a future or same-day closing as scheduled", () => {
  const lines = buildReportPeriodLines({
    surveySession: {
      created_at: "2026-08-01T12:00:00",
      fecha_fin: "2026-09-02",
      closing_has_occurred: false,
    },
    generatedOn: "2026-09-02",
  });

  assert.equal(
    lines[1],
    "Fecha programada de cierre: 2 de septiembre de 2026",
  );
});

test("TDD-TC-005 uses response min/max for aggregate reports", () => {
  const lines = buildReportPeriodLines({
    responses: [
      { created_at: "2026-08-20T10:00:00" },
      { created_at: "2026-08-03T18:00:00" },
      { created_at: "2026-08-12T08:00:00" },
    ],
    generatedOn: "2026-09-02",
  });

  assert.deepEqual(lines, [
    "Periodo de respuestas incluidas: 3 de agosto de 2026 al 20 de agosto de 2026",
  ]);
  assert.equal(lines.some((line) => line.includes("cierre")), false);
});

test("TDD-TC-005 degrades explicitly when period data is unavailable", () => {
  assert.deepEqual(buildReportPeriodLines({ responses: [] }), [
    "Periodo de respuestas incluidas: No disponible",
  ]);

  assert.deepEqual(
    buildReportPeriodLines({
      surveySession: { created_at: "2026-08-01T12:00:00", fecha_fin: null },
    }),
    [
      "Periodo de aplicación: No disponible",
      "Fecha de cierre del levantamiento: No disponible",
    ],
  );
});
