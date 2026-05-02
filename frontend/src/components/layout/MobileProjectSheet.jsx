import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { listarProyectos, listarRequisitos, obtenerPreview, eliminarProyecto } from "../../services/api";
import { parseMarkdown } from "../../utils/markdown";

// ─── Modal de vista previa (mobile) ──────────────────────────────────────────

function PreviewModal({ project, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerPreview(project.id)
      .then((data) => setContent(data.contenido))
      .catch(() => setError("No hay documento generado para este proyecto todavía."))
      .finally(() => setLoading(false));
  }, [project.id]);

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="modal-overlay fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-end justify-center"
    >
      <div className="modal-panel bg-gray-900 border border-gray-700 rounded-t-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold text-sm">Vista previa</h2>
            <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[240px]">{project.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center h-32 gap-2 text-gray-400 text-sm">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Cargando...
            </div>
          )}
          {error && <p className="text-amber-400 text-sm text-center px-4 py-8">{error}</p>}
          {content && <div className="doc-preview" dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Fila de proyecto ─────────────────────────────────────────────────────────

function ProjectRow({ project, onSelect, onContinue, onPreview, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [reqCount, setReqCount] = useState(project.total_requisitos ?? 0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleExpand() {
    if (!expanded) {
      try {
        const data = await listarRequisitos(project.id);
        setReqCount(data.total ?? data.requisitos?.length ?? 0);
      } catch { /* usa count existente */ }
    }
    setExpanded((v) => !v);
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete(project.id);
  }

  return (
    <div className="rounded-xl overflow-hidden bg-gray-800/50">
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-700/40 transition-colors"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{project.nombre.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{project.nombre}</p>
          <p className="text-xs text-gray-400">{reqCount} {reqCount !== 1 ? "requisitos" : "requisito"}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-1 grid grid-cols-2 gap-2 border-t border-gray-700/50">
          <button onClick={() => onSelect(project)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600/15 text-indigo-400 text-xs font-medium hover:bg-indigo-600/25 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 12.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Abrir chat
          </button>
          <button onClick={() => onContinue(project)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-700/50 text-gray-300 text-xs font-medium hover:bg-gray-600/50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir
          </button>
          <button onClick={() => onPreview(project)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-700/50 text-gray-300 text-xs font-medium hover:bg-gray-600/50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Vista previa
          </button>
          <button onClick={handleDelete}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              confirmDelete
                ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                : "bg-gray-700/50 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={confirmDelete
                  ? "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  : "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"} />
            </svg>
            {confirmDelete ? "¿Confirmar?" : "Eliminar"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sheet principal ──────────────────────────────────────────────────────────

export default function MobileProjectSheet({ onClose, onSelectProject, onContinueProject, onNewProject, refreshKey }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [previewProject, setPreviewProject] = useState(null);

  useEffect(() => {
    listarProyectos().then(setProjects).catch(() => {});
  }, [refreshKey]);

  async function handleDelete(id) {
    try {
      await eliminarProyecto(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch { /* silencioso */ }
  }

  function handleSelect(project) {
    onSelectProject(project);
    onClose();
  }

  function handleContinue(project) {
    onContinueProject(project);
    onClose();
  }

  const filtered = search.trim()
    ? projects.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return createPortal(
    <>
      {previewProject && (
        <PreviewModal project={previewProject} onClose={() => setPreviewProject(null)} />
      )}
      <div
        onClick={(e) => e.target === e.currentTarget && onClose()}
        className="modal-overlay fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end"
      >
        <div className="modal-panel w-full bg-gray-900 border-t border-gray-700 rounded-t-2xl flex flex-col shadow-2xl max-h-[80vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <h2 className="text-white font-semibold text-base">Proyectos</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nuevo proyecto */}
          <div className="px-5 pb-3 flex-shrink-0">
            <button
              onClick={() => { onNewProject(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium text-sm hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo proyecto
            </button>
          </div>

          {/* Buscador */}
          <div className="px-5 pb-3 flex-shrink-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar proyectos..."
                className="w-full bg-gray-800 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 outline-none border border-gray-700 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center pt-4">
                {search ? "Sin resultados" : "Sin proyectos todavía"}
              </p>
            ) : (
              filtered.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onSelect={handleSelect}
                  onContinue={handleContinue}
                  onPreview={setPreviewProject}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
