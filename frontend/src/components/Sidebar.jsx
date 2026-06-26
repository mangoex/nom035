// frontend/src/components/Sidebar.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Kanban, 
  FileText, 
  LogOut,
  Building,
  Settings,
  Users
} from "lucide-react";
import api from "../utils/api";

export default function Sidebar({ company }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (err) {
      console.error("Error logging out", err);
      // Fallback
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperadmin = user?.role === "superadmin";
  const isConsultant = user?.role === "consultor";

  // Profile Modal State
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileCedula, setProfileCedula] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const openProfileModal = () => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setProfilePassword("");
    setProfileCedula(user?.cedula_profesional || "");
    setIsProfileModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await api.put("/api/auth/me", {
        name: profileName,
        email: profileEmail,
        password: profilePassword || null,
        cedula_profesional: profileCedula || null
      });
      localStorage.setItem("user", JSON.stringify(res.data));
      alert("Perfil actualizado correctamente.");
      setIsProfileModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error al actualizar el perfil.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const navItems = isSuperadmin ? [
    { path: "/superadmin/companies", label: "Empresas", icon: <Building size={20} /> },
    { path: "/superadmin/consultants", label: "Consultores", icon: <Users size={20} /> },
  ] : isConsultant ? [
    { path: "/consultant/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/consultant/companies", label: "Empresas", icon: <Building size={20} /> },
    { path: "/consultant/users", label: "Usuarios", icon: <Users size={20} /> },
  ] : [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/intake", label: "Captura de Datos", icon: <ClipboardList size={20} /> },
    { path: "/action-plan", label: "Plan de Acción", icon: <Kanban size={20} /> },
    { path: "/documents", label: "Gestión Documental", icon: <FileText size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        {isSuperadmin ? (
          <>
            <Building size={28} style={{ color: "var(--color-primary)" }} />
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                NOM-035 Admin
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>
                Panel del Sistema
              </span>
            </div>
          </>
        ) : isConsultant ? (
          <>
            <Building size={28} style={{ color: "var(--color-primary)" }} />
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                NOM-035 Consultor
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>
                Panel de Consultoría
              </span>
            </div>
          </>
        ) : (
          <>
            {company?.logo_url ? (
              <img 
                src={`${api.defaults.baseURL || ""}${company.logo_url}`} 
                alt="Logo Empresa" 
                style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px", backgroundColor: "#fff", padding: "2px" }}
              />
            ) : (
              <Building size={28} style={{ color: "var(--color-success)" }} />
            )}
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "160px" }}>
                {company?.name || "Mi Empresa"}
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>
                {company?.active_guide === "GUIA_I" ? "Guía I (Hasta 15 emp)" : 
                 company?.active_guide === "GUIA_II" ? "Guía II (16-50 emp)" : 
                 "Guía III (>50 emp)"}
              </span>
            </div>
          </>
        )}
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "var(--radius-sm)",
                color: isActive ? "#ffffff" : "#94a3b8",
                backgroundColor: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                borderLeft: isActive ? "4px solid var(--color-primary)" : "4px solid transparent",
                textDecoration: "none",
                fontWeight: isActive ? "600" : "500",
                fontSize: "14px",
                transition: "all 0.2s ease"
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ display: "flex", flexDirection: "column", gap: "5px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px", marginTop: "16px" }}>
        {user && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 12px 12px 12px",
            marginBottom: "8px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(99, 102, 241, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)",
              fontWeight: "700",
              fontSize: "14px",
              flexShrink: 0
            }}>
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div style={{ overflow: "hidden", display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={user.name}>
                {user.name}
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={user.email}>
                {user.email}
              </span>
            </div>
            <button
              onClick={openProfileModal}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; }}
              onMouseOut={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.backgroundColor = "transparent"; }}
              title="Editar Perfil"
            >
              <Settings size={16} />
            </button>
          </div>
        )}
        {!isSuperadmin && !isConsultant && (
          <Link
            to="/settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              width: "100%",
              borderRadius: "var(--radius-sm)",
              color: "#cbd5e1",
              backgroundColor: "transparent",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <Settings size={20} />
            Configuración
          </Link>
        )}
        
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            width: "100%",
            borderRadius: "var(--radius-sm)",
            color: "#f87171",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            textAlign: "left",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(248, 113, 113, 0.1)"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
      {isProfileModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="glass-card" style={{
            width: "100%",
            maxWidth: "450px",
            backgroundColor: "var(--bg-secondary)",
            padding: "24px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)" }}>
              Editar Perfil
            </h3>
            <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: "6px" }}>Nombre</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: "6px" }}>Correo electrónico</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>
              {user?.role === "consultor" && (
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: "6px" }}>Cédula Profesional</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileCedula}
                    onChange={(e) => setProfileCedula(e.target.value)}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: "6px" }}>Nueva Contraseña (Opcional)</label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para no cambiar"
                  className="form-input"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="btn btn-primary"
                  style={{ padding: "8px 16px" }}
                >
                  {updatingProfile ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
