// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building, Lock, Mail, AlertCircle } from "lucide-react";
import api from "../utils/api";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Error de conexión. Intente más tarde."
      );
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
      padding: "20px"
    }}>
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <ThemeToggle />
      </div>

      <div className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: "420px", padding: "40px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Building size={32} style={{ color: "var(--color-primary)" }} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", textAlign: "center" }}>NOM-035</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center" }}>
            Ingresa para gestionar el cumplimiento en tu empresa
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "var(--text-muted)" }} />
              <input
                id="email"
                type="email"
                required
                placeholder="ejemplo@empresa.com"
                className="form-input"
                style={{ paddingLeft: "42px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: "42px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "12px", marginTop: "8px" }}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "14px" }}>
          <span style={{ color: "var(--text-secondary)" }}>¿No tienes una cuenta? </span>
          <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: "600", textDecoration: "none" }}>
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
