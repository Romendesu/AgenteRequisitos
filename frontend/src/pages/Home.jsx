import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Aside from "../components/layout/Aside";
import Dock from "../components/layout/Dock";
import RequirementsPanel from "../components/layout/RequirementsPanel";
import Settings from "./Settings";
import useIsMobile from "../hooks/matchMedia";
import useAside from "../hooks/useAside";
import useChat, { PHASE } from "../hooks/useChat";
import useAuth from "../hooks/useAuth";
import ChatMessage from "../components/ui/ChatMessage";
import PromptLabel from "../components/ui/PromptLabel";

// ─── Formulario de configuración del proyecto ────────────────────────────────

function ProjectSetupForm({ onStart, loading }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const handleStart = () => {
    if (!nombre.trim()) return;
    onStart(nombre.trim(), descripcion.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mx-auto">
            M
          </div>
          <h1 className="text-2xl font-extrabold text-white">MoSCoW AI</h1>
          <p className="text-gray-400 text-sm">
            Cuéntame sobre tu proyecto antes de comenzar
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre del proyecto
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: Sistema de gestión de inventario"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              ¿Para qué servirá este sistema?
            </label>
            <textarea
              rows="3"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe brevemente el propósito y los usuarios del sistema..."
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none resize-none border border-gray-700 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
            />
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!nombre.trim() || loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {loading ? "Creando proyecto..." : "Comenzar →"}
        </button>
      </div>
    </div>
  );
}

// ─── Indicador de carga ──────────────────────────────────────────────────────

function TypingIndicator({ step }) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-xs text-white font-bold select-none mt-1">
        AI
      </div>
      <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex flex-col gap-2 max-w-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
        {step && (
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-indigo-400 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-xs text-indigo-300 font-medium leading-tight">{step}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function Home() {
  const isMobile = useIsMobile();
  const { showAside: isOpen, showText, toggleAside } = useAside(true);
  const { messages, phase, loading, loadingStep, requisitos, moscowLabels, submit, continuar, finalizar, iniciarProyecto, cargarProyecto, reset } = useChat();
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const [asideKey, setAsideKey] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const showInput = phase === PHASE.COLLECTING && !loading;
  const showConfirm = phase === PHASE.WAITING && !loading;
  const isSetup = phase === PHASE.SETUP;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleNewProject() {
    reset();
  }

  async function handleSelectProject(project) {
    await cargarProyecto(project);
  }

  async function handleContinueProject(project) {
    await cargarProyecto(project);
    continuar();
  }

  async function handleIniciarProyecto(nombre, descripcion) {
    await iniciarProyecto(nombre, descripcion);
    setAsideKey((k) => k + 1);
  }

  async function handleSubmit(texto) {
    await submit(texto);
    setAsideKey((k) => k + 1);
  }

  const showPanel = !isMobile && phase !== PHASE.SETUP;

  return (
    <div className="h-screen bg-gray-950 overflow-hidden">
      {isMobile ? (
        <Dock toggleAside={toggleAside} />
      ) : (
        <Aside
          refreshKey={asideKey}
          isOpen={isOpen}
          showText={showText}
          toggleAside={toggleAside}
          onNewProject={handleNewProject}
          onSelectProject={handleSelectProject}
          onContinueProject={handleContinueProject}
          user={user}
          onLogout={handleLogout}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {showSettings && (
        <Settings
          user={user}
          onClose={() => setShowSettings(false)}
          onUpdateProfile={updateProfile}
        />
      )}

      {showPanel && (
        <RequirementsPanel
          requisitos={requisitos}
          moscowLabels={moscowLabels}
          isOpen={panelOpen}
          onToggle={() => setPanelOpen((v) => !v)}
        />
      )}

      <main
        style={{ transition: "margin 360ms cubic-bezier(0.32,0.72,0,1)" }}
        className={`flex flex-col h-screen ${
          !isMobile ? (isOpen ? "ml-64" : "ml-16") : "pb-16"
        } ${showPanel && panelOpen ? "mr-72" : showPanel ? "mr-5" : ""}`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-8">
          {isSetup ? (
            <ProjectSetupForm onStart={handleIniciarProyecto} loading={loading} />
          ) : (
            <div className="max-w-2xl mx-auto">
              {messages.map((m) => (
                <ChatMessage key={m.id} msg={m} />
              ))}
              {loading && <TypingIndicator step={loadingStep} />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {!isSetup && (
          <div className="px-4 pb-6 flex-shrink-0">
            <div className="max-w-2xl mx-auto space-y-3">
              {showConfirm && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={continuar}
                    className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-full text-sm font-medium transition-colors border border-gray-700"
                  >
                    Sí, añadir más
                  </button>
                  <button
                    onClick={finalizar}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    No, generar documento
                  </button>
                </div>
              )}
              {showInput && <PromptLabel onSubmit={handleSubmit} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
