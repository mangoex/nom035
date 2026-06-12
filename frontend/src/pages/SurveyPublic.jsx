// frontend/src/pages/SurveyPublic.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, ShieldCheck, ClipboardCheck, ArrowLeft, ArrowRight, UserCheck } from "lucide-react";
import api from "../utils/api";
import { QUESTIONS_GUIA_I, QUESTIONS_GUIA_II, QUESTIONS_GUIA_III } from "../utils/questions";
import ThemeToggle from "../components/ThemeToggle";

const LIKERT_OPTIONS = [
  "Siempre",
  "Casi siempre",
  "Algunas veces",
  "Casi nunca",
  "Nunca"
];

const BINARY_OPTIONS = ["Sí", "No"];

export default function SurveyPublic() {
  const { linkHash } = useParams();
  const [loading, setLoading] = useState(true);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [error, setError] = useState("");
  
  // Survey steps: 0 = Demographics, 1 = Questionnaire, 2 = Success
  const [step, setStep] = useState(0);
  
  // Demographics state
  const [demographics, setDemographics] = useState({
    age_range: "26-35",
    gender: "Femenino",
    department: "",
    position: "Operativo",
    serves_customers: "",
    is_boss: ""
  });

  // Questionnaire state
  const [answers, setAnswers] = useState({});
  const [pageIndex, setPageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/api/survey/public/${linkHash}`);
        setCompanyDetails(res.data);
      } catch (err) {
        console.error(err);
        setError("Esta liga de encuesta no es válida, ya expiró o fue desactivada.");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [linkHash]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Cargando encuesta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", padding: "20px", backgroundColor: "var(--bg-primary)" }}>
        <div className="glass-card animate-slide-up" style={{ maxWidth: "480px", width: "100%", padding: "40px", textAlign: "center" }}>
          <h2 style={{ color: "var(--color-danger)", marginBottom: "16px", fontWeight: "800" }}>Enlace Expirado</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>{error}</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Por favor, contacta al departamento de Recursos Humanos de tu empresa.</p>
        </div>
      </div>
    );
  }

  const { company_name, guide_type } = companyDetails;
  
  // Determine questions list
  let questions = [];
  if (guide_type === "GUIA_I") {
    questions = QUESTIONS_GUIA_I;
  } else if (guide_type === "GUIA_II") {
    questions = QUESTIONS_GUIA_II.filter(q => {
      if (q.id >= 41 && q.id <= 43 && demographics.serves_customers === "No") return false;
      if (q.id >= 44 && q.id <= 46 && demographics.is_boss === "No") return false;
      return true;
    });
  } else {
    questions = QUESTIONS_GUIA_III.filter(q => {
      if (q.id >= 65 && q.id <= 68 && demographics.serves_customers === "No") return false;
      if (q.id >= 69 && q.id <= 72 && demographics.is_boss === "No") return false;
      return true;
    });
  }

  const questionsPerPage = 6;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  
  const currentQuestions = questions.slice(
    pageIndex * questionsPerPage,
    (pageIndex + 1) * questionsPerPage
  );

  const handleDemographicChange = (e) => {
    setDemographics({
      ...demographics,
      [e.target.id]: e.target.value
    });
  };

  const handleAnswerSelect = (questionId, value) => {
    setAnswers({
      ...answers,
      [`q${questionId}`]: value
    });
  };

  const handleNextPage = () => {
    // Check if all questions on this page are answered
    const unanswered = currentQuestions.some(q => !answers[`q${q.id}`]);
    if (unanswered) {
      alert("Por favor responda todas las preguntas de esta página antes de continuar.");
      return;
    }

    if (pageIndex < totalPages - 1) {
      setPageIndex(pageIndex + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmitSurvey();
    }
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmitSurvey = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/survey/public/${linkHash}`, {
        demographics,
        answers
      });
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al enviar tus respuestas. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
      padding: "40px 20px"
    }}>
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <ThemeToggle />
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Step 0: Demographics */}
        {step === 0 && (
          <div className="glass-card animate-slide-up" style={{ padding: "40px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-primary)", marginBottom: "16px" }}>
              <ClipboardCheck size={28} />
              <span style={{ fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Cuestionario NOM-035
              </span>
            </div>
            
            <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "12px" }}>
              Bienvenido a la evaluación de {company_name}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px", lineHeight: "1.6" }}>
              Esta evaluación es confidencial y segura. Los datos recopilados se usarán únicamente para fines estadísticos y de mejora organizacional según lo establecido en la norma oficial mexicana <strong>NOM-035-STPS-2018</strong>.
            </p>

            <h3 style={{ fontSize: "15px", fontWeight: "700", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "20px" }}>
              Datos Demográficos (Confidenciales)
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="age_range">Rango de Edad</label>
                <select id="age_range" className="form-input" value={demographics.age_range} onChange={handleDemographicChange}>
                  <option value="Menor de 25">Menor de 25 años</option>
                  <option value="26-35">26 a 35 años</option>
                  <option value="36-45">36 a 45 años</option>
                  <option value="46-55">46 a 55 años</option>
                  <option value="Mas de 55">Más de 55 años</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gender">Género</label>
                <select id="gender" className="form-input" value={demographics.gender} onChange={handleDemographicChange}>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro / Prefiero no decir</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="department">Departamento o Área</label>
                <input
                  id="department"
                  type="text"
                  required
                  placeholder="ej. Ventas, Administración"
                  className="form-input"
                  value={demographics.department}
                  onChange={handleDemographicChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="position">Nivel del Puesto</label>
                <select id="position" className="form-input" value={demographics.position} onChange={handleDemographicChange}>
                  <option value="Operativo">Operativo (Auxiliar, Analista)</option>
                  <option value="Supervisor">Supervisor / Coordinador</option>
                  <option value="Gerencial">Gerente / Director</option>
                </select>
              </div>

              {guide_type !== "GUIA_I" && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="serves_customers">¿En su trabajo atiende a clientes o usuarios?</label>
                    <select id="serves_customers" className="form-input" value={demographics.serves_customers} onChange={handleDemographicChange}>
                      <option value="">Seleccione...</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="is_boss">¿Es usted jefe de otros trabajadores?</label>
                    <select id="is_boss" className="form-input" value={demographics.is_boss} onChange={handleDemographicChange}>
                      <option value="">Seleccione...</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => {
                if (!demographics.department.trim()) {
                  alert("Por favor ingrese su departamento o área.");
                  return;
                }
                if (guide_type !== "GUIA_I") {
                  if (!demographics.serves_customers) {
                    alert("Por favor responda si atiende a clientes o usuarios.");
                    return;
                  }
                  if (!demographics.is_boss) {
                    alert("Por favor responda si es jefe de otros trabajadores.");
                    return;
                  }
                }
                setStep(1);
              }}
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px" }}
            >
              Comenzar Encuesta
            </button>
          </div>
        )}

        {/* Step 1: Questionnaire */}
        {step === 1 && (
          <div className="glass-card animate-slide-up" style={{ padding: "40px" }}>
            
            {/* Progress Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "var(--color-primary)", letterSpacing: "0.05em" }}>
                  {guide_type === "GUIA_I" ? "Guía de Referencia I - Acontecimientos" : 
                   guide_type === "GUIA_II" ? "Guía de Referencia II - Factores Psicosociales" : 
                   "Guía de Referencia III - Entorno Organizacional"}
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Página {pageIndex + 1} de {totalPages}</h2>
              </div>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)" }}>
                Progreso: {Math.round(((pageIndex) / totalPages) * 100)}%
              </span>
            </div>

            {/* Questions list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px", marginBottom: "40px" }}>
              {currentQuestions.map((q) => (
                <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid var(--bg-secondary)", paddingBottom: "16px" }}>
                  <p style={{ fontSize: "15px", fontWeight: "500", lineHeight: "1.5" }}>
                    <strong>{q.id}.</strong> {q.text}
                  </p>
                  
                  {/* Options */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
                    {(guide_type === "GUIA_I" ? BINARY_OPTIONS : LIKERT_OPTIONS).map((opt) => {
                      const isSelected = answers[`q${q.id}`] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleAnswerSelect(q.id, opt)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "var(--radius-sm)",
                            border: isSelected ? "1px solid var(--color-primary)" : "1px solid var(--border-color)",
                            backgroundColor: isSelected ? "rgba(99, 102, 241, 0.08)" : "var(--bg-card)",
                            color: isSelected ? "var(--color-primary)" : "var(--text-primary)",
                            fontSize: "13px",
                            fontWeight: isSelected ? "600" : "400",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.target.style.backgroundColor = "var(--bg-secondary)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.target.style.backgroundColor = "var(--bg-card)";
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={handlePrevPage}
                disabled={pageIndex === 0}
                className="btn btn-secondary"
                style={{ opacity: pageIndex === 0 ? 0.5 : 1, cursor: pageIndex === 0 ? "not-allowed" : "pointer" }}
              >
                <ArrowLeft size={16} />
                Atrás
              </button>

              <button
                onClick={handleNextPage}
                disabled={submitting}
                className="btn btn-primary"
              >
                {pageIndex === totalPages - 1 ? 
                  (submitting ? "Enviando..." : "Finalizar Encuesta") : 
                  "Siguiente"
                }
                {pageIndex < totalPages - 1 && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Success */}
        {step === 2 && (
          <div className="glass-card animate-slide-up" style={{ padding: "48px", textAlign: "center" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--color-success-bg)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px"
            }}>
              <CheckCircle2 size={36} style={{ color: "var(--color-success)" }} />
            </div>

            <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "12px" }}>
              ¡Encuesta Completada Exitosamente!
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px", lineHeight: "1.6", maxWidth: "480px", margin: "0 auto 32px" }}>
              Tus respuestas han sido procesadas de forma anónima y segura. Muchas gracias por tu valiosa participación para propiciar un mejor ambiente laboral en <strong>{company_name}</strong>.
            </p>

            <div style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              fontSize: "12px",
              borderTop: "1px solid var(--border-color)",
              paddingTop: "20px",
              maxWidth: "280px",
              margin: "0 auto"
            }}>
              <ShieldCheck size={16} />
              <span>Cumplimiento Oficial NOM-035</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
