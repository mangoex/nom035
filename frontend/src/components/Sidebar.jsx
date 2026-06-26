// frontend/src/components/Sidebar.jsx
import React from "react";
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

  const navItems = isSuperadmin ? [
    { path: "/superadmin/companies", label: "Empresas", icon: <Building size={20} /> },
    { path: "/superadmin/consultants", label: "Consultores", icon: <Users size={20} /> },
  ] : isConsultant ? [
    { path: "/consultant/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/consultant/companies", label: "Empresas", icon: <Building size={20} /> },
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

      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
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
    </aside>
  );
}
