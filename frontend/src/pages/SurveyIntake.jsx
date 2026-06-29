// frontend/src/pages/SurveyIntake.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Link2, 
  Download, 
  UploadCloud, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle,
  FileSpreadsheet,
  Plus,
  Calendar,
  User,
  Award,
  Lock,
  Search,
  RefreshCw,
  Eye,
  X
} from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function SurveyIntake() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState("");
  
  // Date Filters for History
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Create Survey Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    guide_type: "GUIA_II",
    recopilador: "",
    fecha_fin: "",
    creador: "",
    cedula_creador: "",
    clave_secreta: ""
  });

  // CSV upload state
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Results password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  const fetchSessionData = async () => {
    try {
      setError("");
      const [compRes, sessRes] = await Promise.all([
        api.get("/api/company/me"),
        api.get(`/api/survey/sessions?start_date=${filterStartDate}&end_date=${filterEndDate}`)
      ]);
      setCompany(compRes.data);
      setSessions(sessRes.data);
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [filterStartDate, filterEndDate]);

  const handleOpenModal = () => {
    // Autopopulate guide type based on company active guide
    const defaultGuide = company?.active_guide || "GUIA_II";
    // Set default end date to 30 days from now
    const today = new Date();
    const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const yyyy = futureDate.getFullYear();
    const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
    const dd = String(futureDate.getDate()).padStart(2, '0');
    const defaultDateStr = `${yyyy}-${mm}-${dd}`;

    setFormData({
      guide_type: defaultGuide,
      recopilador: "",
      fecha_fin: defaultDateStr,
      creador: "",
      cedula_creador: "",
      clave_secreta: ""
    });
    setModalError("");
    setShowModal(true);
  };

  const handleCreateSessionSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setModalError("");

    // Additional check for secret key
    if (formData.guide_type === "GUIA_I" && !formData.clave_secreta) {
      setModalError("La clave secreta es obligatoria para la encuesta de traumas.");
      setSubmitLoading(false);
      return;
    }

    try {
      await api.post("/api/survey/session", formData);
      setShowModal(false);
      fetchSessionData(); // Refresh list
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.detail || "Error al crear la encuesta.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCopyLink = (session) => {
    // Resolve dynamic path using api.defaults.baseURL or fall back to window.location.origin
    const base = api.defaults.baseURL && api.defaults.baseURL.startsWith("http") 
      ? api.defaults.baseURL 
      : window.location.origin;
    const cleanBase = base.replace(/\/api$/, "").replace(/\/$/, "");
    const url = `${cleanBase}/survey/public/${session.link_hash}`;
    
    navigator.clipboard.writeText(url);
    setCopiedId(session.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleViewResults = (session) => {
    if (session.guide_type === "GUIA_I" && session.clave_secreta) {
      setSelectedSession(session);
      setEnteredPassword("");
      setPasswordError("");
      setShowPasswordModal(true);
    } else {
      navigate(`/dashboard?session_id=${session.id}`);
    }
  };

  const handleVerifyResultsClave = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setVerifyingPassword(true);
    try {
      // Validate key by fetching stats
      await api.get(`/api/survey/stats?survey_session_id=${selectedSession.id}&clave=${encodeURIComponent(enteredPassword)}`);
      
      // Save password in sessionStorage so Dashboard can fetch it
      sessionStorage.setItem(`session_key_${selectedSession.id}`, enteredPassword);
      
      // Close modal and navigate
      setShowPasswordModal(false);
      navigate(`/dashboard?session_id=${selectedSession.id}`);
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.detail || "Clave secreta incorrecta.");
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleDownloadExcel = async (session) => {
    try {
      const res = await api.get(`/api/survey/sessions/${session.id}/export-excel`, {
        responseType: "blob"
      });
      const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resultados_${session.guide_type.toLowerCase()}_${session.id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "No se pudo descargar el archivo Excel.");
    }
  };

  const handleDownloadTemplate = async () => {
    if (!company) return;
    try {
      const res = await api.get(`/api/survey/csv/template?guide_type=${company.active_guide}`, {
        responseType: "blob"
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `layout_${company.active_guide.toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar la plantilla CSV.");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !company) return;

    setUploadLoading(true);
    setUploadResult(null);
    setError("");

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await api.post(`/api/survey/csv/upload?guide_type=${company.active_guide}`, data, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setUploadResult(res.data);
      setFile(null);
      fetchSessionData(); // reload
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        alert(err.response.data.detail);
      } else {
        alert("Error al procesar el archivo CSV.");
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const getSessionStatus = (session) => {
    if (!session.is_active) return { label: "Desactivada", color: "var(--text-muted)" };
    const today = new Date().setHours(0, 0, 0, 0);
    const limitDate = new Date(session.fecha_fin).getTime();
    if (today > limitDate) return { label: "Vencida", color: "var(--color-danger)" };
    return { label: "Activa", color: "var(--color-success)" };
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Cargando módulo de captura...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar company={company} />

      <main className="main-content animate-fade-in">
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Captura de Datos</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Elige el método de recolección de encuestas para {company?.name}
            </p>
          </div>
          <ThemeToggle />
        </header>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", display: "flex", gap: "10px", alignItems: "center", fontSize: "14px" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          
          {/* Opción A: Encuesta en línea */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-primary)" }}>
              <Link2 size={24} />
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Opción A: Encuesta en Línea</h3>
            </div>
            
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Genera ligas públicas parametrizadas para enviárselas a tus colaboradores por correo, WhatsApp o Slack. Puedes definir quién recopila, quién crea y limitar la fecha de vigencia del enlace.
            </p>

            <div style={{ marginTop: "auto", paddingTop: "12px" }}>
              <button
                onClick={handleOpenModal}
                className="btn btn-primary"
                style={{ width: "100%", padding: "12px", display: "flex", gap: "8px", justifyContent: "center" }}
              >
                <Plus size={18} />
                Crear Nueva Encuesta
              </button>
            </div>
          </div>

          {/* Opción B: Carga masiva por CSV */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-success)" }}>
              <FileSpreadsheet size={24} />
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Opción B: Carga Masiva (CSV)</h3>
            </div>
            
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Descarga la plantilla estructurada para tu tipo de empresa (<strong>{company?.active_guide}</strong>). Captura los resultados recolectados previamente en papel y sube el archivo procesado.
            </p>

            <button onClick={handleDownloadTemplate} className="btn btn-secondary" style={{ width: "100%", display: "flex", gap: "8px", justifyContent: "center" }}>
              <Download size={18} />
              Descargar Plantilla CSV Layout
            </button>

            <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
              <div style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "var(--bg-secondary)",
                transition: "border-color 0.2s ease"
              }}
              onDragOver={(e) => { e.preventDefault(); e.target.style.borderColor = "var(--color-primary)"; }}
              onDragLeave={(e) => { e.preventDefault(); e.target.style.borderColor = "var(--border-color)"; }}
              onDrop={(e) => {
                e.preventDefault();
                e.target.style.borderColor = "var(--border-color)";
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setFile(e.dataTransfer.files[0]);
                }
              }}
              >
                <input
                  type="file"
                  id="csv_file"
                  accept=".csv"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <label htmlFor="csv_file" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <UploadCloud size={32} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    {file ? file.name : "Haz clic o arrastra un archivo CSV para subir"}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Solo se permiten archivos .csv</span>
                </label>
              </div>

              {file && (
                <button type="submit" disabled={uploadLoading} className="btn btn-primary" style={{ width: "100%", padding: "12px" }}>
                  {uploadLoading ? "Procesando archivo..." : "Cargar y Calcular Resultados"}
                </button>
              )}
            </form>

            {uploadResult && (
              <div style={{
                marginTop: "12px",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-success-bg)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "var(--text-primary)"
              }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "6px" }}>
                  <CheckCircle size={18} style={{ color: "var(--color-success)" }} />
                  <span style={{ fontWeight: "700", fontSize: "14px" }}>¡Carga Procesada Exitosamente!</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Se crearon y calificaron exitosamente <strong>{uploadResult.records_created} registros</strong> de colaboradores.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* HISTORICAL SURVEY LIST */}
        <div className="glass-card animate-slide-up" style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>Historial de Encuestas Creadas</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Consulta las ligas de recolección y respuestas recolectadas.</p>
            </div>
            
            {/* Filters */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={16} style={{ color: "var(--text-muted)" }} />
                <label style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)" }}>Desde:</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: "6px 10px", fontSize: "12px", width: "130px" }}
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={16} style={{ color: "var(--text-muted)" }} />
                <label style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)" }}>Hasta:</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: "6px 10px", fontSize: "12px", width: "130px" }}
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
              
              {(filterStartDate || filterEndDate) && (
                <button 
                  onClick={() => { setFilterStartDate(""); setFilterEndDate(""); }}
                  className="btn btn-secondary" 
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tipo Guía</th>
                  <th>Creador / Cédula</th>
                  <th>Recopilador</th>
                  <th>Vigencia</th>
                  <th>Respuestas</th>
                  <th>Estatus</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No se encontraron encuestas creadas en este periodo.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => {
                    const status = getSessionStatus(s);
                    const isExpired = status.label === "Vencida" || status.label === "Desactivada";
                    return (
                      <tr key={s.id}>
                        <td>
                          <span className={`badge ${s.guide_type === 'GUIA_I' ? 'badge-alto' : s.guide_type === 'GUIA_II' ? 'badge-bajo' : 'badge-medio'}`}>
                            {s.guide_type === 'GUIA_I' ? 'GUIA I (Traumas)' : s.guide_type}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{s.creador || "No especificado"}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Ced: {s.cedula_creador || "N/A"}</div>
                        </td>
                        <td>{s.recopilador || "No especificado"}</td>
                        <td>
                          <div style={{ fontSize: "13px" }}>Inicio: {new Date(s.created_at).toLocaleDateString()}</div>
                          <div style={{ fontSize: "13px", color: isExpired ? "var(--color-danger)" : "var(--text-secondary)" }}>
                            Fin: {s.fecha_fin ? new Date(s.fecha_fin).toLocaleDateString() : "N/A"}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: "700", color: "var(--color-primary)" }}>
                            {s.response_count ?? 0}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: "600", color: status.color, fontSize: "13px" }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                            <button
                              onClick={() => handleViewResults(s)}
                              className="btn btn-primary"
                              style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", gap: "6px", alignItems: "center" }}
                            >
                              <Eye size={14} />
                              Ver Resultados
                            </button>
                            
                            <button
                              onClick={() => handleCopyLink(s)}
                              disabled={isExpired}
                              className="btn btn-secondary"
                              style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", gap: "6px", alignItems: "center" }}
                            >
                              {copiedId === s.id ? (
                                <>
                                  <Check size={14} style={{ color: "var(--color-success)" }} />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  Copiar Link
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleDownloadExcel(s)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", gap: "6px", alignItems: "center", backgroundColor: "var(--color-success)", color: "white", borderColor: "var(--color-success)" }}
                            >
                              <Download size={14} />
                              Descargar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: CREATE SURVEY SESSION */}
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
                <Plus size={20} style={{ color: "var(--color-primary)" }} />
                Crear Nueva Encuesta
              </h2>

              {modalError && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: "13px", fontWeight: "500", marginBottom: "16px" }}>
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSessionSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Guía</label>
                  <select
                    className="form-input"
                    value={formData.guide_type}
                    onChange={(e) => setFormData({ ...formData, guide_type: e.target.value })}
                  >
                    <option value="GUIA_I">Guía I (Acontecimientos Traumáticos)</option>
                    {company?.active_guide === "GUIA_III" ? (
                      <option value="GUIA_III">Guía III (Factores y Entorno Organizacional - Grande)</option>
                    ) : (
                      <option value="GUIA_II">Guía II (Factores de Riesgo - Pequeña/Mediana)</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m_recopilador">Nombre del Recopilador</label>
                  <div style={{ position: "relative" }}>
                    <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                    <input
                      id="m_recopilador"
                      type="text"
                      required
                      placeholder="Nombre de quien recopila los datos"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      value={formData.recopilador}
                      onChange={(e) => setFormData({ ...formData, recopilador: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m_creador">Nombre del Creador</label>
                  <div style={{ position: "relative" }}>
                    <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                    <input
                      id="m_creador"
                      type="text"
                      required
                      placeholder="Nombre de quien genera la encuesta"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      value={formData.creador}
                      onChange={(e) => setFormData({ ...formData, creador: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m_cedula">Número de Cédula Profesional</label>
                  <div style={{ position: "relative" }}>
                    <Award size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                    <input
                      id="m_cedula"
                      type="text"
                      required
                      placeholder="Cédula profesional del creador/psicólogo"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      value={formData.cedula_creador}
                      onChange={(e) => setFormData({ ...formData, cedula_creador: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="m_fecha_fin">Fecha de Fin (Vigencia)</label>
                  <div style={{ position: "relative" }}>
                    <Calendar size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                    <input
                      id="m_fecha_fin"
                      type="date"
                      required
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    * La fecha de inicio es el día de hoy.
                  </span>
                </div>

                {formData.guide_type === "GUIA_I" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="m_clave">Clave Secreta para ver Resultados</label>
                    <div style={{ position: "relative" }}>
                      <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                      <input
                        id="m_clave"
                        type="text"
                        required
                        placeholder="Define la clave requerida para ver los resultados"
                        className="form-input"
                        style={{ paddingLeft: "36px" }}
                        value={formData.clave_secreta}
                        onChange={(e) => setFormData({ ...formData, clave_secreta: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitLoading} className="btn btn-primary">
                    {submitLoading ? "Creando..." : "Generar Liga de Encuesta"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: VERIFY RESULTS SECRET KEY */}
        {showPasswordModal && selectedSession && (
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
            <div className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: "400px", position: "relative" }}>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={20} style={{ color: "var(--color-danger)" }} />
                Acceso a Resultados
              </h2>
              
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: "1.5" }}>
                Esta encuesta de traumas (Guía I) está protegida. Por favor ingresa la clave secreta para ver sus estadísticas y respuestas.
              </p>

              {passwordError && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: "13px", fontWeight: "500", marginBottom: "16px" }}>
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyResultsClave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="results_clave">Clave de Acceso</label>
                  <input
                    id="results_clave"
                    type="password"
                    required
                    placeholder="Ingresa la clave secreta"
                    className="form-input"
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={verifyingPassword} className="btn btn-primary">
                    {verifyingPassword ? "Verificando..." : "Desbloquear y Ver"}
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
