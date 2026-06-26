// frontend/src/pages/ConsultantDashboard.jsx
import React, { useEffect, useState } from "react";
import { 
  Building, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Database,
  RefreshCw
} from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function ConsultantDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/consultant/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las estadísticas del consultor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Cargando panel de consultor...</p>
      </div>
    );
  }

  const kpis = [
    {
      title: "Empresas Registradas",
      value: stats?.total_companies ?? 0,
      icon: <Building size={24} style={{ color: "var(--color-primary)" }} />,
      bgColor: "rgba(99, 102, 241, 0.1)",
      desc: "Empresas bajo tu consultoría"
    },
    {
      title: "Encuestas Generadas",
      value: stats?.total_sessions ?? 0,
      icon: <ClipboardList size={24} style={{ color: "var(--color-warning)" }} />,
      bgColor: "rgba(245, 158, 11, 0.1)",
      desc: "Ligas de encuestas activas/inactivas"
    },
    {
      title: "Encuestas Completadas",
      value: stats?.total_responses ?? 0,
      icon: <CheckCircle2 size={24} style={{ color: "var(--color-success)" }} />,
      bgColor: "rgba(16, 185, 129, 0.1)",
      desc: "Respuestas recibidas de empleados"
    },
    {
      title: "Encuestas Faltantes",
      value: stats?.total_missing ?? 0,
      icon: <AlertCircle size={24} style={{ color: "var(--color-danger)" }} />,
      bgColor: "rgba(239, 68, 68, 0.1)",
      desc: "Pendientes por responder"
    },
    {
      title: "Créditos Totales",
      value: stats?.creditos_totales ?? 0,
      icon: <Database size={24} style={{ color: "var(--color-primary)" }} />,
      bgColor: "rgba(99, 102, 241, 0.1)",
      desc: "Asignados por el Administrador"
    },
    {
      title: "Créditos Disponibles",
      value: stats?.creditos_disponibles ?? 0,
      icon: <Award size={24} style={{ color: "var(--color-success)" }} />,
      bgColor: "rgba(16, 185, 129, 0.1)",
      desc: "Disponibles para nuevas encuestas"
    }
  ];

  return (
    <div className="app-container">
      <Sidebar />
      
      <main className="main-content animate-fade-in">
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Panel de Consultoría</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Estadísticas de encuestas, créditos y empresas registradas
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button 
              onClick={fetchStats} 
              disabled={loading}
              className="btn btn-secondary" 
              style={{ display: "flex", gap: "6px", alignItems: "center" }}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
            <ThemeToggle />
          </div>
        </header>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", marginBottom: "20px" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          {kpis.map((kpi, idx) => (
            <div key={idx} className="glass-card animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                  {kpi.title}
                </span>
                <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", backgroundColor: kpi.bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {kpi.icon}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}>
                  {kpi.value}
                </h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", margin: 0 }}>
                  {kpi.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Welcome Section */}
        <div className="glass-card" style={{ padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <Building size={48} style={{ color: "var(--color-primary)" }} />
          <h2 style={{ fontSize: "20px", fontWeight: "700" }}>Gestión de Empresas y Encuestas</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "600px", lineHeight: "1.6", margin: 0 }}>
            Como consultor, puedes dar de alta las empresas de tus clientes desde la pestaña <strong>Empresas</strong>. Cada encuesta respondida por los colaboradores de tus empresas consumirá un crédito de tu saldo disponible.
          </p>
        </div>
      </main>
    </div>
  );
}
