// frontend/src/pages/SurveyPublic.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, ShieldCheck, ClipboardCheck, ArrowLeft, ArrowRight, UserCheck, Lock, AlertCircle } from "lucide-react";
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

  // Secret Key Validation state
  const [requiresClave, setRequiresClave] = useState(false);
  const [enteredClave, setEnteredClave] = useState("");
  const [claveInput, setClaveInput] = useState("");
  const [claveError, setClaveError] = useState("");

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/api/survey/public/${linkHash}`);
        setCompanyDetails(res.data);
        if (res.data.requires_clave) {
          setRequiresClave(true);
        }
      } catch (err) {
        console.error(err);
        setError("Esta liga de encuesta no es válida, ya expiró o fue desactivada.");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [linkHash]);

  const handleVerifyClave = async (e) => {
    e.preventDefault();
    setClaveError("");
    setLoading(true);
    try {
      const res = await api.get(`/api/survey/public/${linkHash}?clave=${encodeURIComponent(claveInput)}`);
      setCompanyDetails(res.data);
      setEnteredClave(claveInput);
      setRequiresClave(false);
    } catch (err) {
      console.error(err);
      setClaveError(err.response?.data?.detail || "Clave secreta incorrecta.");
    } finally {
      setLoading(false);
    }
  };

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
      const qs = enteredClave ? `?clave=${encodeURIComponent(enteredClave)}` : "";
      await api.post(`/api/survey/public/${linkHash}${qs}`, {
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
        
        {requiresClave ? (
          <div className="glass-card animate-slide-up" style={{ maxWidth: "440px", margin: "80px auto 0", padding: "40px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Lock size={28} style={{ color: "var(--color-danger)" }} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", textAlign: "center" }}>Encuesta Protegida</h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" }}>
                Esta evaluación de traumas requiere una clave secreta para poder responderla.
              </p>
            </div>

            {claveError && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-danger-bg)",
                color: "var(--color-danger)",
                fontSize: "13px",
                fontWeight: "500",
                marginBottom: "20px"
              }}>
                <AlertCircle size={18} />
                <span>{claveError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyClave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="clave_input">Clave de Acceso</label>
                <input
                  id="clave_input"
                  type="password"
                  required
                  placeholder="Ingresa la clave secreta"
                  className="form-input"
                  value={claveInput}
                  onChange={(e) => setClaveInput(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px" }}>
                Acceder a la Encuesta
              </button>
            </form>
          </div>
        ) : (
          <>
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

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      if (!demographics.department) {
                        alert("Por favor ingrese su departamento.");
                        return;
                      }
                      if (guide_type !== "GUIA_I" && (!demographics.serves_customers || !demographics.is_boss)) {
                        alert("Por favor responda las preguntas de perfil.");
                        return;
                      }
                      setStep(1);
                    }}
                    className="btn btn-primary"
                    style={{ padding: "12px 24px" }}
                  >
                    Comenzar Cuestionario
                    <ArrowRight size={18} style={{ marginLeft: "8px" }} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Questionnaire */}
            {step === 1 && (
              <div className="glass-card animate-slide-up" style={{ padding: "40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--color-primary)" }}>
                    Página {pageIndex + 1} de {totalPages}
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {Object.keys(answers).length} de {questions.length} respondidas
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>
                  {currentQuestions.map((q) => (
                    <div key={q.id} style={{ paddingBottom: "20px", borderBottom: "1px solid var(--border-color)" }}>
                      <p style={{ fontSize: "15px", fontWeight: "600", marginBottom: "14px", color: "var(--text-primary)" }}>
                        {q.id}. {q.text}
                      </p>
                      
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {(guide_type === "GUIA_I" ? BINARY_OPTIONS : LIKERT_OPTIONS).map((opt) => {
                          const isSelected = answers[`q${q.id}`] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleAnswerSelect(q.id, opt)}
                              className="btn"
                              style={{
                                padding: "8px 16px",
                                fontSize: "13px",
                                border: "1px solid var(--border-color)",
                                backgroundColor: isSelected ? "var(--color-primary)" : "var(--bg-card)",
                                color: isSelected ? "#ffffff" : "var(--text-primary)",
                                transition: "all 0.15s ease"
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

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    onClick={handlePrevPage}
                    disabled={pageIndex === 0}
                    className="btn btn-secondary"
                    style={{ padding: "12px 20px" }}
                  >
                    <ArrowLeft size={18} style={{ marginRight: "8px" }} />
                    Anterior
                  </button>

                  <button
                    onClick={handleNextPage}
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ padding: "12px 24px" }}
                  >
                    {pageIndex === totalPages - 1 ? (submitting ? "Enviando..." : "Finalizar Encuesta") : "Siguiente"}
                    {pageIndex < totalPages - 1 && <ArrowRight size={18} style={{ marginLeft: "8px" }} />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Success */}
            {step === 2 && (
              <div className="glass-card animate-slide-up" style={{ padding: "60px 40px", textAlign: "center" }}>
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-success-bg)",
                  margin: "0 auto 24px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center"
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
          </>
        )}
      </div>
    </div>
  );
}
