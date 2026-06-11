// frontend/src/pages/ActionPlanTracker.jsx
import React, { useEffect, useState } from "react";
import { 
  Kanban, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle, 
  ArrowLeftRight, 
  Sparkles,
  AlertCircle,
  Clock
} from "lucide-react";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ThemeToggle from "../components/ThemeToggle";

const INTERVENTION_LABELS = {
  "first_level": "Primer Nivel (Organizacional y Políticas)",
  "second_level": "Segundo Nivel (Grupal y Sensibilización)",
  "third_level": "Tercer Nivel (Individual y Canalización Clínica)"
};

export default function ActionPlanTracker() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  
  // Create task modal state
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    intervention_level: "first_level",
    description: "",
    due_date: ""
  });

  const fetchData = async () => {
    try {
      const [compRes, tasksRes, suggRes] = await Promise.all([
        api.get("/api/company/me"),
        api.get("/api/action_plan/tasks"),
        api.get("/api/action_plan/suggested")
      ]);
      setCompany(compRes.data);
      setTasks(tasksRes.data);
      setSuggestions(suggRes.data.suggestions || []);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los datos del plan de acción.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.description.trim()) return;

    try {
      const res = await api.post("/api/action_plan/tasks", newTask);
      setTasks([...tasks, res.data]);
      setShowModal(false);
      setNewTask({
        intervention_level: "first_level",
        description: "",
        due_date: ""
      });
    } catch (err) {
      console.error(err);
      alert("No se pudo crear la tarea.");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/api/action_plan/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el estado de la tarea.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("¿Está seguro de que desea eliminar esta tarea?")) return;
    try {
      await api.delete(`/api/action_plan/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar la tarea.");
    }
  };

  const handleAddSuggestion = async (sugg) => {
    try {
      const res = await api.post("/api/action_plan/tasks", {
        category_flagged: sugg.category_flagged,
        intervention_level: sugg.intervention_level,
        description: sugg.description,
        status: "pending"
      });
      setTasks([...tasks, res.data]);
      // Remove suggestion from list
      setSuggestions(suggestions.filter(s => s.description !== sugg.description));
    } catch (err) {
      console.error(err);
      alert("No se pudo agregar la recomendación.");
    }
  };

  // Group tasks by status
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const renderTaskCard = (task) => (
    <div key={task.id} className="glass-card animate-fade-in" style={{ padding: "16px", marginBottom: "12px", border: "1px solid var(--border-color)", position: "relative" }}>
      
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
           "3° Nivel (Clínico)"}
        </span>
        <button
          onClick={() => handleDeleteTask(task.id)}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", transition: "color 0.2s" }}
          onMouseEnter={(e) => e.target.style.color = "var(--color-danger)"}
          onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.5", marginBottom: "12px" }}>
        {task.description}
      </p>

      {task.category_flagged && (
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px", fontStyle: "italic" }}>
          Origen: {task.category_flagged}
        </div>
      )}

      {/* Footer controls */}
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
  );

  return (
    <div className="app-container">
      <Sidebar company={company} />

      <main className="main-content">
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.02em" }}>Plan de Acción</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Gestión de tareas de intervención organizacional, grupal y clínica de {company?.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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

        {/* Suggested Actions Panel */}
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
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {suggestions.map((sugg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", color: "var(--color-primary)", marginRight: "8px" }}>
                      {sugg.intervention_level === "first_level" ? "1° Nivel" : "2° Nivel"}
                    </span>
                    <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{sugg.description}</span>
                  </div>
                  <button onClick={() => handleAddSuggestion(sugg)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", flexShrink: 0 }}>
                    <Plus size={14} /> Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kanban Board Columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", flex: 1, minHeight: "500px" }}>
          
          {/* Columna 1: Pendientes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "3px solid var(--text-muted)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Por Hacer</h3>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary)", padding: "2px 8px", borderRadius: "10px" }}>
                {pendingTasks.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {pendingTasks.map(renderTaskCard)}
            </div>
          </div>

          {/* Columna 2: En Progreso */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "3px solid var(--color-warning)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>En Progreso</h3>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-warning)", backgroundColor: "var(--color-warning-bg)", padding: "2px 8px", borderRadius: "10px" }}>
                {inProgressTasks.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {inProgressTasks.map(renderTaskCard)}
            </div>
          </div>

          {/* Columna 3: Completados */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "3px solid var(--color-success)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Completado</h3>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-success)", backgroundColor: "var(--color-success-bg)", padding: "2px 8px", borderRadius: "10px" }}>
                {completedTasks.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {completedTasks.map(renderTaskCard)}
            </div>
          </div>

        </div>

        {/* Create Task Modal */}
        {showModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
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
                    placeholder="ej. Organizar taller grupal sobre manejo de estrés..."
                    className="form-input"
                    style={{ height: "100px", resize: "none" }}
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
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
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Crear Tarea
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
