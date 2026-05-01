import { useEffect, useState, useRef } from "react";
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

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold text-sm">Vista previa del documento</h2>
            <p className="text-gray-400 text-xs mt-0.5 truncate max-w-sm">{project.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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
          {error && <div className="flex items-center justify-center h-32 text-amber-400 text-sm text-center px-4">{error}</div>}
          {content && <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{content}</pre>}
        </div>
      </div>
    </div>
  );
}

// ─── Fila de proyecto expandible ─────────────────────────────────────────────

const ICONS = {
  open: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  edit: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  preview: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  trash: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  warn: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>,
};

function ActionBtn({ onClick, icon, label, danger, warning }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 text-left ${
        warning ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
        : danger ? "text-red-400 hover:bg-red-500/10"
        : "text-slate-300 hover:bg-slate-700/50 hover:text-slate-100"
      }`}
    >
      {ICONS[icon]}
      <span className="truncate">{label}</span>
    </button>
  );
}

function ProjectRow({ project, isOpen: sidebarOpen, onSelect, onContinue, onDelete, onPreview }) {
  const [expanded, setExpanded] = useState(false);
  const [reqCount, setReqCount] = useState(project.total_requisitos ?? 0);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleExpand(e) {
    e.stopPropagation();
    if (!sidebarOpen) { onSelect(project); return; }
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
    <div className="rounded-lg overflow-hidden group">
      {/* Row: icono fijo, texto deslizante */}
      <button
        onClick={handleExpand}
        title={project.nombre}
        className={`flex items-center gap-2 h-11 mx-1 px-3 rounded-lg hover:bg-slate-800 transition-all duration-200 text-left group-hover:shadow-md ${sidebarOpen ? "w-full" : "w-fit justify-center"}`}
      >
        {/* Icono del proyecto */}
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {project.nombre.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* Texto */}
        {sidebarOpen && (
          <>
            <div className="min-w-0 flex-1 sidebar-text">
              <p className="text-sm font-medium text-slate-100 leading-tight truncate">{project.nombre}</p>
              <p className="text-xs text-slate-400">
                {loadingReqs ? "cargando..." : `${reqCount} ${reqCount !== 1 ? "requisitos" : "requisito"}`}
              </p>
            </div>
            <svg
              className={`sidebar-text w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Submenú de acciones elegante */}
      {sidebarOpen && expanded && (
        <div className="bg-slate-900/80 border-t border-slate-700 pl-4 pr-1 py-2 space-y-1 animate-slide-down backdrop-blur-sm">
          <ActionBtn onClick={(e) => { e.stopPropagation(); onSelect(project); }} icon="open" label="Abrir conversación" />
          <ActionBtn onClick={(e) => { e.stopPropagation(); onContinue(project); }} icon="edit" label="Añadir requisitos" />
          <ActionBtn onClick={(e) => { e.stopPropagation(); onPreview(project); }} icon="preview" label="Vista previa doc." />
          <ActionBtn onClick={handleDelete} icon={confirmDelete ? "warn" : "trash"} label={confirmDelete ? "¿Confirmar eliminación?" : "Eliminar proyecto"} danger warning={confirmDelete} />
        </div>
      )}
    </div>
  );
}

// ─── Sidebar principal ────────────────────────────────────────────────────────

export default function Aside({
  isOpen, toggleAside,
  onNewProject, onSelectProject, onContinueProject,
  user, onLogout, onSettings, refreshKey,
}) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [previewProject, setPreviewProject] = useState(null);

  useEffect(() => {
    listarProyectos().then(setProjects).catch(() => {});
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
        className={`sidebar fixed left-0 top-0 h-screen bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden z-10 transition-all duration-320 ${isOpen ? "px-3" : ""} ${
          isOpen ? "w-64 shadow-xl shadow-black/20" : "w-20"
        }`}
      >
        {/* ── HEADER LOGO ── */}
        <div className="flex items-center justify-between h-16 flex-shrink-0 px-1">
          <button
            onClick={toggleAside}
            className={`p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white flex items-center gap-2 ${isOpen ? "w-full justify-start" : "w-10 justify-center"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {isOpen && <span className="ml-3 font-semibold text-sm tracking-wide text-white">MoSCoW AI</span>}
          </button>
        </div>

        {/* ── ACCIÓN PRINCIPAL: NUEVO PROYECTO ── */}
        <div className="px-1 pb-3">
          <button
            onClick={onNewProject}
            className={`flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium text-sm hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 shadow-md hover:shadow-lg ${
              !isOpen && "p-2 justify-center"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isOpen && <span>Nuevo proyecto</span>}
          </button>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        {/* ── BUSCADOR ── */}
        {isOpen && (
          <div className="px-1 py-3 animate-slide-down">
            <div className="relative group">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar proyectos..."
                className="w-full bg-slate-900 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors placeholder:text-slate-500"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── LISTA DE PROYECTOS ── */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {isOpen && filtered.length > 0 && (
            <p className="text-xs font-semibold uppercase text-slate-400 pl-5 pb-2 pt-2 tracking-wider animate-slide-down">
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
            <p className="text-xs text-slate-500 pl-5 italic pt-2">
              {search ? "Sin resultados" : "Sin proyectos todavía"}
            </p>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        {/* ── FOOTER: USUARIO ── */}
        <div className="py-3 px-1 space-y-2">

          {/* Avatar + info */}
          <div className={`flex items-center h-11 rounded-lg ${isOpen ? "px-2" : "justify-center"}`}>
            <div className="flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white select-none">
                  {(user?.username ?? "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            {isOpen && (
              <div className="ml-3 min-w-0 flex-1 sidebar-text">
                <p className="text-xs font-medium text-white truncate">{user?.username}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Configuración */}
          <button
            onClick={onSettings}
            className={`flex items-center justify-center gap-2 h-10 mx-1 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200 ${isOpen ? "w-full justify-start pl-3" : ""}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isOpen && <span className="text-sm">Configuración</span>}
          </button>

          {/* Cerrar sesión */}
          <button
            onClick={onLogout}
            className={`flex items-center justify-center gap-2 h-10 mx-1 rounded-lg hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300 ${isOpen ? "w-full justify-start pl-3" : ""}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isOpen && <span className="text-sm">Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
