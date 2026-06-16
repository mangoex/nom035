// frontend/src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon, Image as ImageIcon, Save, Trash2, Building, Hash, Users, Activity } from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  
  // Forms state
  const [formData, setFormData] = useState({
    name: "",
    rfc: "",
    employee_count: 0,
    sector: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/company/me");
      setCompany(res.data);
      setFormData({
        name: res.data.name,
        rfc: res.data.rfc,
        employee_count: res.data.employee_count,
        sector: res.data.sector || ""
      });
    } catch (err) {
      console.error(err);
      alert("Error al cargar datos de configuración.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateData = async (e) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      const res = await api.put("/api/company/me", formData);
      setCompany(res.data);
      alert("Datos actualizados correctamente.");
      window.location.reload(); // Para que el sidebar también agarre el nuevo nombre
    } catch (err) {
      console.error(err);
      alert("Error al actualizar datos.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUploadLogo = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Selecciona un archivo de imagen primero.");
      return;
    }

    const form = new FormData();
    form.append("file", selectedFile);

    try {
      setUploadLoading(true);
      const res = await api.post("/api/company/me/logo", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Logotipo actualizado con éxito.");
      window.location.reload(); // Para recargar la imagen en el sidebar
    } catch (err) {
      console.error(err);
      alert("Error al subir el logotipo. Asegúrate de que sea PNG o JPG.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteResponses = async () => {
    if (window.confirm("⚠️ ATENCIÓN: ¿Estás seguro de que deseas borrar TODAS las encuestas y resultados de la base de datos de tu empresa? Esta acción NO se puede deshacer y eliminará planes de acción y diagnósticos.")) {
      try {
        await api.delete("/api/survey/responses");
        alert("Base de datos borrada correctamente. Los resultados ahora estarán en 0.");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Hubo un error al intentar borrar los datos.");
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Cargando configuración...</p>
      </div>
    );
  }

  // Usamos un string vacío o la variable de entorno para el base URL, ya que en dev o producción el API endpoint relativo funciona
  const logoUrl = company?.logo_url ? `http://localhost:8000${company.logo_url}` : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      <Sidebar company={company} />

      <main className="main-content">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <SettingsIcon size={28} style={{ color: "var(--color-primary)" }} />
              Configuración
            </h1>
            <p className="page-subtitle">Ajustes generales, personalización de logotipo y controles de datos.</p>
          </div>
          <ThemeToggle />
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          
          {/* Card: Datos de la Empresa */}
          <div className="glass-card">
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Building size={20} style={{ color: "var(--color-primary)" }} />
              Datos de la Empresa
            </h3>
            
            <form onSubmit={handleUpdateData} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Nombre / Razón Social</label>
                <div style={{ position: "relative" }}>
                  <Building size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                  <input
                    id="name"
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
                <label className="form-label" htmlFor="rfc">RFC</label>
                <div style={{ position: "relative" }}>
                  <Hash size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                  <input
                    id="rfc"
                    type="text"
                    required
                    className="form-input"
                    style={{ paddingLeft: "36px" }}
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="employee_count">No. de Colaboradores</label>
                <div style={{ position: "relative" }}>
                  <Users size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                  <input
                    id="employee_count"
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    style={{ paddingLeft: "36px" }}
                    value={formData.employee_count}
                    onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sector">Sector (Opcional)</label>
                <div style={{ position: "relative" }}>
                  <Activity size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                  <input
                    id="sector"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: "36px" }}
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" disabled={updateLoading} className="btn btn-primary" style={{ width: "100%", marginTop: "8px", display: "flex", justifyContent: "center", gap: "8px" }}>
                <Save size={18} />
                {updateLoading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Card: Logotipo */}
            <div className="glass-card">
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <ImageIcon size={20} style={{ color: "var(--color-primary)" }} />
                Logotipo de la Empresa
              </h3>
              
              <div style={{ marginBottom: "16px", textAlign: "center" }}>
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo Empresa" 
                    style={{ maxWidth: "150px", maxHeight: "150px", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--border-color)", padding: "10px", backgroundColor: "#fff" }}
                  />
                ) : (
                  <div style={{ padding: "40px", border: "2px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-muted)" }}>
                    Sin logotipo
                  </div>
                )}
              </div>

              <form onSubmit={handleUploadLogo} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="logo">Subir nueva imagen (PNG, JPG)</label>
                  <input 
                    type="file" 
                    id="logo"
                    accept=".png, .jpg, .jpeg"
                    className="form-input" 
                    style={{ padding: "10px" }}
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </div>

                <button type="submit" disabled={uploadLoading || !selectedFile} className="btn btn-secondary" style={{ width: "100%", display: "flex", justifyContent: "center", gap: "8px" }}>
                  <ImageIcon size={18} />
                  {uploadLoading ? "Subiendo..." : "Actualizar Logotipo"}
                </button>
              </form>
            </div>

            {/* Zona de Peligro */}
            <div className="glass-card" style={{ border: "1px solid var(--color-danger)", backgroundColor: "rgba(239, 68, 68, 0.05)" }}>
              <div style={{ padding: "10px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--color-danger)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Trash2 size={20} />
                  Zona de Peligro
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px", marginBottom: "16px", lineHeight: "1.5" }}>
                  Esta opción eliminará de forma permanente todas las encuestas recopiladas, diagnósticos generados y el plan de acción de tu empresa. Se usa para reiniciar completamente el sistema.
                </p>
                <button onClick={handleDeleteResponses} className="btn btn-primary" style={{ backgroundColor: "var(--color-danger)", borderColor: "var(--color-danger)", fontSize: "13px", width: "100%" }}>
                  Borrar toda la Base de Datos
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
