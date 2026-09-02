// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import api from "../utils/api";
import ThemeToggle from "../components/ThemeToggle";
import AuthPrivacyLink from "../components/AuthPrivacyLink";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password recovery states
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");

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

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoverySuccess("");
    setRecoveryLoading(true);

    try {
      const res = await api.post("/api/auth/forgot-password", { email: recoveryEmail });
      setRecoverySuccess(
        res.data?.message ||
        "Si el correo está registrado, se ha enviado una contraseña temporal a su bandeja de entrada."
      );
      setEmail(recoveryEmail);
    } catch (err) {
      console.error(err);
      setRecoveryError(
        err.response?.data?.detail ||
        "Error al procesar la solicitud. Intente más tarde."
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
      padding: "20px",
      flexDirection: "column",
      gap: "18px"
    }}>
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <ThemeToggle />
      </div>

      <div className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: "420px", padding: "40px" }}>
        {!showRecovery ? (
          <>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Contraseña</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecovery(true);
                      setRecoveryEmail(email || "");
                      setRecoverySuccess("");
                      setRecoveryError("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "var(--color-primary)",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "var(--text-muted)" }} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: "42px", paddingRight: "42px" }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px"
                    }}
                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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
          </>
        ) : (
          <div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <KeyRound size={30} style={{ color: "var(--color-primary)" }} />
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: "800", textAlign: "center" }}>Recuperar Contraseña</h1>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", lineHeight: "1.5" }}>
                Ingresa el correo vinculado a tu cuenta y te enviaremos una contraseña temporal
              </p>
            </div>

            {recoveryError && (
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
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  color: "var(--color-success)",
                  fontSize: "13px",
                  lineHeight: "1.5"
                }}>
                  <CheckCircle2 size={22} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
                      ¡Correo Enviado!
                    </strong>
                    <span>{recoverySuccess}</span>
                    <p style={{ margin: "8px 0 0 0", color: "var(--text-secondary)", fontSize: "12px" }}>
                      Usa la contraseña temporal para ingresar y luego cámbiala en tu perfil.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoverySuccess("");
                  }}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px" }}
                >
                  Regresar e Iniciar Sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="recoveryEmail">Correo Electrónico Registrado</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "var(--text-muted)" }} />
                    <input
                      id="recoveryEmail"
                      type="email"
                      required
                      placeholder="ejemplo@empresa.com"
                      className="form-input"
                      style={{ paddingLeft: "42px" }}
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px", marginTop: "6px" }}
                >
                  {recoveryLoading ? "Enviando correo..." : "Enviar Contraseña Temporal"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoveryError("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "8px",
                    marginTop: "4px"
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Volver al inicio de sesión</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
      <AuthPrivacyLink />
    </div>
  );
}
