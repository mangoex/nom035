// frontend/src/pages/ActionPlanTracker.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle, 
  ArrowLeftRight, 
  Sparkles,
  AlertCircle,
  Clock,
  Edit
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";
import DimensionImpactDisclosure from "../components/DimensionImpactDisclosure";

const INTERVENTION_LABELS = {
  "first_level": "Primer Nivel (Organizacional y Políticas)",
  "second_level": "Segundo Nivel (Grupal y Sensibilización)",
  "third_level": "Tercer Nivel (Individual y Clínica)"
};

export default function ActionPlanTracker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(searchParams.get("session_id") || "");
  const [pin, setPin] = useState("");
  const [pinRequired, setPinRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    intervention_level: "first_level",
    description: "",
    assigned_to: "",
    due_date: ""
  });
  
  const [editingTask, setEditingTask] = useState(null);

  const fetchData = async () => {
    try {
      setError("");
      const sessionsRes = await api.get("/api/action_plan/available-sessions");
      setSessions(sessionsRes.data);
      if (user?.role === "company_admin") {
        const companyRes = await api.get("/api/company/me");
        setCompany(companyRes.data);
      }
      if (!selectedSessionId) return;
      const suffix = `?survey_session_id=${selectedSessionId}`;
      const [tasksRes, suggRes] = await Promise.all([
        api.get(`/api/action_plan/tasks${suffix}`),
        api.get(`/api/action_plan/suggested${suffix}`),
      ]);
      setTasks(tasksRes.data);
      setSuggestions(suggRes.data.suggestions || []);
      setPinRequired(false);
    } catch (err) {
      if (err.response?.status === 403 && user?.role === "company_admin") {
        setPinRequired(true);
        setError("");
      } else {
        console.error(err);
        setError(err.response?.data?.detail || "Error al cargar los datos del plan de acción.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSessionId]);

  const selectSession = (id) => {
    setSelectedSessionId(id);
    setSearchParams(id ? { session_id: id } : {});
    setTasks([]); setSuggestions([]); setError(""); setPinRequired(false);
  };

  const verifyPin = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/action_plan/access/verify", { survey_session_id: Number(selectedSessionId), pin });
      setPin(""); setError(""); setPinRequired(false); fetchData();
    } catch (err) { setError(err.response?.data?.detail || "No se pudo verificar el PIN."); }
  };

  const actionUrl = (path) => `${path}?survey_session_id=${selectedSessionId}`;

  const handleActionError = (err, fallbackMessage) => {
    if (err.response?.status === 403 && user?.role === "company_admin") {
      setPinRequired(true);
      setError(err.response?.data?.detail || "El acceso por PIN debe renovarse.");
      return;
    }
    console.error(err);
    alert(err.response?.data?.detail || fallbackMessage);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.description.trim()) return;

    try {
      const res = await api.post(actionUrl("/api/action_plan/tasks"), newTask);
      setTasks([...tasks, res.data]);
      setShowModal(false);
      setNewTask({
        intervention_level: "first_level",
        description: "",
        assigned_to: "",
        due_date: ""
      });
    } catch (err) {
      handleActionError(err, "No se pudo crear la tarea.");
    }
  };

  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.description.trim()) return;

    try {
      const res = await api.put(actionUrl(`/api/action_plan/tasks/${editingTask.id}`), {
        intervention_level: editingTask.intervention_level,
        description: editingTask.description,
        assigned_to: editingTask.assigned_to || null,
        due_date: editingTask.due_date || null
      });
      setTasks(tasks.map(t => t.id === editingTask.id ? res.data : t));
      setEditingTask(null);
    } catch (err) {
      handleActionError(err, "No se pudo editar la tarea.");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.put(actionUrl(`/api/action_plan/tasks/${taskId}`), { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
    } catch (err) {
      handleActionError(err, "No se pudo actualizar el estado de la tarea.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("¿Está seguro de que desea eliminar esta tarea?")) return;
    try {
      await api.delete(actionUrl(`/api/action_plan/tasks/${taskId}`));
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      handleActionError(err, "No se pudo eliminar la tarea.");
    }
  };

  const handleAddSuggestion = async (sugg) => {
    try {
      const res = await api.post(actionUrl("/api/action_plan/tasks"), {
        category_flagged: sugg.category_flagged,
        intervention_level: sugg.intervention_level,
        description: sugg.description,
        impacted_dimensions: sugg.impacted_dimensions || [],
        status: "pending"
      });
      setTasks([...tasks, res.data]);
      setSuggestions(suggestions.filter(s => s.description !== sugg.description));
    } catch (err) {
      handleActionError(err, "No se pudo agregar la recomendación.");
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const taskId = parseInt(draggableId.replace('task-', ''), 10);
    const newStatus = destination.droppableId;
    
    // Optimistic UI update
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    // Persist API call
    try {
      await api.put(actionUrl(`/api/action_plan/tasks/${taskId}`), { status: newStatus });
    } catch (err) {
      handleActionError(err, "No se pudo guardar el cambio de columna.");
      // Rollback on fail
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, status: source.droppableId } : t
      ));
    }
  };

  const handleClearBoard = async () => {
    if (!confirm("⚠️ ATENCIÓN: Esta acción borrará permanentemente TODAS las tareas de tu Plan de Acción.\n\n¿Estás completamente seguro de continuar?")) return;
    try {
      await api.delete(actionUrl("/api/action_plan/tasks/all"));
      setTasks([]);
    } catch (err) {
      handleActionError(err, "No se pudo limpiar el tablero.");
    }
  };

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const selectedSession = sessions.find((session) => String(session.id) === String(selectedSessionId));
  const displayCompanyName = company?.name || selectedSession?.company_name || "la empresa seleccionada";

  const renderTaskCard = (task, index) => (
    <Draggable key={task.id} draggableId={`task-${task.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="glass-card animate-fade-in"
          style={{
            ...provided.draggableProps.style,
            padding: "16px",
            marginBottom: "12px",
            border: "1px solid var(--border-color)",
            boxShadow: snapshot.isDragging ? "0 10px 20px rgba(0,0,0,0.1)" : "none",
            transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform,
            transition: snapshot.isDragging ? "none" : "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
            <span style={{
              fontSize: "10px",
              fontWeight: "700",
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: task.intervention_level === "third_level" ? "var(--color-danger-bg)" : "var(--bg-secondary)",
              color: task.intervention_level === "third_level" ? "var(--color-danger)" : "var(--text-secondary)"
            }}>
              {task.intervention_level === "first_level" ? "1° Nivel" : 
               task.intervention_level === "second_level" ? "2° Nivel" : 
               "3° Nivel"}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={() => setEditingTask(task)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={(e) => e.target.style.color = "var(--color-primary)"}
                onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDeleteTask(task.id)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={(e) => e.target.style.color = "var(--color-danger)"}
                onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.5", marginBottom: "12px", wordBreak: "break-word" }}>
            {task.description}
          </p>

          {task.category_flagged && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px", fontStyle: "italic" }}>
              Origen: {task.category_flagged}
            </div>
          )}

          {task.impacted_dimensions?.length > 0 && (
            <DimensionImpactDisclosure dimensions={task.impacted_dimensions} compact />
          )}

          {task.assigned_to && (
            <div style={{ fontSize: "12px", color: "var(--color-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
              <span>👤</span> {task.assigned_to}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "10px", marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "4px", alignItems: "center", color: "var(--text-muted)", fontSize: "11px" }}>
              <Clock size={12} />
              <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : "Sin fecha"}</span>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              {task.status === "pending" && (
                <button onClick={() => handleStatusChange(task.id, "in_progress")} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }}>
                  <Play size={12} /> Comenzar
                </button>
              )}
              {task.status === "in_progress" && (
                <button onClick={() => handleStatusChange(task.id, "completed")} className="btn btn-primary" style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "var(--color-success)" }}>
                  <CheckCircle size={12} /> Completar
                </button>
              )}
              {task.status === "completed" && (
                <button onClick={() => handleStatusChange(task.id, "in_progress")} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }}>
                  <ArrowLeftRight size={12} /> Reabrir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

  if (loading) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Cargando plan de acción…</div>;

  if (!selectedSessionId || pinRequired) {
    return (
      <div className="app-container">
        <Sidebar company={company} />
        <main className="main-content" style={{ maxWidth: "720px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800 }}>Plan de Acción</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>Selecciona los resultados de encuesta que deseas consultar. Las tareas se mantienen separadas por encuesta.</p>
          <label className="form-label" htmlFor="action-plan-session">Empresa y encuesta</label>
          <select id="action-plan-session" className="form-input" value={selectedSessionId} onChange={(e) => selectSession(e.target.value)}>
            <option value="">Selecciona una encuesta</option>
            {sessions.map((session) => <option key={session.id} value={session.id}>{session.company_name} · {session.guide_type} · {session.response_count} respuestas</option>)}
          </select>
          {selectedSessionId && user?.role === "company_admin" && (
            !selectedSession?.has_responsible_consultant ? <p style={{ color: "var(--color-danger)", marginTop: "16px" }}>Esta empresa no tiene un consultor responsable asignado; no es posible generar el PIN de acceso.</p> : !selectedSession?.has_action_plan_pin ? <p style={{ color: "var(--text-secondary)", marginTop: "16px" }}>El consultor responsable aún no genera el PIN para esta encuesta.</p> : <form onSubmit={verifyPin} className="glass-card" style={{ marginTop: "20px", padding: "24px", maxWidth: "420px" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>Ingresa el PIN de tu consultor</h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>El PIN es de 4 dígitos y corresponde únicamente a esta encuesta.</p>
              <input className="form-input" inputMode="numeric" pattern="[0-9]{4}" maxLength="4" required value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="0000" aria-label="PIN de 4 dígitos" />
              <button className="btn btn-primary" style={{ marginTop: "12px" }}>Desbloquear plan</button>
            </form>
          )}
          {error && <p style={{ color: "var(--color-danger)", marginTop: "12px" }}>{error}</p>}
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar company={company} />

      <main className="main-content">
        <header className="action-plan-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Plan de Acción</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Gestión de tareas de intervención organizacional, grupal y clínica de {displayCompanyName}
            </p>
            <select aria-label="Cambiar encuesta del plan de acción" className="form-input" style={{ marginTop: "10px", maxWidth: "420px" }} value={selectedSessionId} onChange={(e) => selectSession(e.target.value)}>
              {sessions.map((session) => <option key={session.id} value={session.id}>{session.company_name} · {session.guide_type} · {session.response_count} respuestas</option>)}
            </select>
          </div>
          <div className="action-plan-header-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button onClick={handleClearBoard} className="btn btn-secondary" style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)", backgroundColor: "transparent" }}>
              <Trash2 size={16} /> Limpiar Tablero
            </button>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus size={16} /> Nueva Tarea
            </button>
            <ThemeToggle />
          </div>
        </header>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger)", display: "flex", gap: "10px", alignItems: "center", fontSize: "14px" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="glass-card animate-fade-in" style={{
            border: "1px solid rgba(99, 102, 241, 0.15)",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)",
            backdropFilter: "var(--glass-blur)",
            padding: "24px",
            marginBottom: "12px"
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-primary)", marginBottom: "12px" }}>
              <Sparkles size={20} />
              <h4 style={{ fontWeight: "700", fontSize: "15px" }}>Acciones Sugeridas basadas en Resultados Psicosociales</h4>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.5" }}>
              El sistema identificó categorías en nivel de riesgo medio/alto. Haz clic para incorporar estas recomendaciones a tu Kanban de seguimiento:
            </p>

            <div className="intervention-level-guide" aria-label="Significado de niveles de intervención">
              <span><strong>1° nivel</strong> Organizacional y políticas</span>
              <span><strong>2° nivel</strong> Grupal y sensibilización</span>
              <span><strong>3° nivel</strong> Individual y clínico</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {suggestions.map((sugg, i) => (
                <div key={i} className="suggested-action-row">
                  <div className="suggested-action-main">
                    <div className="suggested-action-copy">
                      <span style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", color: "var(--color-primary)", marginRight: "8px" }}>
                        {sugg.intervention_level === "first_level" ? "1° Nivel" : "2° Nivel"}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{sugg.description}</span>
                    </div>
                    <button onClick={() => handleAddSuggestion(sugg)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", flexShrink: 0 }}>
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                  <DimensionImpactDisclosure dimensions={sugg.impacted_dimensions || []} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kanban Board Layout */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="action-plan-board" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", flex: 1, minHeight: "500px", paddingBottom: "30px" }}>
            
            {/* Por Hacer */}
            <Droppable droppableId="pending">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  style={{ display: "flex", flexDirection: "column", gap: "14px", backgroundColor: snapshot.isDraggingOver ? "var(--bg-secondary)" : "transparent", padding: "8px", borderRadius: "8px", transition: "background 0.2s" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "3px solid var(--text-muted)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Por Hacer</h3>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary)", padding: "2px 8px", borderRadius: "10px" }}>
                      {pendingTasks.length}
                    </span>
                  </div>
                  <div style={{ flex: 1, minHeight: "150px" }}>
                    {pendingTasks.map((t, index) => renderTaskCard(t, index))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* En Progreso */}
            <Droppable droppableId="in_progress">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  style={{ display: "flex", flexDirection: "column", gap: "14px", backgroundColor: snapshot.isDraggingOver ? "var(--bg-secondary)" : "transparent", padding: "8px", borderRadius: "8px", transition: "background 0.2s" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "3px solid var(--color-warning)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700" }}>En Progreso</h3>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-warning)", backgroundColor: "var(--color-warning-bg)", padding: "2px 8px", borderRadius: "10px" }}>
                      {inProgressTasks.length}
                    </span>
                  </div>
                  <div style={{ flex: 1, minHeight: "150px" }}>
                    {inProgressTasks.map((t, index) => renderTaskCard(t, index))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Completado */}
            <Droppable droppableId="completed">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  style={{ display: "flex", flexDirection: "column", gap: "14px", backgroundColor: snapshot.isDraggingOver ? "var(--bg-secondary)" : "transparent", padding: "8px", borderRadius: "8px", transition: "background 0.2s" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "3px solid var(--color-success)" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Completado</h3>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-success)", backgroundColor: "var(--color-success-bg)", padding: "2px 8px", borderRadius: "10px" }}>
                      {completedTasks.length}
                    </span>
                  </div>
                  <div style={{ flex: 1, minHeight: "150px" }}>
                    {completedTasks.map((t, index) => renderTaskCard(t, index))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

          </div>
        </DragDropContext>

        {/* Modal para Crear Tarea */}
        {showModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: "460px", padding: "32px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "20px" }}>Nueva Tarea de Intervención</h3>
              
              <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="intervention_level">Nivel de Intervención</label>
                  <select
                    id="intervention_level"
                    className="form-input"
                    value={newTask.intervention_level}
                    onChange={(e) => setNewTask({ ...newTask, intervention_level: e.target.value })}
                  >
                    <option value="first_level">1° Nivel - Organizacional / Políticas</option>
                    <option value="second_level">2° Nivel - Grupal / Sensibilización</option>
                    <option value="third_level">3° Nivel - Individual / Clínico</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="description">Descripción de la Tarea</label>
                  <textarea
                    id="description"
                    required
                    placeholder="ej. Organizar taller grupal..."
                    className="form-input"
                    style={{ height: "100px", resize: "none" }}
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="assigned_to">Responsable</label>
                  <input
                    id="assigned_to"
                    type="text"
                    placeholder="Nombre del responsable"
                    className="form-input"
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="due_date">Fecha Límite</label>
                  <input
                    id="due_date"
                    type="date"
                    className="form-input"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                  <button type="submit" className="btn btn-primary">Crear Tarea</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para Editar Tarea */}
        {editingTask && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: "460px", padding: "32px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "20px" }}>Editar Tarea</h3>
              
              <form onSubmit={handleEditTaskSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Nivel de Intervención</label>
                  <select
                    className="form-input"
                    value={editingTask.intervention_level}
                    onChange={(e) => setEditingTask({ ...editingTask, intervention_level: e.target.value })}
                  >
                    <option value="first_level">1° Nivel - Organizacional / Políticas</option>
                    <option value="second_level">2° Nivel - Grupal / Sensibilización</option>
                    <option value="third_level">3° Nivel - Individual / Clínico</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    required
                    className="form-input"
                    style={{ height: "100px", resize: "none" }}
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Responsable</label>
                  <input
                    type="text"
                    placeholder="Nombre del responsable"
                    className="form-input"
                    value={editingTask.assigned_to || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, assigned_to: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha Límite</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingTask.due_date || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button type="button" onClick={() => setEditingTask(null)} className="btn btn-secondary">Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: "var(--color-primary)" }}>Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
