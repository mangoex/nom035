// frontend/src/pages/CompanyTrainings.jsx
import React, { useEffect, useState } from "react";
import { BookOpen, RefreshCw, AlertCircle, Clock, CheckCircle, BarChart2 } from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function CompanyTrainings() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTrainings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/company/consultant-trainings");
      setTrainings(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las capacitaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <BookOpen size={28} style={{ color: "var(--color-primary)" }} />
              Catálogo de Capacitaciones
            </h1>
            <p className="page-subtitle">Consulta los cursos y capacitaciones ofrecidas por tu consultor asignado.</p>
          </div>
          <ThemeToggle />
        </header>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", fontWeight: "500", marginTop: "16px" }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px", color: "var(--text-secondary)" }}>
            <RefreshCw className="animate-spin" size={32} />
            <span style={{ marginLeft: "12px", fontWeight: "500" }}>Cargando catálogo...</span>
          </div>
        ) : trainings.length === 0 ? (
          <div className="glass-card animate-slide-up" style={{ padding: "60px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginTop: "24px" }}>
            <BookOpen size={48} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>No hay capacitaciones disponibles</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "400px", lineHeight: "1.6" }}>
              Tu consultor aún no ha registrado capacitaciones, o no cuentas con un consultor asignado. Contacta a tu administrador para más información.
            </p>
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "20px", 
            marginTop: "24px" 
          }}>
            {trainings.map((training, i) => (
              <div 
                key={i} 
                className="glass-card animate-slide-up" 
                style={{ 
                  animationDelay: `${i * 0.05}s`, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "12px",
                  borderTop: "4px solid var(--color-primary)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ 
                    fontSize: "11px", 
                    fontWeight: "600", 
                    color: "var(--color-primary)", 
                    backgroundColor: "rgba(99, 102, 241, 0.1)", 
                    padding: "4px 8px", 
                    borderRadius: "4px",
                    textTransform: "uppercase"
                  }}>
                    {training.codigo}
                  </span>
                  <CheckCircle size={16} style={{ color: "var(--color-success)" }} />
                </div>
                
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.4" }}>
                  {training.nombre}
                </h3>
                
                <div style={{ 
                  marginTop: "auto", 
                  paddingTop: "16px", 
                  borderTop: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  gap: "6px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={16} />
                    <span><strong>{training.horas}</strong> horas</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "12px" }}>
                    <BarChart2 size={16} />
                    <span>Nivel <strong>{training.nivel || 1}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
