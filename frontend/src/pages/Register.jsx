// frontend/src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building, Lock, Mail, User, ShieldCheck, HelpCircle, AlertCircle } from "lucide-react";
import api from "../utils/api";
import ThemeToggle from "../components/ThemeToggle";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    rfc: "",
    employee_count: 1,
    sector: "Tecnología"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === "employee_count" ? Math.max(1, parseInt(value) || 0) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/register", formData);
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          const msg = detail.map(d => {
            const field = d.loc && d.loc.length > 1 ? d.loc[d.loc.length - 1] : "";
            return `${field ? field + ": " : ""}${d.msg}`;
          }).join(" | ");
          setError(msg);
        } else {
          setError(detail);
        }
      } else {
        setError("Error en el registro. Verifique sus datos.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
      padding: "40px 20px"
    }}>
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <ThemeToggle />
      </div>

      <div className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: "560px", padding: "40px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ShieldCheck size={32} style={{ color: "var(--color-success)" }} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", textAlign: "center" }}>Registro e Onboarding SaaS</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center" }}>
            Configura tu empresa para determinar automáticamente la encuesta NOM-035 correspondiente
          </p>
        </div>

        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--color-danger-bg)",
            color: "var(--color-danger)",
            fontSize: "13px",
            fontWeight: "500",
            marginBottom: "20px"
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
            Datos del Administrador
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Nombre Completo</label>
              <div style={{ position: "relative" }}>
                <User size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "var(--text-muted)" }} />
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Juan Pérez"
                  className="form-input"
                  style={{ paddingLeft: "42px" }}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Correo Electrónico</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "var(--text-muted)" }} />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="juan.perez@empresa.com"
                  className="form-input"
                  style={{ paddingLeft: "42px" }}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "var(--text-muted)" }} />
              <input
                id="password"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                className="form-input"
                style={{ paddingLeft: "42px" }}
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3 style={{ fontSize: "15px", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", marginTop: "10px" }}>
            Datos de la Empresa
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="company_name">Nombre de la Empresa</label>
              <div style={{ position: "relative" }}>
                <Building size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "var(--text-muted)" }} />
                <input
                  id="company_name"
                  type="text"
                  required
                  placeholder="Empresa S.A. de C.V."
                  className="form-input"
                  style={{ paddingLeft: "42px" }}
                  value={formData.company_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rfc">RFC</label>
              <input
                id="rfc"
                type="text"
                required
                placeholder="RFC de 12 o 13 posiciones"
                className="form-input"
                value={formData.rfc}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="employee_count">Número de Empleados</label>
              <input
                id="employee_count"
                type="number"
                required
                min="1"
                className="form-input"
                value={formData.employee_count}
                onChange={handleChange}
              />
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "flex", gap: "4px", alignItems: "center" }}>
                <HelpCircle size={12} />
                <span>
                  {formData.employee_count <= 15 ? "Se aplicará Guía I (Acontecimientos)" : 
                   formData.employee_count <= 50 ? "Se aplicará Guía II (Hasta 50 colaboradores)" : 
                   "Se aplicará Guía III (Más de 50 colaboradores)"}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sector">Sector Industrial</label>
              <select
                id="sector"
                className="form-input"
                value={formData.sector}
                onChange={handleChange}
                style={{ height: "42px" }}
              >
                <option value="Tecnología">Tecnología</option>
                <option value="Servicios">Servicios</option>
                <option value="Manufactura">Manufactura</option>
                <option value="Educación">Educación</option>
                <option value="Salud">Salud</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "12px", marginTop: "12px" }}>
            {loading ? "Creando cuenta..." : "Crear Cuenta y Comenzar"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "14px" }}>
          <span style={{ color: "var(--text-secondary)" }}>¿Ya tienes una cuenta? </span>
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: "600", textDecoration: "none" }}>
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
