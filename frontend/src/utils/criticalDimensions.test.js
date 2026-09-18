// frontend/src/utils/criticalDimensions.test.js
import test from "node:test";
import assert from "node:assert/strict";
import {
  sortCriticalDimensions,
  filterCriticalDimensions,
  hasLowSampleWarning,
  formatCriticalDimensionLabel
} from "./criticalDimensions.js";

test("TDD-TC-010: sortCriticalDimensions ordena por severidad de riesgo (Muy Alto > Alto > Medio)", () => {
  const input = [
    { department: "Ventas", dimension: "Liderazgo", risk: "Medio", score: 10 },
    { department: "Operaciones", dimension: "Carga de trabajo", risk: "Muy Alto", score: 25 },
    { department: "Logística", dimension: "Jornada laboral", risk: "Alto", score: 18 },
    { department: "Finanzas", dimension: "Relaciones", risk: "Bajo", score: 5 }
  ];

  const sorted = sortCriticalDimensions(input);
  assert.equal(sorted[0].risk, "Muy Alto");
  assert.equal(sorted[1].risk, "Alto");
  assert.equal(sorted[2].risk, "Medio");
});

test("TDD-TC-010: filterCriticalDimensions filtra por departamento y omite riesgos no críticos", () => {
  const input = [
    { department: "Operaciones", dimension: "Carga de trabajo", risk: "Alto" },
    { department: "Operaciones", dimension: "Ambiente", risk: "Bajo" },
    { department: "Ventas", dimension: "Liderazgo", risk: "Medio" },
  ];

  // Filtro por departamento Operaciones
  const filteredOperaciones = filterCriticalDimensions(input, { department: "Operaciones" });
  assert.equal(filteredOperaciones.length, 1);
  assert.equal(filteredOperaciones[0].dimension, "Carga de trabajo");
  assert.equal(filteredOperaciones[0].department, "Operaciones");

  // Filtro sin departamento especificado (trae todas las críticas)
  const allCritical = filterCriticalDimensions(input, {});
  assert.equal(allCritical.length, 2);
  assert.ok(!allCritical.some(item => item.risk === "Bajo" || item.risk === "Nulo"));
});

test("TDD-TC-010: hasLowSampleWarning detecta muestras menores a 3 respuestas", () => {
  assert.equal(hasLowSampleWarning({ responses_count: 1 }), true);
  assert.equal(hasLowSampleWarning({ responses_count: 2 }), true);
  assert.equal(hasLowSampleWarning({ responses_count: 3 }), false);
  assert.equal(hasLowSampleWarning({ responses_count: 10 }), false);
  assert.equal(hasLowSampleWarning(null), false);
});

test("TDD-TC-010: maneja de forma segura datos vacíos o nulos sin lanzar excepción", () => {
  assert.deepEqual(sortCriticalDimensions(null), []);
  assert.deepEqual(sortCriticalDimensions([]), []);
  assert.deepEqual(filterCriticalDimensions(null, {}), []);
  assert.deepEqual(filterCriticalDimensions([], {}), []);
});

test("TDD-TC-010: formatCriticalDimensionLabel construye texto accesible", () => {
  const item = { department: "Logística", dimension: "Carga mental", risk: "Alto", score: 14.5 };
  const label = formatCriticalDimensionLabel(item);
  assert.match(label, /Carga mental/);
  assert.match(label, /Logística/);
  assert.match(label, /Alto/);
});
