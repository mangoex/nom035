import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  PieChart, Pie, Legend
} from "recharts";
import { Building, AlertTriangle, CheckCircle, Info } from "lucide-react";

const RISK_COLORS = {
  "Nulo": "#64748b",
  "Bajo": "#10b981",
  "Medio": "#f59e0b",
  "Alto": "#ef4444",
  "Muy Alto": "#b91c1c",
  "N/A": "#cbd5e1"
};

export const PrintableReport = React.forwardRef(({ company, stats, tasks, suggestions }, ref) => {
  if (!company || !stats) return null;

  const pieData = Object.entries(stats?.final_risk_distribution || {}).map(([name, value]) => ({
    name,
    value
  })).filter(item => item.value > 0);

  const barDataCategories = Object.entries(stats?.category_averages || {}).map(([name, value]) => ({
    name: name.length > 30 ? name.substring(0, 30) + "..." : name,
    fullName: name,
    Puntaje: value,
    Riesgo: stats?.category_risks?.[name] || "Nulo"
  }));

  const barDataDomains = Object.entries(stats?.domain_averages || {}).map(([name, value]) => ({
    name: name.length > 30 ? name.substring(0, 30) + "..." : name,
    fullName: name,
    Puntaje: value,
    Riesgo: stats?.domain_risks?.[name] || "Nulo"
  }));

  // Uso de gráficas de barras horizontales para dimensiones para evitar solapamiento
  const barDataDimensions = Object.entries(stats?.dimension_averages || {}).map(([name, value]) => ({
    name: name.length > 40 ? name.substring(0, 40) + "..." : name,
    fullName: name,
    Puntaje: value,
    Riesgo: stats?.dimension_risks?.[name] || "Nulo"
  }));

  const today = new Date().toLocaleDateString("es-MX", { year: 'numeric', month: 'long', day: 'numeric' });

  const PageContainer = ({ children }) => (
    <div style={{ padding: "40px", backgroundColor: "white", color: "#333", fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }}>
      {children}
    </div>
  );

  const PageBreak = () => <div style={{ pageBreakBefore: "always", marginTop: "40px" }} />;

  const SectionTitle = ({ title }) => (
    <h3 style={{ borderBottom: "2px solid #3b82f6", paddingBottom: "8px", color: "#1e293b", marginTop: "0", marginBottom: "20px", display: "inline-block" }}>
      {title}
    </h3>
  );

  return (
    <div ref={ref} style={{ backgroundColor: "#f8fafc", width: "100%", maxWidth: "800px", margin: "0 auto" }}>
      
      {/* ----------------- PÁGINA 1: PORTADA Y RESUMEN ----------------- */}
      <PageContainer>
        <div style={{ textAlign: "center", marginBottom: "40px", borderBottom: "4px solid #1e293b", paddingBottom: "30px", paddingTop: "20px" }}>
          <Building size={48} color="#3b82f6" style={{ marginBottom: "15px" }} />
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "0 0 10px 0", letterSpacing: "-0.02em" }}>Reporte de Diagnóstico Psicosocial</h1>
          <h2 style={{ fontSize: "22px", color: "#475569", margin: "0 0 15px 0", fontWeight: "500" }}>Cumplimiento NOM-035-STPS-2018</h2>
          <div style={{ backgroundColor: "#f1f5f9", display: "inline-block", padding: "10px 20px", borderRadius: "8px", marginTop: "10px" }}>
            <p style={{ margin: "0", fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}>{company.name}</p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px" }}>
          <div>
            <p style={{ margin: "0 0 5px 0", color: "#64748b", fontSize: "13px" }}>FECHA DEL REPORTE</p>
            <p style={{ margin: "0", fontWeight: "600", fontSize: "15px" }}>{today}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 5px 0", color: "#64748b", fontSize: "13px" }}>TOTAL ENCUESTADOS</p>
            <p style={{ margin: "0", fontWeight: "600", fontSize: "15px" }}>{stats.total_responses} colaboradores</p>
          </div>
          <div>
            <p style={{ margin: "0 0 5px 0", color: "#64748b", fontSize: "13px" }}>VERSIÓN APLICADA</p>
            <p style={{ margin: "0", fontWeight: "600", fontSize: "15px" }}>
              {company.active_guide === "GUIA_I" ? "Guía I" : company.active_guide === "GUIA_II" ? "Guías I y II" : "Guías I y III"}
            </p>
          </div>
        </div>

        <SectionTitle title="Resumen Ejecutivo" />
        
        <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
          <div style={{ flex: 1, backgroundColor: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 10px 0", fontWeight: "600" }}>Puntaje Final Promedio</p>
            <h3 style={{ fontSize: "36px", fontWeight: "800", color: "#0f172a", margin: "0 0 5px 0" }}>{stats.global_score_average || 0}</h3>
            <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "16px", backgroundColor: RISK_COLORS[stats.global_score_risk] || RISK_COLORS["Nulo"], color: "white", fontWeight: "bold", fontSize: "12px" }}>
              Riesgo {stats.global_score_risk || "Nulo"}
            </span>
          </div>

          <div style={{ flex: 1, backgroundColor: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 10px 0", fontWeight: "600" }}>Atención Clínica Requerida</p>
            <AlertTriangle size={32} color={stats.requires_clinical_referral_count > 0 ? "#ef4444" : "#10b981"} style={{ marginBottom: "5px" }} />
            <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0" }}>
              {stats.requires_clinical_referral_count} {stats.requires_clinical_referral_count === 1 ? "caso" : "casos"}
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "5px 0 0 0" }}>Trauma Severo detectado</p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h4 style={{ color: "#334155", margin: "0 0 15px 0" }}>Distribución de Riesgo de los Colaboradores</h4>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <PieChart width={400} height={250}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>
      </PageContainer>

      <PageBreak />

      {/* ----------------- PÁGINA 2: CATEGORÍAS ----------------- */}
      <PageContainer>
        <SectionTitle title="Análisis por Categorías" />
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
          Las Categorías agrupan de forma macro los factores psicosociales que afectan el desempeño y la salud del colaborador.
        </p>
        
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px" }}>
          <BarChart width={600} height={300} data={barDataCategories} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} tick={{ fontSize: 11, fill: "#475569" }} />
            <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
            <Tooltip />
            <Bar dataKey="Puntaje" radius={[4, 4, 0, 0]}>
              {barDataCategories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.Riesgo] || "#8884d8"} />
              ))}
            </Bar>
          </BarChart>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1px solid #cbd5e1" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "#334155" }}>Categoría</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#334155" }}>Puntaje Promedio</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#334155" }}>Nivel de Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {barDataCategories.map((cat, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "12px", color: "#1e293b", fontWeight: "500" }}>{cat.fullName}</td>
                <td style={{ padding: "12px", textAlign: "center", color: "#475569" }}>{cat.Puntaje}</td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: "4px", backgroundColor: RISK_COLORS[cat.Riesgo] ? `${RISK_COLORS[cat.Riesgo]}20` : '#ccc', color: RISK_COLORS[cat.Riesgo] || '#333', fontWeight: "bold" }}>
                    {cat.Riesgo}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageContainer>

      <PageBreak />

      {/* ----------------- PÁGINA 3: DOMINIOS ----------------- */}
      <PageContainer>
        <SectionTitle title="Análisis por Dominios" />
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
          Los Dominios ofrecen un desglose más profundo de las Categorías para identificar los focos rojos específicos que requieren intervención primaria.
        </p>
        
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px" }}>
          <BarChart width={600} height={350} data={barDataDomains} margin={{ top: 20, right: 30, left: 20, bottom: 90 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10, fill: "#475569" }} />
            <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
            <Tooltip />
            <Bar dataKey="Puntaje" radius={[4, 4, 0, 0]}>
              {barDataDomains.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.Riesgo] || "#8884d8"} />
              ))}
            </Bar>
          </BarChart>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1px solid #cbd5e1" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "#334155" }}>Dominio</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#334155" }}>Puntaje</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#334155" }}>Nivel de Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {barDataDomains.map((dom, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "10px 12px", color: "#1e293b", fontWeight: "500" }}>{dom.fullName}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", color: "#475569" }}>{dom.Puntaje}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "bold", color: RISK_COLORS[dom.Riesgo] }}>
                  {dom.Riesgo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageContainer>

      <PageBreak />

      {/* ----------------- PÁGINA 4: DIMENSIONES ----------------- */}
      <PageContainer>
        <SectionTitle title="Análisis por Dimensiones" />
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
          Las Dimensiones son el nivel más atómico de la NOM-035. Permiten accionar políticas precisas al identificar las causas raíz del estrés laboral.
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px" }}>
          {/* Usamos layout="vertical" para evitar solapamiento de nombres largos */}
          <BarChart width={700} height={500} data={barDataDimensions} layout="vertical" margin={{ top: 5, right: 30, left: 180, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#475569" }} />
            <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 10, fill: "#475569" }} interval={0} />
            <Tooltip />
            <Bar dataKey="Puntaje" radius={[0, 4, 4, 0]} barSize={12}>
              {barDataDimensions.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.Riesgo] || "#8884d8"} />
              ))}
            </Bar>
          </BarChart>
        </div>

      </PageContainer>

      <PageBreak />

      {/* ----------------- PÁGINA 5: PLAN DE ACCIÓN ----------------- */}
      <PageContainer>
        <SectionTitle title="Plan de Acción y Cumplimiento" />
        
        <div style={{ marginBottom: "40px" }}>
          <h4 style={{ color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={20} color="#10b981" /> Tareas Vigentes en Progreso
          </h4>
          {tasks && tasks.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginTop: "15px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #cbd5e1", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "10px", textAlign: "left", color: "#334155" }}>Descripción de la Acción</th>
                  <th style={{ padding: "10px", textAlign: "center", color: "#334155", width: "80px" }}>Nivel</th>
                  <th style={{ padding: "10px", textAlign: "center", color: "#334155", width: "100px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px", color: "#334155" }}>{task.description}</td>
                    <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold", color: "#64748b" }}>
                      {task.intervention_level === "first_level" ? "1°" : task.intervention_level === "second_level" ? "2°" : "3°"}
                    </td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <span style={{ 
                        display: "inline-block", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold",
                        backgroundColor: task.status === "completed" ? "#d1fae5" : task.status === "in_progress" ? "#fef3c7" : "#f1f5f9",
                        color: task.status === "completed" ? "#065f46" : task.status === "in_progress" ? "#92400e" : "#475569"
                      }}>
                        {task.status === "pending" ? "Por Hacer" : task.status === "in_progress" ? "En Progreso" : "Completado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: "20px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>No hay tareas registradas en el Plan de Acción en este momento.</p>
            </div>
          )}
        </div>

        <div>
          <h4 style={{ color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Info size={20} color="#3b82f6" /> Sugerencias Normativas No Atendidas
          </h4>
          {suggestions && suggestions.length > 0 ? (
            <ul style={{ fontSize: "12px", color: "#475569", paddingLeft: "20px", lineHeight: "1.6" }}>
              {suggestions.map((sugg, i) => (
                <li key={i} style={{ marginBottom: "10px" }}>
                  <span style={{ fontWeight: "bold", color: sugg.intervention_level === "first_level" ? "#3b82f6" : "#f59e0b" }}>
                    {sugg.intervention_level === "first_level" ? "[1° Nivel]" : "[2° Nivel]"}
                  </span>{" "}
                  {sugg.description}
                </li>
              ))}
            </ul>
          ) : (
             <p style={{ fontSize: "13px", color: "#64748b" }}>Todas las sugerencias han sido integradas al Plan de Acción.</p>
          )}
        </div>
      </PageContainer>

      <PageBreak />

      {/* ----------------- PÁGINA 6: GLOSARIO ----------------- */}
      <PageContainer>
        <SectionTitle title="Anexo: Glosario de Criterios de Acción" />
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "30px" }}>
          Acorde al Diario Oficial de la Federación (DOF), estos son los niveles de riesgo y las acciones normativas correspondientes que la empresa debe tomar.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <div style={{ borderLeft: `4px solid ${RISK_COLORS["Muy Alto"]}`, padding: "15px", backgroundColor: "#f8fafc", borderRadius: "0 8px 8px 0" }}>
            <h4 style={{ margin: "0 0 5px 0", color: RISK_COLORS["Muy Alto"], display: "flex", alignItems: "center", gap: "8px" }}>
              Riesgo Muy Alto
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
              Se requiere realizar el análisis de cada categoría y dominio para establecer las acciones de intervención apropiadas, mediante un Programa de Intervención que deberá incluir evaluaciones específicas y contemplar campañas de sensibilización, revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión.
            </p>
          </div>

          <div style={{ borderLeft: `4px solid ${RISK_COLORS["Alto"]}`, padding: "15px", backgroundColor: "#f8fafc", borderRadius: "0 8px 8px 0" }}>
            <h4 style={{ margin: "0 0 5px 0", color: RISK_COLORS["Alto"], display: "flex", alignItems: "center", gap: "8px" }}>
              Riesgo Alto
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
              Se requiere realizar un análisis de cada categoría y dominio, de manera que se puedan determinar las acciones de intervención apropiadas a través de un Programa de Intervención, que podrá incluir una evaluación específica y deberá incluir una campaña de sensibilización, revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial.
            </p>
          </div>

          <div style={{ borderLeft: `4px solid ${RISK_COLORS["Medio"]}`, padding: "15px", backgroundColor: "#f8fafc", borderRadius: "0 8px 8px 0" }}>
            <h4 style={{ margin: "0 0 5px 0", color: RISK_COLORS["Medio"], display: "flex", alignItems: "center", gap: "8px" }}>
              Riesgo Medio
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
              Se requiere revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión, mediante un Programa de Intervención.
            </p>
          </div>

          <div style={{ borderLeft: `4px solid ${RISK_COLORS["Bajo"]}`, padding: "15px", backgroundColor: "#f8fafc", borderRadius: "0 8px 8px 0" }}>
            <h4 style={{ margin: "0 0 5px 0", color: RISK_COLORS["Bajo"], display: "flex", alignItems: "center", gap: "8px" }}>
              Riesgo Bajo
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
              Es necesario una mayor difusión de la política de prevención de riesgos psicosociales y programas para: la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral.
            </p>
          </div>

          <div style={{ borderLeft: `4px solid ${RISK_COLORS["Nulo"]}`, padding: "15px", backgroundColor: "#f8fafc", borderRadius: "0 8px 8px 0" }}>
            <h4 style={{ margin: "0 0 5px 0", color: RISK_COLORS["Nulo"], display: "flex", alignItems: "center", gap: "8px" }}>
              Riesgo Nulo
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
              El riesgo resulta no significativo. No se requieren medidas adicionales, más allá de mantener y promover las políticas actuales.
            </p>
          </div>

        </div>
      </PageContainer>

    </div>
  );
});
