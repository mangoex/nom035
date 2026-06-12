import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const RISK_COLORS = {
  "Nulo": "#64748b",
  "Bajo": "#10b981",
  "Medio": "#f59e0b",
  "Alto": "#ef4444",
  "Muy Alto": "#b91c1c",
  "N/A": "#cbd5e1"
};

export const PrintableReport = React.forwardRef(({ company, stats, tasks, suggestions }, ref) => {
  if (!company || !stats) return null;

  const barDataCategories = Object.entries(stats?.category_averages || {}).map(([name, value]) => ({
    name: name.length > 30 ? name.substring(0, 30) + "..." : name,
    fullName: name,
    Puntaje: value,
    Riesgo: stats?.category_risks?.[name] || "Nulo"
  }));

  const radarDataDimensions = Object.entries(stats?.dimension_averages || {}).map(([name, value]) => ({
    name: name.length > 25 ? name.substring(0, 25) + "..." : name,
    fullName: name,
    Puntaje: value,
    Riesgo: stats?.dimension_risks?.[name] || "Nulo"
  }));

  return (
    <div ref={ref} style={{ padding: "40px", backgroundColor: "white", color: "#333", fontFamily: "sans-serif" }}>
      {/* Cover */}
      <div style={{ textAlign: "center", marginBottom: "50px", borderBottom: "2px solid #e2e8f0", paddingBottom: "20px" }}>
        <h1 style={{ fontSize: "28px", color: "#1e293b", margin: "0 0 10px 0" }}>Resultados y Plan de Intervención NOM-035</h1>
        <h2 style={{ fontSize: "20px", color: "#475569", margin: "0 0 5px 0" }}>{company.name}</h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Fecha de Generación: {new Date().toLocaleDateString()}</p>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Total de Encuestas Procesadas: {stats.total_responses}</p>
      </div>

      {/* Results Section */}
      <div style={{ marginBottom: "40px" }}>
        <h3 style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "8px", color: "#1e293b" }}>Resumen de Categorías</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {/* Gráfica de Barras */}
          <div style={{ flex: "1 1 500px", minWidth: "300px" }}>
            <BarChart width={500} height={300} data={barDataCategories} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
              <YAxis />
              <Bar dataKey="Puntaje">
                {barDataCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.Riesgo] || "#8884d8"} />
                ))}
              </Bar>
            </BarChart>
          </div>
          {/* Tabla de Categorías */}
          <div style={{ flex: "1 1 300px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "left" }}>Categoría</th>
                  <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>Puntaje</th>
                  <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {barDataCategories.map((cat, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{cat.fullName}</td>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>{cat.Puntaje}</td>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: "bold", color: RISK_COLORS[cat.Riesgo] }}>{cat.Riesgo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "40px", pageBreakInside: "avoid" }}>
        <h3 style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "8px", color: "#1e293b" }}>Resumen de Dimensiones</h3>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <RadarChart outerRadius={150} width={600} height={400} data={radarDataDimensions}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis />
            <Radar name="Puntaje" dataKey="Puntaje" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
          </RadarChart>
        </div>
      </div>

      {/* Action Plan Kanban Table */}
      <div style={{ marginBottom: "40px", pageBreakInside: "avoid" }}>
        <h3 style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "8px", color: "#1e293b" }}>Plan de Acción Vigente</h3>
        {tasks && tasks.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "left" }}>Descripción</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>Nivel</th>
                <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{task.description}</td>
                  <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                    {task.intervention_level === "first_level" ? "1°" : task.intervention_level === "second_level" ? "2°" : "3°"}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                    {task.status === "pending" ? "Por Hacer" : task.status === "in_progress" ? "En Progreso" : "Completado"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: "12px", color: "#64748b" }}>No hay tareas registradas en el Plan de Acción.</p>
        )}
      </div>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div style={{ pageBreakInside: "avoid" }}>
          <h3 style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "8px", color: "#1e293b" }}>Sugerencias Normativas Pendientes</h3>
          <ul style={{ fontSize: "12px", color: "#475569", paddingLeft: "20px" }}>
            {suggestions.map((sugg, i) => (
              <li key={i} style={{ marginBottom: "8px" }}>
                <strong>{sugg.intervention_level === "first_level" ? "[1° Nivel]" : "[2° Nivel]"}</strong> {sugg.description}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
});
