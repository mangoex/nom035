// frontend/src/pages/ConsultantSubConsultants.jsx
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
  Award,
  Database,
  Crown,
  CheckCircle2,
  XCircle,
  Coins
} from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function ConsultantSubConsultants() {
  const [subConsultants, setSubConsultants] = useState([]);
  const [seniorStats, setSeniorStats] = useState({ creditos_totales: 0, creditos_disponibles: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cedula_profesional: "",
    creditos: 0
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [subsRes, statsRes] = await Promise.all([
        api.get("/api/consultant/sub-consultants"),
        api.get("/api/consultant/stats")
      ]);
      setSubConsultants(subsRes.data);
      setSeniorStats(statsRes.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los datos de consultores subordinados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingSub(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      cedula_profesional: "",
      creditos: 0
    });
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      email: sub.email,
      password: "",
      cedula_profesional: sub.cedula_profesional || "",
      creditos: sub.creditos || 0
    });
    setModalError("");
    setShowModal(true);
  };

  const handleDelete = async (id, name, credits) => {
    const confirmMsg = `⚠️ ¿Estás seguro de que deseas eliminar al consultor "${name}"?\n\nLos ${credits || 0} créditos no utilizados serán reintegrados a tu bolsa de créditos disponibles.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    try {
      await api.delete(`/api/consultant/sub-consultants/${id}`);
      setSubConsultants(subConsultants.filter(s => s.id !== id));
      // Refresh stats for updated credits pool
      const statsRes = await api.get("/api/consultant/stats");
      setSeniorStats(statsRes.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error al intentar eliminar el consultor subordinado.");
    }
  };

  const handleToggleActive = async (sub) => {
    const nextActive = !sub.is_active;
    setSubConsultants(subConsultants.map(s => s.id === sub.id ? { ...s, is_active: nextActive } : s));
    try {
      const res = await api.put(`/api/consultant/sub-consultants/${sub.id}/toggle-active`);
      setSubConsultants(prev => prev.map(s => s.id === sub.id ? res.data : s));
    } catch (err) {
      console.error(err);
      setSubConsultants(prev => prev.map(s => s.id === sub.id ? { ...s, is_active: sub.is_active } : s));
      alert(err.response?.data?.detail || "No se pudo actualizar el acceso del consultor.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setModalError("");

    if (!editingSub && !formData.password) {
      setModalError("La contraseña es requerida para dar de alta al consultor.");
      setSubmitLoading(false);
      return;
    }

    try {
      if (editingSub) {
        const payload = { ...formData };
        if (!payload.password) {
          delete payload.password;
        }
        const res = await api.put(`/api/consultant/sub-consultants/${editingSub.id}`, payload);
        setSubConsultants(subConsultants.map(s => s.id === editingSub.id ? res.data : s));
      } else {
        const res = await api.post("/api/consultant/sub-consultants", formData);
        setSubConsultants([res.data, ...subConsultants]);
      }

      // Refresh credits balance
      const statsRes = await api.get("/api/consultant/stats");
      setSeniorStats(statsRes.data);

      setShowModal(false);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.detail || "Error al procesar la solicitud.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalAssignedCredits = subConsultants.reduce((acc, curr) => acc + (curr.creditos || 0), 0);

  const filteredSubs = subConsultants.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.cedula_profesional && s.cedula_profesional.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Crown size={28} style={{ color: "#8b5cf6" }} />
              Gestión de Consultores Asignados
            </h1>
            <p className="page-subtitle">
              Como Consultor Senior, puedes dar de alta y coordinar a los consultores de tu equipo, asignándoles créditos de tu bolsa.
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Overview cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(139, 92, 246, 0.15)",
              color: "#8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Coins size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                Tus Créditos Disponibles
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)" }}>
                {seniorStats.creditos_disponibles ?? 0}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Database size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                Créditos Asignados al Equipo
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)" }}>
                {totalAssignedCredits}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "var(--color-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
                Total de Consultores a Cargo
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)" }}>
                {subConsultants.length}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", fontWeight: "500", marginBottom: "16px" }}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={fetchData} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)" }}>
              <RefreshCw size={18} />
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
          {/* Search Bar */}
          <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "400px" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "11px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar consultor por nombre, correo o cédula..."
              className="form-input"
              style={{ paddingLeft: "38px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" }}>
            <Plus size={18} />
            Registrar Consultor
          </button>
        </div>

        {/* Table section */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px", color: "var(--text-secondary)" }}>
            <RefreshCw className="animate-spin" size={32} />
            <span style={{ marginLeft: "12px", fontWeight: "500" }}>Cargando listado de consultores...</span>
          </div>
        ) : (
          <div className="glass-card animate-slide-up" style={{ padding: "0px", overflow: "hidden" }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nombre del Consultor</th>
                    <th>Correo Electrónico</th>
                    <th>Cédula Profesional</th>
                    <th>Créditos Asignados</th>
                    <th>Acceso</th>
                    <th>Fecha de Alta</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No tienes consultores registrados bajo tu coordinación.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{s.name}</td>
                        <td>{s.email}</td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "500" }}>
                            <Award size={16} style={{ color: "var(--color-info)" }} />
                            {s.cedula_profesional || "No registrada"}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Coins size={14} />
                            {s.creditos ?? 0}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(s)}
                            title={s.is_active ? "Desactivar consultor" : "Activar consultor"}
                            aria-label={s.is_active ? "Desactivar consultor" : "Activar consultor"}
                            style={{
                              width: "44px",
                              height: "24px",
                              borderRadius: "999px",
                              border: "none",
                              backgroundColor: s.is_active ? "var(--color-success)" : "var(--border-color)",
                              cursor: "pointer",
                              position: "relative",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                top: "3px",
                                left: s.is_active ? "23px" : "3px",
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                backgroundColor: "#ffffff",
                                transition: "all 0.2s ease",
                                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.25)"
                              }}
                            />
                          </button>
                        </td>
                        <td>{new Date(s.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="btn btn-secondary"
                              title="Editar"
                              aria-label="Editar"
                              style={{ padding: "7px", width: "32px", height: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.name, s.creditos)}
                              className="btn btn-danger"
                              title="Eliminar"
                              aria-label="Eliminar"
                              style={{ padding: "7px", width: "32px", height: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create/Edit Sub-Consultant */}
        {showModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            <div className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: "540px", position: "relative" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Crown size={20} style={{ color: "#8b5cf6" }} />
                {editingSub ? "Editar Consultor Asignado" : "Registrar Nuevo Consultor"}
              </h2>

              {modalError && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: "13px", fontWeight: "500", marginBottom: "16px" }}>
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Lic. Laura Sánchez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="laura@consultoria.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Contraseña {editingSub && <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(dejar en blanco para no cambiar)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingSub}
                    className="form-input"
                    placeholder={editingSub ? "••••••••" : "Contraseña de acceso"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cédula Profesional (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. 98765432"
                    value={formData.cedula_profesional}
                    onChange={(e) => setFormData({ ...formData, cedula_profesional: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Asignación de Créditos (Disponibles en tu cuenta: <strong>{seniorStats.creditos_disponibles ?? 0}</strong>)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={formData.creditos}
                    onChange={(e) => setFormData({ ...formData, creditos: parseInt(e.target.value) || 0 })}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    * Los créditos asignados se descontarán automáticamente de tu saldo disponible.
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitLoading} className="btn btn-primary" style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" }}>
                    {submitLoading ? "Guardando..." : "Guardar Consultor"}
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
