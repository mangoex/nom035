// frontend/src/pages/SuperadminConsultants.jsx
import React, { useEffect, useState } from "react";
import { Users, Plus, Search, Edit, Trash2, X, AlertCircle, RefreshCw, Award, Database, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function SuperadminConsultants() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cedula_profesional: "",
    creditos: 0,
    capacitaciones: []
  });
  const [profileLogo, setProfileLogo] = useState(null);
  const [profileCedulaImage, setProfileCedulaImage] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [billingConsultant, setBillingConsultant] = useState(null);
  const [billingData, setBillingData] = useState({
    billing_paid: false,
    billing_due_date: "",
    billing_amount: 0,
    billing_history: []
  });
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");

  const fetchConsultants = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/superadmin/consultants");
      setConsultants(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los consultores del servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultants();
  }, []);

  const handleOpenAdd = () => {
    setEditingConsultant(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      cedula_profesional: "",
      creditos: 0,
      capacitaciones: []
    });
    setProfileLogo(null);
    setProfileCedulaImage(null);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (consultant) => {
    setEditingConsultant(consultant);
    setFormData({
      name: consultant.name,
      email: consultant.email,
      password: "", // Keep blank unless changing
      cedula_profesional: consultant.cedula_profesional || "",
      creditos: consultant.creditos || 0,
      capacitaciones: consultant.capacitaciones || []
    });
    setProfileLogo(null);
    setProfileCedulaImage(null);
    setModalError("");
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente al consultor "${name}"? Se revocará todo acceso a la plataforma.`)) {
      return;
    }
    try {
      await api.delete(`/api/superadmin/consultants/${id}`);
      setConsultants(consultants.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error al intentar eliminar el consultor.");
    }
  };

  const handleToggleActive = async (consultant) => {
    const nextActive = !consultant.is_active;
    setConsultants(consultants.map(c => c.id === consultant.id ? { ...c, is_active: nextActive } : c));
    try {
      const res = await api.put(`/api/superadmin/consultants/${consultant.id}`, { is_active: nextActive });
      setConsultants(prev => prev.map(c => c.id === consultant.id ? res.data : c));
    } catch (err) {
      console.error(err);
      setConsultants(prev => prev.map(c => c.id === consultant.id ? { ...c, is_active: consultant.is_active } : c));
      alert(err.response?.data?.detail || "No se pudo actualizar el acceso del consultor.");
    }
  };

  const handleOpenBilling = (consultant) => {
    setBillingConsultant(consultant);
    setBillingData({
      billing_paid: Boolean(consultant.billing_paid),
      billing_due_date: consultant.billing_due_date || "",
      billing_amount: consultant.billing_amount || 0,
      billing_history: consultant.billing_history || []
    });
    setBillingError("");
  };

  const handleAddPayment = () => {
    const today = new Date().toISOString().slice(0, 10);
    setBillingData({
      ...billingData,
      billing_history: [
        ...billingData.billing_history,
        { date: today, amount: billingData.billing_amount || 0, note: "" }
      ]
    });
  };

  const handleUpdatePayment = (index, field, value) => {
    const nextHistory = [...billingData.billing_history];
    nextHistory[index] = { ...nextHistory[index], [field]: value };
    setBillingData({ ...billingData, billing_history: nextHistory });
  };

  const handleRemovePayment = (index) => {
    setBillingData({
      ...billingData,
      billing_history: billingData.billing_history.filter((_, i) => i !== index)
    });
  };

  const handleBillingSubmit = async (e) => {
    e.preventDefault();
    if (!billingConsultant) return;
    setBillingLoading(true);
    setBillingError("");
    try {
      const payload = {
        billing_paid: billingData.billing_paid,
        billing_due_date: billingData.billing_due_date || null,
        billing_amount: parseInt(billingData.billing_amount) || 0,
        billing_history: billingData.billing_history.map((payment) => ({
          date: payment.date,
          amount: parseInt(payment.amount) || 0,
          note: payment.note || ""
        }))
      };
      const res = await api.put(`/api/superadmin/consultants/${billingConsultant.id}/billing`, payload);
      setConsultants(consultants.map(c => c.id === billingConsultant.id ? res.data : c));
      setBillingConsultant(null);
    } catch (err) {
      console.error(err);
      setBillingError(err.response?.data?.detail || "No se pudo guardar la información de billing.");
    } finally {
      setBillingLoading(false);
    }
  };

  const handleAddCapacitacion = () => {
    setFormData({
      ...formData,
      capacitaciones: [...formData.capacitaciones, { codigo: "", nombre: "", horas: 0, nivel: 1 }]
    });
  };

  const handleUpdateCapacitacion = (index, field, value) => {
    const newCap = [...formData.capacitaciones];
    newCap[index][field] = value;
    setFormData({ ...formData, capacitaciones: newCap });
  };

  const handleRemoveCapacitacion = (index) => {
    const newCap = formData.capacitaciones.filter((_, i) => i !== index);
    setFormData({ ...formData, capacitaciones: newCap });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setModalError("");
    
    // Validations
    if (!editingConsultant && !formData.password) {
      setModalError("La contraseña es requerida para nuevos consultores.");
      setSubmitLoading(false);
      return;
    }

    try {
      let savedConsultantId = null;

      if (editingConsultant) {
        // Edit flow
        const dataToSend = { ...formData };
        if (!dataToSend.password) {
          delete dataToSend.password; // Do not send empty password
        }
        const res = await api.put(`/api/superadmin/consultants/${editingConsultant.id}`, dataToSend);
        savedConsultantId = res.data.id;
        setConsultants(consultants.map(c => c.id === editingConsultant.id ? res.data : c));
      } else {
        // Create flow
        const res = await api.post("/api/superadmin/consultants", formData);
        savedConsultantId = res.data.id;
        setConsultants([res.data, ...consultants]);
      }

      // Upload logo if selected
      if (profileLogo && savedConsultantId) {
        const form = new FormData();
        form.append("file", profileLogo);
        await api.post(`/api/superadmin/consultants/${savedConsultantId}/logo`, form, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      // Upload cedula image if selected
      if (profileCedulaImage && savedConsultantId) {
        const form = new FormData();
        form.append("file", profileCedulaImage);
        await api.post(`/api/superadmin/consultants/${savedConsultantId}/cedula_image`, form, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (profileLogo || profileCedulaImage) {
        fetchConsultants(); // Refetch to get the updated URLs
      }

      setShowModal(false);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.detail || "Error al procesar la solicitud.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const editingCompanyWrapper = () => {
    return editingConsultant !== null;
  };

  const filteredConsultants = consultants.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.cedula_profesional && c.cedula_profesional.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Users size={28} style={{ color: "var(--color-primary)" }} />
              Gestión de Consultores
            </h1>
            <p className="page-subtitle">Registra nuevos consultores, administra sus cédulas profesionales y asigna créditos de uso.</p>
          </div>
          <ThemeToggle />
        </header>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", fontWeight: "500" }}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={fetchConsultants} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)" }}>
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
              placeholder="Buscar por nombre, correo o cédula..."
              className="form-input"
              style={{ paddingLeft: "38px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={18} />
            Registrar Consultor
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
                    <th>Nombre Completo</th>
                    <th>Correo Electrónico</th>
                    <th>Cédula Profesional</th>
                    <th>Créditos del Sistema</th>
                    <th>Acceso</th>
                    <th>Billing</th>
                    <th>Fecha Alta</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsultants.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No se encontraron consultores registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredConsultants.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{c.name}</td>
                        <td>{c.email}</td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "500" }}>
                            <Award size={16} style={{ color: "var(--color-info)" }} />
                            {c.cedula_profesional || "No registrada"}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", color: "var(--color-primary)", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Database size={14} />
                            {c.creditos ?? 0}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            title={c.is_active ? "Desactivar consultor" : "Activar consultor"}
                            aria-label={c.is_active ? "Desactivar consultor" : "Activar consultor"}
                            style={{
                              width: "44px",
                              height: "24px",
                              borderRadius: "999px",
                              border: "none",
                              backgroundColor: c.is_active ? "var(--color-success)" : "var(--border-color)",
                              cursor: "pointer",
                              position: "relative",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                top: "3px",
                                left: c.is_active ? "23px" : "3px",
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
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: c.billing_paid ? "var(--color-success)" : "var(--color-danger)" }}>
                            {c.billing_paid ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                            {c.billing_paid ? "Pagado" : "Pendiente"}
                          </span>
                        </td>
                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                            <button
                              onClick={() => handleOpenBilling(c)}
                              className="btn btn-secondary"
                              title="Billing"
                              aria-label="Billing"
                              style={{ padding: "7px", width: "32px", height: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <CreditCard size={15} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="btn btn-secondary"
                              title="Editar"
                              aria-label="Editar"
                              style={{ padding: "7px", width: "32px", height: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, c.name)}
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

        {/* Modal: Create/Edit Consultant */}
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
            <div className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: "600px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={20} style={{ color: "var(--color-primary)" }} />
                {editingConsultant ? "Editar Consultor" : "Registrar Nuevo Consultor"}
              </h2>

              {modalError && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: "13px", fontWeight: "500", marginBottom: "16px" }}>
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="mc_name">Nombre Completo</label>
                  <input
                    id="mc_name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej. Dr. Carlos Mendoza"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="mc_email">Correo Electrónico</label>
                  <input
                    id="mc_email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="carlos@consultora.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="mc_password">
                    Contraseña {editingConsultant && <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(dejar en blanco para no cambiar)</span>}
                  </label>
                  <input
                    id="mc_password"
                    type="password"
                    required={!editingConsultant}
                    className="form-input"
                    placeholder={editingConsultant ? "••••••••" : "Contraseña de acceso"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                    <label className="form-label" style={{ marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Award size={14} /> Cédula Profesional (Número)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.cedula_profesional}
                      onChange={(e) => setFormData({ ...formData, cedula_profesional: e.target.value })}
                      placeholder="Ej. 12345678"
                    />
                  </div>
                  
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label" style={{ marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      Imagen de Cédula Profesional (PNG/JPG)
                    </label>
                    <input
                      type="file"
                      accept=".png, .jpg, .jpeg"
                      className="form-input"
                      style={{ padding: "8px" }}
                      onChange={(e) => setProfileCedulaImage(e.target.files[0])}
                    />
                    {editingConsultant?.cedula_image_url && !profileCedulaImage && (
                      <div style={{ marginTop: "8px", fontSize: "12px" }}>
                        <a href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}${editingConsultant.cedula_image_url}`} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                          Ver Cédula Actual
                        </a>
                      </div>
                    )}
                  </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="mc_credits">Créditos de Uso</label>
                  <input
                    id="mc_credits"
                    type="number"
                    required
                    min="0"
                    className="form-input"
                    value={formData.creditos}
                    onChange={(e) => setFormData({ ...formData, creditos: parseInt(e.target.value) || 0 })}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    * Los créditos permiten al consultor procesar encuestas de clientes.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: "6px" }}>Logotipo (Opcional)</label>
                  <input
                    type="file"
                    accept=".png, .jpg, .jpeg"
                    className="form-input"
                    style={{ padding: "8px" }}
                    onChange={(e) => setProfileLogo(e.target.files[0])}
                  />
                </div>

                <div className="form-group" style={{ marginTop: "10px", padding: "16px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <label className="form-label" style={{ margin: 0 }}>Capacitaciones que puede impartir</label>
                    <button type="button" onClick={handleAddCapacitacion} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }}>
                      <Plus size={14} /> Agregar Capacitación
                    </button>
                  </div>
                  
                  {formData.capacitaciones.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", fontStyle: "italic" }}>
                      No se han agregado capacitaciones.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {formData.capacitaciones.map((cap, i) => (
                        <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Código" 
                            value={cap.codigo}
                            onChange={(e) => handleUpdateCapacitacion(i, 'codigo', e.target.value)}
                            style={{ flex: 1, padding: "6px 10px", fontSize: "13px" }}
                            required
                          />
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Nombre de la capacitación" 
                            value={cap.nombre}
                            onChange={(e) => handleUpdateCapacitacion(i, 'nombre', e.target.value)}
                            style={{ flex: 2, padding: "6px 10px", fontSize: "13px" }}
                            required
                          />
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="Horas" 
                            value={cap.horas}
                            onChange={(e) => handleUpdateCapacitacion(i, 'horas', parseInt(e.target.value) || 0)}
                            style={{ width: "70px", padding: "6px 10px", fontSize: "13px" }}
                            min="1"
                            required
                          />
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="Nivel" 
                            value={cap.nivel || 1}
                            onChange={(e) => handleUpdateCapacitacion(i, 'nivel', parseInt(e.target.value) || 1)}
                            style={{ width: "60px", padding: "6px 10px", fontSize: "13px" }}
                            min="1"
                            max="9"
                            required
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveCapacitacion(i)}
                            className="btn" 
                            style={{ padding: "6px", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", border: "none" }}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitLoading} className="btn btn-primary">
                    {submitLoading ? "Guardando..." : "Guardar Consultor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {billingConsultant && (
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
            <div className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: "620px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
              <button
                onClick={() => setBillingConsultant(null)}
                style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <CreditCard size={20} style={{ color: "var(--color-primary)" }} />
                Billing
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "18px" }}>
                {billingConsultant.name}
              </p>

              {billingError && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: "13px", fontWeight: "500", marginBottom: "16px" }}>
                  <AlertCircle size={16} />
                  <span>{billingError}</span>
                </div>
              )}

              <form onSubmit={handleBillingSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={billingData.billing_paid}
                    onChange={(e) => setBillingData({ ...billingData, billing_paid: e.target.checked })}
                  />
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>
                    Consultor pagado
                  </span>
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="billing_due_date">Fecha de vencimiento</label>
                    <input
                      id="billing_due_date"
                      type="date"
                      className="form-input"
                      value={billingData.billing_due_date || ""}
                      onChange={(e) => setBillingData({ ...billingData, billing_due_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="billing_amount">Cantidad de pago</label>
                    <input
                      id="billing_amount"
                      type="number"
                      min="0"
                      className="form-input"
                      value={billingData.billing_amount}
                      onChange={(e) => setBillingData({ ...billingData, billing_amount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", margin: 0 }}>Historial de pagos</h3>
                    <button type="button" onClick={handleAddPayment} className="btn btn-secondary" style={{ padding: "6px 10px", fontSize: "12px" }}>
                      <Plus size={14} />
                      Agregar pago
                    </button>
                  </div>

                  {billingData.billing_history.length === 0 ? (
                    <p style={{ padding: "18px", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-color)", color: "var(--text-muted)", textAlign: "center", fontSize: "13px" }}>
                      No hay pagos registrados.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {billingData.billing_history.map((payment, index) => (
                        <div key={index} style={{ display: "grid", gridTemplateColumns: "140px 120px 1fr 36px", gap: "8px", alignItems: "center" }}>
                          <input
                            type="date"
                            required
                            className="form-input"
                            value={payment.date || ""}
                            onChange={(e) => handleUpdatePayment(index, "date", e.target.value)}
                          />
                          <input
                            type="number"
                            required
                            min="0"
                            className="form-input"
                            value={payment.amount || 0}
                            onChange={(e) => handleUpdatePayment(index, "amount", parseInt(e.target.value) || 0)}
                          />
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Nota"
                            value={payment.note || ""}
                            onChange={(e) => handleUpdatePayment(index, "note", e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePayment(index)}
                            className="btn btn-danger"
                            title="Eliminar pago"
                            aria-label="Eliminar pago"
                            style={{ width: "34px", height: "34px", padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setBillingConsultant(null)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={billingLoading} className="btn btn-primary">
                    {billingLoading ? "Guardando..." : "Guardar Billing"}
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
