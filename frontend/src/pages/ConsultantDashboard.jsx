// frontend/src/pages/ConsultantDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Database,
  RefreshCw,
  Eye,
  Download
} from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function ConsultantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        api.get("/api/consultant/stats"),
        api.get("/api/consultant/survey-sessions")
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
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

  const handleDownloadExcel = async (session) => {
    try {
      const res = await api.get(`/api/consultant/survey-sessions/${session.id}/export-excel`, {
        responseType: "blob"
      });
      const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resultados_${session.company_name}_${session.guide_type}_${session.id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "No se pudo descargar el archivo Excel.");
    }
  };

  const getSessionStatus = (session) => {
    if (!session.is_active) return { label: "Desactivada", color: "var(--text-muted)" };
    if (!session.fecha_fin) return { label: "Activa", color: "var(--color-success)" };
    const today = new Date().setHours(0, 0, 0, 0);
    const limitDate = new Date(session.fecha_fin).getTime();
    if (today > limitDate) return { label: "Vencida", color: "var(--color-danger)" };
    return { label: "Activa", color: "var(--color-success)" };
  };

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

        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Encuestas autorizadas por empresas</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px", marginBottom: 0 }}>
              Solo se muestran encuestas Guía II y III autorizadas por la empresa.
            </p>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Tipo Guía</th>
                  <th>Creador</th>
                  <th>Vigencia</th>
                  <th>Respuestas</th>
                  <th>Estatus</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Aún no hay encuestas autorizadas para consultar resultados.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => {
                    const status = getSessionStatus(session);
                    return (
                      <tr key={session.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "34px", height: "34px", borderRadius: "8px", backgroundColor: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Building size={17} style={{ color: "var(--color-primary)" }} />
                            </div>
                            <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{session.company_name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${session.guide_type === 'GUIA_II' ? 'badge-bajo' : 'badge-medio'}`}>
                            {session.guide_type}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{session.creador || "No especificado"}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Ced: {session.cedula_creador || "N/A"}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px" }}>Inicio: {new Date(session.created_at).toLocaleDateString()}</div>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                            Fin: {session.fecha_fin ? new Date(session.fecha_fin).toLocaleDateString() : "N/A"}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: "700", color: "var(--color-primary)" }}>
                            {session.response_count ?? 0}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: "600", color: status.color, fontSize: "13px" }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                            <button
                              onClick={() => navigate(`/consultant/results?session_id=${session.id}`)}
                              className="btn btn-primary"
                              style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", gap: "6px", alignItems: "center" }}
                            >
                              <Eye size={14} />
                              Ver Resultados
                            </button>
                            <button
                              onClick={() => handleDownloadExcel(session)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", gap: "6px", alignItems: "center" }}
                            >
                              <Download size={14} />
                              Descargar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
