// frontend/src/pages/ConsultantCompanies.jsx
import React, { useEffect, useState } from "react";
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle, 
  RefreshCw,
  FileText
} from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function ConsultantCompanies() {
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
    employee_count: 0,
    sector: ""
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchCompanies = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/consultant/companies");
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las empresas de consultoría.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setFormData({
      name: "",
      rfc: "",
      employee_count: 0,
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
    if (!window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente a la empresa "${name}"? Se borrarán todos sus resultados de encuestas.`)) {
      return;
    }
    try {
      await api.delete(`/api/consultant/companies/${id}`);
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

    // Basic Validation
    if (formData.employee_count <= 0) {
      setModalError("La cantidad de empleados debe ser mayor a 0.");
      setSubmitLoading(false);
      return;
    }

    try {
      if (editingCompany) {
        // Edit flow
        const res = await api.put(`/api/consultant/companies/${editingCompany.id}`, formData);
        setCompanies(companies.map(c => c.id === editingCompany.id ? res.data : c));
      } else {
        // Add flow
        const res = await api.post("/api/consultant/companies", formData);
        setCompanies([res.data, ...companies]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.detail || "Ocurrió un error al guardar la empresa.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.rfc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content animate-fade-in">
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Empresas de Consultoría</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Registra y gestiona las empresas a las que brindas consultoría para la NOM-035
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button 
              onClick={handleOpenAdd}
              className="btn btn-primary" 
              style={{ display: "flex", gap: "6px", alignItems: "center" }}
            >
              <Plus size={18} />
              Agregar Empresa
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

        {/* Filter and Search Bar */}
        <div className="glass-card" style={{ padding: "16px", marginBottom: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar empresa por nombre o RFC..."
              className="form-input"
              style={{ paddingLeft: "40px", width: "100%" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchCompanies} 
            disabled={loading}
            className="btn btn-secondary" 
            style={{ display: "flex", gap: "6px", alignItems: "center", height: "42px" }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Recargar
          </button>
        </div>

        {/* Table of Companies */}
        <div className="glass-card animate-slide-up">
          {loading && companies.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Cargando empresas...</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nombre de la Empresa</th>
                    <th>RFC</th>
                    <th>Colaboradores</th>
                    <th>Guía Aplicable</th>
                    <th>Fecha Registro</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No se encontraron empresas registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Building size={18} style={{ color: "var(--color-primary)" }} />
                            </div>
                            <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{c.name}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "600" }}>{c.rfc}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: "700" }}>{c.employee_count}</span> colaboradores
                        </td>
                        <td>
                          <span className={`badge ${c.active_guide === 'GUIA_I' ? 'badge-alto' : c.active_guide === 'GUIA_II' ? 'badge-bajo' : 'badge-medio'}`}>
                            {c.active_guide}
                          </span>
                        </td>
                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 10px", fontSize: "12px", display: "inline-flex", gap: "4px", alignItems: "center" }}
                            >
                              <Edit size={14} />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, c.name)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 10px", fontSize: "12px", display: "inline-flex", gap: "4px", alignItems: "center", color: "var(--color-danger)" }}
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
          )}
        </div>

        {/* MODAL: ADD / EDIT COMPANY */}
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
                  <label className="form-label" htmlFor="c_name">Razón Social o Nombre Comercial</label>
                  <input
                    id="c_name"
                    type="text"
                    required
                    placeholder="ej. Servicios Industriales S.A."
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="c_rfc">RFC de la Empresa</label>
                  <input
                    id="c_rfc"
                    type="text"
                    required
                    placeholder="12 o 13 caracteres alfanuméricos"
                    className="form-input"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="c_emp_count">Número Estimado de Colaboradores</label>
                  <input
                    id="c_emp_count"
                    type="number"
                    required
                    placeholder="Cantidad de trabajadores"
                    className="form-input"
                    value={formData.employee_count}
                    onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 })}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    * Esto determinará automáticamente el tipo de guía NOM-035 aplicable.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="c_sector">Giro Comercial o Sector</label>
                  <input
                    id="c_sector"
                    type="text"
                    placeholder="ej. Manufactura, Tecnología, Comercio"
                    className="form-input"
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
