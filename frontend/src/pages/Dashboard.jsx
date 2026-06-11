// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  HelpCircle,
  FileCheck2,
  AlertTriangle
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
  Legend 
} from "recharts";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

const RISK_COLORS = {
  "Nulo": "#64748b",
  "Bajo": "#10b981",
  "Medio": "#f59e0b",
  "Alto": "#ef4444",
  "Muy Alto": "#b91c1c"
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, statsRes] = await Promise.all([
          api.get("/api/company/me"),
          api.get("/api/survey/stats")
        ]);
        setCompany(compRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
        setError("Error al cargar la información del servidor.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
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
  const barData = Object.entries(stats?.category_averages || {}).map(([name, value]) => ({
    name: name.length > 20 ? name.substring(0, 18) + "..." : name,
    Puntaje: value
  }));

  return (
    <div className="app-container">
      <Sidebar company={company} />
      
      <main className="main-content">
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Panel de Control</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Cumplimiento legal y diagnóstico psicosocial de {company?.name}
            </p>
          </div>
          <ThemeToggle />
        </header>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", display: "flex", gap: "10px", alignItems: "center", fontSize: "14px" }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          
          <div className="glass-card animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", backgroundColor: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyitems: "center", justifyContent: "center" }}>
              <Users size={24} style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>Total Encuestas</span>
              <h3 style={{ fontSize: "24px", fontWeight: "800", marginTop: "2px" }}>{stats?.total_responses || 0}</h3>
            </div>
          </div>

          <div className="glass-card animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", backgroundColor: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyitems: "center", justifyContent: "center" }}>
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

          <div className="glass-card animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", backgroundColor: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyitems: "center", justifyContent: "center" }}>
              <ShieldAlert size={24} style={{ color: "var(--color-danger)" }} />
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>Casos Traumáticos</span>
              <h3 style={{ fontSize: "24px", fontWeight: "800", marginTop: "2px", color: (stats?.requires_clinical_referral_count > 0) ? "var(--color-danger)" : "var(--text-primary)" }}>
                {stats?.requires_clinical_referral_count || 0}
              </h3>
            </div>
          </div>

          <div className="glass-card animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", backgroundColor: "rgba(6, 182, 212, 0.1)", display: "flex", alignItems: "center", justifyitems: "center", justifyContent: "center" }}>
              <Activity size={24} style={{ color: "var(--color-info)" }} />
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>Plantilla Laboral</span>
              <h3 style={{ fontSize: "24px", fontWeight: "800", marginTop: "2px" }}>{company?.employee_count || 0} emp.</h3>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {stats?.total_responses > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            
            {/* Pie Chart: Risk Distribution */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Distribución de Riesgo Final</h3>
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
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Category Averages */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Promedios por Categoría</h3>
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(99, 102, 241, 0.05)" }} />
                    <Bar dataKey="Puntaje" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-card" style={{ padding: "80px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <ClipboardCheck size={48} style={{ color: "var(--text-muted)" }} />
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>No hay datos registrados aún</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "420px", lineHeight: "1.6" }}>
              Para visualizar métricas, gráficos e índices de riesgo, por favor genera una liga para levantar encuestas en línea, o carga un archivo CSV en el módulo de Captura de Datos.
            </p>
            <a href="/intake" className="btn btn-primary" style={{ marginTop: "8px" }}>Ir a Captura de Datos</a>
          </div>
        )}

        {/* Warning notification for clinical referrals */}
        {stats?.requires_clinical_referral_count > 0 && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            padding: "20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            backgroundColor: "var(--color-danger-bg)",
            color: "var(--text-primary)"
          }}>
            <ShieldAlert size={28} style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h4 style={{ fontWeight: "700", color: "var(--color-danger)", fontSize: "15px", marginBottom: "4px" }}>
                Atención Médica / Clínica Requerida
              </h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Se detectaron <strong>{stats.requires_clinical_referral_count} colaborador(es)</strong> que reportaron acontecimientos traumáticos severos (ATS) y requieren valoración clínica formal. El sistema ha generado de forma confidencial las tareas de intervención individuales en tu <strong>Plan de Acción</strong> para darles seguimiento inmediato.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
