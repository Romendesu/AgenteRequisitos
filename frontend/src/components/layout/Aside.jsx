import { useEffect, useState, useRef } from "react";
import bars from "../../assets/images/bars.svg";
import chat from "../../assets/images/chat.svg";
import authIcon from "../../assets/images/auth.svg";
import Button from "./Button";
import { listarProyectos, listarRequisitos, obtenerPreview, eliminarProyecto } from "../../services/api";

// ─── Modal de vista previa ────────────────────────────────────────────────────

function PreviewModal({ project, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    obtenerPreview(project.id)
      .then((data) => setContent(data.contenido))
      .catch(() => setError("No hay documento generado para este proyecto todavía."))
      .finally(() => setLoading(false));
  }, [project.id]);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold text-sm">Vista previa del documento</h2>
            <p className="text-gray-400 text-xs mt-0.5 truncate max-w-sm">{project.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center h-32 gap-2 text-gray-400 text-sm">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Cargando documento...
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-32 text-amber-400 text-sm text-center px-4">
              {error}
            </div>
          )}
          {content && (
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fila de proyecto expandible ─────────────────────────────────────────────

function ProjectRow({ project, isOpen: sidebarOpen, onSelect, onContinue, onDelete, onPreview }) {
  const [expanded, setExpanded] = useState(false);
  const [reqCount, setReqCount] = useState(project.total_requisitos ?? 0);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleExpand(e) {
    e.stopPropagation();
    if (!sidebarOpen) {
      onSelect(project);
      return;
    }
    if (!expanded) {
      setLoadingReqs(true);
      try {
        const data = await listarRequisitos(project.id);
        setReqCount(data.total ?? data.requisitos?.length ?? 0);
      } catch { /* usa el count que ya tiene */ }
      setLoadingReqs(false);
    }
    setExpanded((v) => !v);
  }

  function handleDelete(e) {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete(project.id);
  }

  return (
    <div className="rounded-lg overflow-hidden">
      {/* Cabecera del proyecto */}
      <button
        onClick={handleExpand}
        title={project.nombre}
        className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-700 transition-colors text-left group"
      >
        <div className="w-6 h-6 flex-shrink-0 rounded-md bg-indigo-600/30 flex items-center justify-center text-xs text-indigo-400 font-bold">
          {project.nombre.charAt(0).toUpperCase()}
        </div>
        {sidebarOpen && (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-200 truncate leading-tight">{project.nombre}</p>
              <p className="text-xs text-gray-500">
                {loadingReqs ? "cargando..." : `${reqCount} requisito${reqCount !== 1 ? "s" : ""}`}
              </p>
            </div>
            <svg
              className={`w-3 h-3 text-gray-500 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Acciones expandidas */}
      {sidebarOpen && expanded && (
        <div className="bg-gray-900/50 border-t border-gray-700/50 px-2 py-1.5 space-y-0.5">
          <ActionBtn
            onClick={(e) => { e.stopPropagation(); onSelect(project); }}
            icon="open"
            label="Abrir conversación"
          />
          <ActionBtn
            onClick={(e) => { e.stopPropagation(); onContinue(project); }}
            icon="edit"
            label="Añadir requisitos"
          />
          <ActionBtn
            onClick={(e) => { e.stopPropagation(); onPreview(project); }}
            icon="preview"
            label="Vista previa doc."
          />
          <ActionBtn
            onClick={handleDelete}
            icon={confirmDelete ? "warn" : "trash"}
            label={confirmDelete ? "¿Confirmar eliminación?" : "Eliminar proyecto"}
            danger
            warning={confirmDelete}
          />
        </div>
      )}
    </div>
  );
}

const ICONS = {
  open: (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  edit: (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4v16m8-8H4" />
    </svg>
  ),
  preview: (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  trash: (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  warn: (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
};

function ActionBtn({ onClick, icon, label, danger, warning }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
        warning
          ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
          : danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-gray-300 hover:bg-gray-700"
      }`}
    >
      {ICONS[icon]}
      <span>{label}</span>
    </button>
  );
}

// ─── Sidebar principal ────────────────────────────────────────────────────────

export default function Aside({
  isOpen, showText, toggleAside,
  onNewProject, onSelectProject, onContinueProject,
  user, onLogout, refreshKey,
}) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [previewProject, setPreviewProject] = useState(null);

  useEffect(() => {
    listarProyectos()
      .then(setProjects)
      .catch(() => {});
  }, [refreshKey]);

  const filtered = search.trim()
    ? projects.filter((p) =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  async function handleDelete(projectId) {
    try {
      await eliminarProyecto(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch { /* silencioso */ }
  }

  return (
    <>
      {previewProject && (
        <PreviewModal project={previewProject} onClose={() => setPreviewProject(null)} />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-gray-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-10 ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        {/* TOP */}
        <div className="p-3 flex items-center gap-2">
          <Button icon={bars} onClick={toggleAside} />
          {isOpen && <span className="text-white font-bold text-sm truncate">MoSCoW AI</span>}
        </div>

        <hr className="border-gray-600 mx-3" />

        {/* Nuevo proyecto */}
        <div className="p-3">
          <Button icon={chat} onClick={onNewProject}>
            <span className={`transition-opacity duration-200 text-sm ${showText ? "opacity-100" : "opacity-0"}`}>
              Nuevo proyecto
            </span>
          </Button>
        </div>

        <hr className="border-gray-600 mx-3" />

        {/* Barra de búsqueda */}
        {isOpen && (
          <div className="px-3 pt-3">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar proyectos..."
                className="w-full bg-gray-900 text-white text-xs rounded-lg pl-8 pr-7 py-2 outline-none border border-gray-700 focus:border-indigo-500 transition-colors placeholder:text-gray-600"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs">
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista de proyectos */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 mt-2">
          {isOpen && filtered.length > 0 && (
            <p className="text-xs text-gray-500 px-2 pb-1 font-medium uppercase tracking-wider">
              {search ? `Resultados (${filtered.length})` : "Proyectos"}
            </p>
          )}

          {filtered.map((p) => (
            <ProjectRow
              key={p.id}
              project={p}
              isOpen={isOpen}
              onSelect={onSelectProject}
              onContinue={onContinueProject}
              onDelete={handleDelete}
              onPreview={setPreviewProject}
            />
          ))}

          {isOpen && filtered.length === 0 && (
            <p className="text-xs text-gray-600 px-2 italic">
              {search ? "Sin resultados" : "Sin proyectos todavía"}
            </p>
          )}
        </div>

        <hr className="border-gray-600 mx-3" />

        {/* Usuario + logout */}
        <div className="p-3 space-y-1">
          {user && isOpen && (
            <div className="px-2 py-1">
              <p className="text-xs text-gray-300 font-medium truncate">{user.username}</p>
              <p className="text-xs text-gray-600 truncate">{user.email}</p>
            </div>
          )}
          <Button icon={authIcon} onClick={onLogout}>
            <span className={`transition-opacity duration-200 text-sm text-red-400 ${showText ? "opacity-100" : "opacity-0"}`}>
              Cerrar sesión
            </span>
          </Button>
        </div>
      </aside>
    </>
  );
}
