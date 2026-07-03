import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { normalizeDepartments } from "../utils/departments";

export default function DepartmentsEditor({
  departments = [],
  onChange,
  inputId = "departments",
  label = "Departamentos o areas",
  placeholder = "Ej. Ventas, Administracion"
}) {
  const [draft, setDraft] = useState("");
  const normalizedDepartments = normalizeDepartments(departments);

  const addDepartments = () => {
    const nextItems = normalizeDepartments(draft.split(","));
    if (nextItems.length === 0) return;

    onChange(normalizeDepartments([...normalizedDepartments, ...nextItems]));
    setDraft("");
  };

  const removeDepartment = (department) => {
    onChange(normalizedDepartments.filter((item) => item !== department));
  };

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={inputId}>{label}</label>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          id={inputId}
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDepartments();
            }
          }}
        />
        <button
          type="button"
          onClick={addDepartments}
          className="btn btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "42px", whiteSpace: "nowrap" }}
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {normalizedDepartments.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
          {normalizedDepartments.map((department) => (
            <span
              key={department}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              {department}
              <button
                type="button"
                onClick={() => removeDepartment(department)}
                aria-label={`Quitar ${department}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "18px",
                  height: "18px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
