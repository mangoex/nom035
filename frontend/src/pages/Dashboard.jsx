// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  FileCheck2,
  AlertTriangle,
  ClipboardCheck,
  Filter,
  XCircle,
  BarChart2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from "recharts";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

const RISK_COLORS = {
  "Nulo": "#64748b",
  "Bajo": "#10b981",
  "Medio": "#f59e0b",
  "Alto": "#ef4444",
  "Muy Alto": "#b91c1c",
  "N/A": "#cbd5e1"
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: "var(--bg-secondary)", padding: "10px", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-primary)" }}>
        <p style={{ fontWeight: "700", marginBottom: "4px" }}>{data.fullName}</p>
        <p>Puntaje: <span style={{ fontWeight: "600" }}>{data.Puntaje}</span></p>
        <p>Nivel de Riesgo: <strong style={{ color: RISK_COLORS[data.Riesgo] }}>{data.Riesgo}</strong></p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState("");
  
  // Filters
  const [filters, setFilters] = useState({
    age_range: "",
    gender: "",
    department: "",
    position: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (filters.age_range) params.append("age_range", filters.age_range);
      if (filters.gender) params.append("gender", filters.gender);
      if (filters.department) params.append("department", filters.department);
      if (filters.position) params.append("position", filters.position);

      const qs = params.toString();
      const query = qs ? `?${qs}` : "";

      const [compRes, statsRes, respRes] = await Promise.all([
        api.get("/api/company/me"),
        api.get(`/api/survey/stats${query}`),
        api.get(`/api/survey/responses${query}`)
      ]);
      setCompany(compRes.data);
      setStats(statsRes.data);
      setResponses(respRes.data.responses);
    } catch (err) {
      console.error(err);
      setError("Error al cargar la información del servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ age_range: "", gender: "", department: "", position: "" });
  };

  if (loading && !company) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Cargando panel de control...</p>
      </div>
    );
  }

  // Convert risk distribution to recharts format
  const pieData = Object.entries(stats?.final_risk_distribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  // Convert category averages to recharts format
  const barDataCategories = Object.entries(stats?.category_averages || {}).map(([name, value]) => ({
    name: name.length > 15 ? name.substring(0, 15) + "..." : name,
    fullName: name,
    Puntaje: value,
    Riesgo: stats?.category_risks?.[name] || "Nulo"
  }));

  const barDataDomains = Object.entries(stats?.domain_averages || {}).map(([name, value]) => ({
    name: name.length > 15 ? name.substring(0, 15) + "..." : name,
    fullName: name,
    Puntaje: value,
    Riesgo: stats?.domain_risks?.[name] || "Nulo"
  }));



  // Extract available filters (dynamic)
  const availableFilters = stats?.available_filters || { age_ranges: [], genders: [], departments: [], positions: [] };

  return (
    <div className="app-container">
      <Sidebar company={company} />
      
      <main className="main-content">
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Resultados NOM-035</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Diagnóstico psicosocial detallado de {company?.name}
            </p>
          </div>
          <ThemeToggle />
        </header>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", marginBottom: "20px" }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="glass-card" style={{ padding: "16px", marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontWeight: "600", marginRight: "8px" }}>
            <Filter size={18} /> Filtros:
          </div>
          
          <select name="age_range" value={filters.age_range} onChange={handleFilterChange} className="form-input" style={{ width: "auto", padding: "8px 12px", minWidth: "140px" }}>
            <option value="">Todas las edades</option>
            {availableFilters.age_ranges.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <select name="gender" value={filters.gender} onChange={handleFilterChange} className="form-input" style={{ width: "auto", padding: "8px 12px", minWidth: "140px" }}>
            <option value="">Todos los géneros</option>
            {availableFilters.genders.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <select name="position" value={filters.position} onChange={handleFilterChange} className="form-input" style={{ width: "auto", padding: "8px 12px", minWidth: "140px" }}>
            <option value="">Todos los puestos</option>
            {availableFilters.positions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          
          <select name="department" value={filters.department} onChange={handleFilterChange} className="form-input" style={{ width: "auto", padding: "8px 12px", minWidth: "180px" }}>
            <option value="">Todos los departamentos</option>
            {availableFilters.departments.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          {/* Botón limpiar filtros */}
          <button 
            onClick={clearFilters} 
            className="btn btn-secondary" 
            style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}
          >
            <XCircle size={16} />
            Limpiar Filtros
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
          
          <div className="glass-card animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", backgroundColor: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>Total Encuestas Filtradas</span>
              <h3 style={{ fontSize: "24px", fontWeight: "800", marginTop: "2px" }}>{stats?.total_responses || 0}</h3>
            </div>
          </div>

          <div className="glass-card animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", backgroundColor: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileCheck2 size={24} style={{ color: "var(--color-success)" }} />
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>Guía Activa</span>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginTop: "6px" }}>
                {company?.active_guide === "GUIA_I" ? "Guía I" : 
                 company?.active_guide === "GUIA_II" ? "Guías I y II" : 
                 "Guías I y III"}
              </h3>
            </div>
          </div>

          {/* Calificación Final Promedio Card */}
          <div className="glass-card animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", backgroundColor: RISK_COLORS[stats?.global_score_risk] ? `${RISK_COLORS[stats?.global_score_risk]}20` : "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={24} style={{ color: RISK_COLORS[stats?.global_score_risk] || "var(--color-primary)" }} />
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>Puntaje Final Promedio</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                <h3 style={{ fontSize: "24px", fontWeight: "800" }}>
                  {stats?.global_score_average || 0}
                </h3>
                {stats?.global_score_risk && (
                  <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", backgroundColor: `${RISK_COLORS[stats.global_score_risk]}20`, color: RISK_COLORS[stats.global_score_risk] }}>
                    {stats.global_score_risk}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", backgroundColor: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldAlert size={24} style={{ color: "var(--color-danger)" }} />
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>Casos Traumáticos (ATS)</span>
              <h3 style={{ fontSize: "24px", fontWeight: "800", marginTop: "2px", color: (stats?.requires_clinical_referral_count > 0) ? "var(--color-danger)" : "var(--text-primary)" }}>
                {stats?.requires_clinical_referral_count || 0}
              </h3>
            </div>
          </div>

        </div>

        {/* Charts Section */}
        {stats?.total_responses > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", marginBottom: "24px" }}>
              {/* Pie Chart: Risk Distribution */}
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Riesgo Global en la Empresa</h3>
                <div style={{ width: "100%", height: "260px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || "#ccc"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Category Averages */}
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Nivel de Riesgo por Categorías (Dimensiones)</h3>
                <div style={{ width: "100%", height: "260px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barDataCategories}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Puntaje" radius={[4, 4, 0, 0]}>
                        {barDataCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.Riesgo] || "#cbd5e1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Domains Bar Chart */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Nivel de Riesgo por Dominios</h3>
              <div style={{ width: "100%", height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barDataDomains} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Puntaje" radius={[0, 4, 4, 0]} barSize={20}>
                        {barDataDomains.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.Riesgo] || "#cbd5e1"} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Responses Table */}
            <div className="glass-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Detalle de Encuestas ({responses.length})</h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>Mostrando respuestas individuales anonimizadas según la NOM-035.</p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead style={{ backgroundColor: "rgba(99, 102, 241, 0.05)" }}>
                    <tr>
                      <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600" }}>ID</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600" }}>Fecha</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600" }}>Edad / Género</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600" }}>Depto. / Puesto</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600" }}>Puntaje Final</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--text-secondary)", fontWeight: "600" }}>Riesgo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}>
                        <td style={{ padding: "14px 20px", color: "var(--text-secondary)" }}>#{r.id}</td>
                        <td style={{ padding: "14px 20px" }}>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: "14px 20px" }}>{r.demographics.age_range} • {r.demographics.gender}</td>
                        <td style={{ padding: "14px 20px" }}>{r.demographics.department} <br/><span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{r.demographics.position}</span></td>
                        <td style={{ padding: "14px 20px", fontWeight: "600" }}>{r.scores?.final_score || "N/A"}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ 
                            display: "inline-block", 
                            padding: "4px 8px", 
                            borderRadius: "12px", 
                            fontSize: "12px", 
                            fontWeight: "600",
                            backgroundColor: RISK_COLORS[r.final_risk] ? `${RISK_COLORS[r.final_risk]}20` : "transparent",
                            color: RISK_COLORS[r.final_risk] || "var(--text-primary)"
                          }}>
                            {r.final_risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        ) : (
          <div className="glass-card" style={{ padding: "80px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <ClipboardCheck size={48} style={{ color: "var(--text-muted)" }} />
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>No hay datos que coincidan con los filtros</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "420px", lineHeight: "1.6" }}>
              Intenta cambiar los filtros superiores o genera una liga para capturar más respuestas.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
