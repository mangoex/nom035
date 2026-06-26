// frontend/src/pages/SuperadminCompanies.jsx
import React, { useEffect, useState } from "react";
import { Building, Plus, Search, Edit, Trash2, X, AlertCircle, RefreshCw } from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function SuperadminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    rfc: "",
    employee_count: 50,
    sector: ""
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/superadmin/companies");
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las empresas del servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setFormData({
      name: "",
      rfc: "",
      employee_count: 50,
      sector: ""
    });
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      rfc: company.rfc,
      employee_count: company.employee_count,
      sector: company.sector || ""
    });
    setModalError("");
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente la empresa "${name}"? Se borrarán todas sus encuestas, usuarios y planes de acción.`)) {
      return;
    }
    try {
      await api.delete(`/api/superadmin/companies/${id}`);
      setCompanies(companies.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error al intentar eliminar la empresa.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setModalError("");
    try {
      if (editingCompany) {
        // Update
        const res = await api.put(`/api/superadmin/companies/${editingCompany.id}`, formData);
        setCompanies(companies.map(c => c.id === editingCompany.id ? res.data : c));
      } else {
        // Create
        const res = await api.post("/api/superadmin/companies", formData);
        setCompanies([res.data, ...companies]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.detail || "Error al procesar la solicitud.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rfc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.sector && c.sector.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Building size={28} style={{ color: "var(--color-primary)" }} />
              Gestión de Empresas
            </h1>
            <p className="page-subtitle">Monitorea, edita y registra las empresas de la plataforma.</p>
          </div>
          <ThemeToggle />
        </header>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", fontWeight: "500" }}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={fetchCompanies} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)" }}>
              <RefreshCw size={18} />
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "center", marginTop: "16px" }}>
          {/* Search Bar */}
          <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "400px" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "11px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar por nombre, RFC o sector..."
              className="form-input"
              style={{ paddingLeft: "38px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={18} />
            Registrar Empresa
          </button>
        </div>

        {/* Table/Card section */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px", color: "var(--text-secondary)" }}>
            <RefreshCw className="animate-spin" size={32} />
            <span style={{ marginLeft: "12px", fontWeight: "500" }}>Cargando listado...</span>
          </div>
        ) : (
          <div className="glass-card animate-slide-up" style={{ padding: "0px", overflow: "hidden" }}>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nombre / Razón Social</th>
                    <th>RFC</th>
                    <th>Colaboradores</th>
                    <th>Sector</th>
                    <th>Guía Asignada</th>
                    <th>Fecha Registro</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No se encontraron empresas registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{c.name}</td>
                        <td>{c.rfc}</td>
                        <td>{c.employee_count}</td>
                        <td>{c.sector || "No especificado"}</td>
                        <td>
                          <span className={`badge ${c.active_guide === 'GUIA_I' ? 'badge-nulo' : c.active_guide === 'GUIA_II' ? 'badge-bajo' : 'badge-alto'}`}>
                            {c.active_guide}
                          </span>
                        </td>
                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              <Edit size={14} />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, c.name)}
                              className="btn btn-danger"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              <Trash2 size={14} />
                              Eliminar
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

        {/* Modal: Create/Edit Company */}
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
            <div className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: "480px", position: "relative" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Building size={20} style={{ color: "var(--color-primary)" }} />
                {editingCompany ? "Editar Empresa" : "Registrar Nueva Empresa"}
              </h2>

              {modalError && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: "13px", fontWeight: "500", marginBottom: "16px" }}>
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="m_name">Nombre / Razón Social</label>
                  <input
                    id="m_name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Mi Empresa S.A. de C.V."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m_rfc">RFC</label>
                  <input
                    id="m_rfc"
                    type="text"
                    required
                    className="form-input"
                    placeholder="RFC de 12 o 13 caracteres"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m_employees">Número de Colaboradores</label>
                  <input
                    id="m_employees"
                    type="number"
                    required
                    min="1"
                    className="form-input"
                    placeholder="Ej. 65"
                    value={formData.employee_count}
                    onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 })}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    * El número de empleados determina la Guía de Riesgo (II o III) asignada según la NOM-035.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m_sector">Sector Industrial</label>
                  <input
                    id="m_sector"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Manufactura, Servicios, Tecnología"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitLoading} className="btn btn-primary">
                    {submitLoading ? "Guardando..." : "Guardar Empresa"}
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
