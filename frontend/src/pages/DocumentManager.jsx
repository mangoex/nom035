// frontend/src/pages/DocumentManager.jsx
import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  AlertCircle,
  Edit3,
  Save,
  Upload,
  File as FileIcon
} from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function DocumentManager() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  
  // Policy text state
  const [policyText, setPolicyText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const fetchCompanyData = async () => {
    try {
      const res = await api.get("/api/company/me");
      setCompany(res.data);
      
      // Generate default policy text based on company details
      const c = res.data;
      
      if (c.policy_text) {
        setPolicyText(c.policy_text);
      } else {
        const today = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
        const defaultText = `POLÍTICA DE PREVENCIÓN DE RIESGOS PSICOSOCIALES

EMPRESA: ${c.name}
RFC: ${c.rfc}
SECTOR INDUSTRIAL: ${c.sector || "General"}
FECHA DE EMISIÓN: ${today}

De conformidad con lo dispuesto por la Norma Oficial Mexicana NOM-035-STPS-2018, Factores de riesgo psicosocial en el trabajo-Identificación, análisis y prevención, la empresa ${c.name} establece los siguientes compromisos y lineamientos básicos:

1. OBJETIVO
Establecer los principios y lineamientos para la prevención de los factores de riesgo psicosocial, la prevención de la violencia laboral y la promoción de un entorno organizacional favorable en los centros de trabajo de la empresa.

2. COMPROMISOS GENERALES
- Es obligación de todos los directores, gerentes, supervisores y colaboradores promover un ambiente de trabajo libre de violencia laboral y acoso.
- Se prohiben estrictamente los malos tratos, la discriminación y los insultos entre colaboradores, independientemente de su puesto o nivel de responsabilidad.
- La empresa promoverá la distribución equitativa de las cargas de trabajo y jornadas laborales conforme a los límites establecidos por la Ley Federal del Trabajo.
- Se fomenta la comunicación abierta y constructiva en todas las áreas de trabajo.

3. MECANISMO DE QUEJAS Y DENUNCIAS
Cualquier colaborador que presencie o sea víctima de un acto de violencia laboral, malos tratos, hostigamiento o condiciones peligrosas e insalubres podrá reportarlo a través de los canales confidenciales de Recursos Humanos o el Buzón de Sugerencias y Quejas de la empresa. La empresa garantiza que no habrá represalias contra ningún denunciante y que cada reporte se tratará de manera formal, confidencial y respetuosa.

4. DIFUSIÓN Y CAPACITACIÓN
La presente política es de aplicación obligatoria para todo el personal y estará disponible para su consulta permanente en los tableros de información y portales de comunicación interna. La empresa brindará programas periódicos de sensibilización y capacitación sobre balance de vida y carrera y liderazgo positivo.

Firma de la Dirección General
___________________________________
Representante Legal / Recursos Humanos
${c.name}
`;
        setPolicyText(defaultText);
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar la información del servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const handleCopyPolicy = () => {
    navigator.clipboard.writeText(policyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPolicy = () => {
    if (!company) return;
    const blob = new Blob([policyText], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `politica_prevencion_${company.name.toLowerCase().replace(/\s+/g, "_")}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSavePolicy = async () => {
    try {
      setIsSaving(true);
      setError("");
      await api.put("/api/company/me/policy", { policy_text: policyText });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Error al guardar la política.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("El archivo debe ser PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setError("");
      const res = await api.post("/api/company/me/policy-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCompany(prev => ({ ...prev, policy_pdf_url: res.data.policy_pdf_url }));
    } catch (err) {
      console.error(err);
      setError("Error al subir el PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Cargando gestión documental...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar company={company} />

      <main className="main-content">
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Gestión Documental</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Descarga la documentación obligatoria pre-llenada para tu carpeta de cumplimiento NOM-035
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          
          {/* Policy Generator Card */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-primary)" }}>
                <FileText size={24} />
                <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Política de Prevención de Riesgos Psicosociales</h3>
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleSavePolicy} disabled={isSaving} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: "13px" }}>
                  {saveSuccess ? <Check size={16} /> : <Save size={16} />}
                  {saveSuccess ? "Guardado" : (isSaving ? "Guardando..." : "Guardar Cambios")}
                </button>
                <button onClick={handleCopyPolicy} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "13px" }}>
                  {copied ? <Check size={16} style={{ color: "var(--color-success)" }} /> : <Copy size={16} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <button onClick={handleDownloadPolicy} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "13px" }}>
                  <Download size={16} />
                  Descargar (.txt)
                </button>
              </div>
            </div>
            
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Esta política cumple con los lineamientos básicos estipulados en la norma oficial mexicana. Puedes editar los textos de forma directa en el área de abajo para incluir logotipos, nombres de directivos o ajustar las políticas de quejas internas de tu empresa.
            </p>

            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                color: "var(--text-muted)",
                fontSize: "12px",
                fontWeight: "500",
                display: "flex",
                gap: "4px",
                alignItems: "center",
                pointerEvents: "none"
              }}>
                <Edit3 size={14} />
                <span>Editable</span>
              </div>
              <textarea
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                className="form-input"
                style={{
                  height: "420px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  padding: "20px",
                  backgroundColor: "var(--bg-secondary)",
                  resize: "vertical"
                }}
              />
            </div>
            
            {/* PDF Upload Section */}
            <div style={{ marginTop: "10px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "var(--text-primary)" }}>Política en PDF (Opcional)</h4>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Si cuentas con un documento oficial firmado (PDF), puedes subirlo aquí.
              </p>
              
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <input 
                  type="file" 
                  accept=".pdf" 
                  style={{ display: "none" }} 
                  ref={fileInputRef}
                  onChange={handlePdfUpload}
                />
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  className="btn btn-secondary" 
                  disabled={isUploading}
                  style={{ padding: "8px 16px", fontSize: "14px" }}
                >
                  <Upload size={16} />
                  {isUploading ? "Subiendo..." : (company?.policy_pdf_url ? "Reemplazar PDF" : "Subir PDF")}
                </button>
                
                {company?.policy_pdf_url && (
                  <a 
                    href={company.policy_pdf_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: "8px 16px", fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <FileIcon size={16} />
                    Ver PDF Subido
                  </a>
                )}
              </div>
            </div>
            
          </div>

        </div>
      </main>
    </div>
  );
}
