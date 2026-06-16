// frontend/src/pages/SurveyIntake.jsx
import React, { useEffect, useState } from "react";
import { 
  Link2, 
  Download, 
  UploadCloud, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle,
  FileSpreadsheet,
  Trash2
} from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function SurveyIntake() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  
  // CSV upload state
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const fetchSessionData = async () => {
    try {
      const [compRes, sessRes] = await Promise.all([
        api.get("/api/company/me"),
        api.get("/api/survey/sessions")
      ]);
      setCompany(compRes.data);
      setSessions(sessRes.data);
      
      // Look for active session matching company guide type
      const active = sessRes.data.find(s => s.is_active && s.guide_type === compRes.data.active_guide);
      setActiveSession(active);
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  const handleGenerateLink = async (guideType) => {
    try {
      setError("");
      const res = await api.post(`/api/survey/session?guide_type=${guideType}`);
      setActiveSession(res.data);
      // Refresh list
      const sessRes = await api.get("/api/survey/sessions");
      setSessions(sessRes.data);
    } catch (err) {
      console.error(err);
      setError("No se pudo generar la liga de la encuesta.");
    }
  };

  const handleCopyLink = () => {
    if (!activeSession) return;
    const url = `${window.location.origin}/survey/public/${activeSession.link_hash}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTemplate = async () => {
    if (!company) return;
    try {
      const res = await api.get(`/api/survey/csv/template?guide_type=${company.active_guide}`, {
        responseType: "blob"
      });
      // Create download link
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

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/api/survey/csv/upload?guide_type=${company.active_guide}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setUploadResult(res.data);
      setFile(null);
      // Refetch stats to reflect newly uploaded data
      fetchSessionData();
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Cargando módulo de captura...</p>
      </div>
    );
  }

  const publicUrl = activeSession ? `${window.location.origin}/survey/public/${activeSession.link_hash}` : "";

  return (
    <div className="app-container">
      <Sidebar company={company} />

      <main className="main-content">
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
          
          {/* Opción A: Encuesta Individual en línea */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-primary)" }}>
              <Link2 size={24} />
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Opción A: Encuesta en Línea</h3>
            </div>
            
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Genera una liga pública única. Comparte este enlace por correo, WhatsApp o Slack con tus colaboradores para que contesten la encuesta de forma individual, confidencial y directa desde cualquier dispositivo.
            </p>

            {activeSession ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                <div style={{ fontSize: "12px", color: "var(--color-success)", fontWeight: "600", display: "flex", gap: "6px", alignItems: "center" }}>
                  <CheckCircle size={16} />
                  <span>Enlace de encuesta activo</span>
                </div>
                
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="form-input"
                    style={{ backgroundColor: "var(--bg-secondary)", fontFamily: "monospace", fontSize: "12px" }}
                  />
                  <button onClick={handleCopyLink} className="btn btn-secondary" style={{ padding: "10px", flexShrink: 0 }}>
                    {copied ? <Check size={18} style={{ color: "var(--color-success)" }} /> : <Copy size={18} />}
                  </button>
                </div>
                
                <button
                  onClick={() => handleGenerateLink(company.active_guide)}
                  className="btn btn-secondary"
                  style={{ marginTop: "8px", fontSize: "13px" }}
                >
                  Regenerar Enlace (Desactiva el anterior)
                </button>
              </div>
            ) : (
              <div style={{ marginTop: "12px" }}>
                <button
                  onClick={() => handleGenerateLink(company.active_guide)}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px" }}
                >
                  Activar y Generar Liga Pública
                </button>
              </div>
            )}

            {/* Extra Guía I generation for companies using II/III */}
            {company?.active_guide !== "GUIA_I" && (
              <div style={{ marginTop: "20px", borderTop: "1px dashed var(--border-color)", paddingTop: "16px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>Guía I (Acontecimientos Traumáticos)</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  De forma complementaria, puedes levantar la Guía I de acontecimientos traumáticos severos en cualquier momento.
                </p>
                <button onClick={() => handleGenerateLink("GUIA_I")} className="btn btn-secondary" style={{ width: "100%", fontSize: "12px", padding: "8px" }}>
                  Generar Enlace para Guía I
                </button>
              </div>
            )}
          </div>

          {/* Opción B: Carga masiva por CSV */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-success)" }}>
              <FileSpreadsheet size={24} />
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Opción B: Carga Masiva (CSV)</h3>
            </div>
            
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Descarga la plantilla estructurada para tu tipo de empresa (<strong>{company.active_guide}</strong>). Captura los resultados recolectados previamente en papel, llena las columnas correspondientes y sube el archivo procesado.
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
                
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-danger)" }}>Errores en filas:</span>
                    <ul style={{ fontSize: "11px", color: "var(--text-secondary)", listStyleType: "disc", paddingLeft: "16px", marginTop: "4px" }}>
                      {uploadResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {uploadResult.errors.length > 5 && <li>Y {uploadResult.errors.length - 5} errores más...</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
