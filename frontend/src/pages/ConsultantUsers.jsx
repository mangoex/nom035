// frontend/src/pages/ConsultantUsers.jsx
import React, { useEffect, useState } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle, 
  RefreshCw,
  Mail,
  Lock,
  Building
} from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function ConsultantUsers() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company_id: ""
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, companiesRes] = await Promise.all([
        api.get("/api/consultant/users"),
        api.get("/api/consultant/companies")
      ]);
      setUsers(usersRes.data);
      setCompanies(companiesRes.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los datos de usuarios o empresas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    if (companies.length === 0) {
      alert("⚠️ Primero debes registrar al menos una empresa antes de crear usuarios.");
      return;
    }
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      company_id: companies[0]?.id || ""
    });
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: "",
      company_id: u.company_id || ""
    });
    setModalError("");
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente al usuario "${name}"? El cliente ya no podrá acceder al sistema.`)) {
      return;
    }
    try {
      await api.delete(`/api/consultant/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error al intentar eliminar el usuario.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setModalError("");

    if (!formData.company_id) {
      setModalError("Debes seleccionar una empresa.");
      setSubmitLoading(false);
      return;
    }

    if (!editingUser && !formData.password) {
      setModalError("La contraseña es requerida para nuevos usuarios.");
      setSubmitLoading(false);
      return;
    }

    try {
      if (editingUser) {
        // Edit flow
        const payload = {
          name: formData.name,
          email: formData.email,
          company_id: parseInt(formData.company_id)
        };
        if (formData.password.trim() !== "") {
          payload.password = formData.password;
        }
        const res = await api.put(`/api/consultant/users/${editingUser.id}`, payload);
        setUsers(users.map(u => u.id === editingUser.id ? res.data : u));
      } else {
        // Add flow
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          company_id: parseInt(formData.company_id)
        };
        const res = await api.post("/api/consultant/users", payload);
        setUsers([res.data, ...users]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.detail || "Ocurrió un error al guardar el usuario.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.company_name && u.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content animate-fade-in">
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Usuarios de Empresas</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Crea y gestiona los accesos de tus clientes para sus respectivos páneles de la NOM-035.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <ThemeToggle />
            <button 
              onClick={handleOpenAdd}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Plus size={18} />
              Crear Usuario
            </button>
          </div>
        </header>

        {error && (
          <div style={{ 
            backgroundColor: "rgba(239, 68, 68, 0.1)", 
            border: "1px solid var(--color-danger)", 
            color: "var(--color-danger)", 
            padding: "12px 16px", 
            borderRadius: "var(--radius-md)", 
            display: "flex", 
            alignItems: "center", 
            gap: "10px",
            marginBottom: "20px"
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Action / Search Bar */}
        <div className="glass-card" style={{ display: "flex", gap: "16px", padding: "16px", marginBottom: "24px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "11px", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o empresa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "38px" }}
            />
          </div>
          <button 
            onClick={fetchData}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "8px", height: "42px" }}
            title="Recargar datos"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Users Table */}
        <div className="glass-card" style={{ overflowX: "auto", padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              Cargando usuarios...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              No se encontraron usuarios registrados.
            </div>
          ) : (
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "16px 20px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "13px" }}>Nombre</th>
                  <th style={{ padding: "16px 20px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "13px" }}>Correo / Usuario</th>
                  <th style={{ padding: "16px 20px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "13px" }}>Empresa Asignada</th>
                  <th style={{ padding: "16px 20px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "13px" }}>Fecha de Registro</th>
                  <th style={{ padding: "16px 20px", color: "var(--text-secondary)", fontWeight: "600", fontSize: "13px", textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td style={{ padding: "16px 20px", fontWeight: "600" }}>{u.name}</td>
                    <td style={{ padding: "16px 20px", color: "var(--text-secondary)" }}>{u.email}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <span className="badge" style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--color-primary)" }}>
                        {u.company_name || "Desconocida"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "13px" }}>
                      {new Date(u.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button 
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", minWidth: "auto", display: "inline-flex", alignItems: "center" }}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id, u.name)}
                          className="btn btn-secondary"
                          style={{ padding: "6px 10px", minWidth: "auto", color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Agregar/Editar Usuario */}
        {showModal && (
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
              maxWidth: "500px",
              backgroundColor: "var(--bg-secondary)",
              padding: "24px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>
                  {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div style={{ 
                  backgroundColor: "rgba(239, 68, 68, 0.1)", 
                  border: "1px solid var(--color-danger)", 
                  color: "var(--color-danger)", 
                  padding: "10px 12px", 
                  borderRadius: "var(--radius-sm)", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  marginBottom: "16px",
                  fontSize: "13px"
                }}>
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="userName">Nombre Completo del Cliente</label>
                  <div style={{ position: "relative" }}>
                    <Users size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                    <input
                      id="userName"
                      type="text"
                      required
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userEmail">Correo Electrónico (Servirá para iniciar sesión)</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                    <input
                      id="userEmail"
                      type="email"
                      required
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userCompany">Empresa Asignada</label>
                  <div style={{ position: "relative" }}>
                    <Building size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)", zIndex: 1 }} />
                    <select
                      id="userCompany"
                      required
                      className="form-input"
                      style={{ paddingLeft: "36px", appearance: "auto" }}
                      value={formData.company_id}
                      onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="userPassword">
                    Contraseña {editingUser && "(Dejar vacío para no cambiar)"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                    <input
                      id="userPassword"
                      type="password"
                      required={!editingUser}
                      placeholder={editingUser ? "Nueva contraseña..." : "Contraseña..."}
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="btn btn-primary"
                  >
                    {submitLoading ? "Guardando..." : "Guardar Usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
