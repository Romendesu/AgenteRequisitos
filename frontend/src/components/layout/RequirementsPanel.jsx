import { useState } from "react";
import { createPortal } from "react-dom";
import { obtenerPreview, urlDescarga } from "../../services/api";
import { parseMarkdown } from "../../utils/markdown";

// ─── Modal del documento ──────────────────────────────────────────────────────

function DocumentModal({ content, projectId, descargar, onClose }) {
  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="modal-overlay fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="modal-panel bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-white font-semibold text-sm">Documento de requisitos</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="doc-preview" dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
        </div>
        {Object.keys(descargar).length > 0 && (
          <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-700 flex-shrink-0">
            <span className="text-xs text-gray-500 mr-1">Exportar:</span>
            {descargar.md   && <a href={urlDescarga(projectId, "md")}   download target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gray-700 hover:bg-gray-600 transition-colors">Markdown</a>}
            {descargar.pdf  && <a href={urlDescarga(projectId, "pdf")}  download target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-700 hover:bg-rose-600 transition-colors">PDF</a>}
            {descargar.docx && <a href={urlDescarga(projectId, "docx")} download target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-600 transition-colors">Word</a>}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─── Visor de documento en el panel ──────────────────────────────────────────

const MOSCOW_ORDER = ["Must Have", "Should Have", "Could Have", "Won't Have"];
const MOSCOW_CELL = {
  "Must Have":   { color: "text-red-400",    bg: "bg-red-500/10"    },
  "Should Have": { color: "text-orange-400", bg: "bg-orange-500/10" },
  "Could Have":  { color: "text-yellow-400", bg: "bg-yellow-500/10" },
  "Won't Have":  { color: "text-slate-400",  bg: "bg-slate-500/10"  },
};

function DocumentSection({ docInfo, canFinalize, onFinalizar }) {
  const [preview, setPreview]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const labels   = docInfo.priorizacion?.moscow_labels ?? {};
  const descargar = docInfo.doc?.descargar ?? {};
  const counts   = Object.values(labels).reduce((acc, cat) => {
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  async function openModal() {
    if (preview) { setModalOpen(true); return; }
    setLoading(true);
    try {
      const data = await obtenerPreview(docInfo.projectId);
      setPreview(data.contenido);
      setModalOpen(true);
    } catch {
      setPreview("No se pudo cargar el documento.");
      setModalOpen(true);
    }
    setLoading(false);
  }

  return (
    <>
      {modalOpen && preview && (
        <DocumentModal content={preview} projectId={docInfo.projectId} descargar={descargar} onClose={() => setModalOpen(false)} />
      )}

      <div className="border-t border-gray-700 px-3 pt-3 pb-1">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Documento</p>

        {/* MoSCoW grid */}
        <div className="grid grid-cols-4 gap-px bg-gray-700 rounded-lg overflow-hidden mb-2">
          {MOSCOW_ORDER.map((cat) => {
            const { color, bg } = MOSCOW_CELL[cat];
            const count = counts[cat] ?? 0;
            return (
              <div key={cat} className={`${count ? bg : "bg-gray-800"} py-2 flex flex-col items-center gap-0.5`}>
                <span className={`text-sm font-bold tabular-nums ${count ? color : "text-gray-700"}`}>{count}</span>
                <span className="text-[8px] text-gray-500 leading-tight text-center px-0.5">{cat.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>

        {/* Ver documento */}
        <button
          onClick={openModal}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-all duration-200 disabled:opacity-50 mb-2"
        >
          {loading
            ? <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Cargando...</>
            : <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Ver documento</>
          }
        </button>

        {/* Exportar */}
        {Object.keys(descargar).length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[10px] text-gray-600">Exportar</span>
            {descargar.md   && <a href={urlDescarga(docInfo.projectId, "md")}   download target="_blank" rel="noreferrer" className="ml-1 px-2 py-1 rounded text-[10px] font-medium text-white bg-gray-700 hover:bg-gray-600 transition-colors">MD</a>}
            {descargar.pdf  && <a href={urlDescarga(docInfo.projectId, "pdf")}  download target="_blank" rel="noreferrer" className="px-2 py-1 rounded text-[10px] font-medium text-white bg-rose-700 hover:bg-rose-600 transition-colors">PDF</a>}
            {descargar.docx && <a href={urlDescarga(docInfo.projectId, "docx")} download target="_blank" rel="noreferrer" className="px-2 py-1 rounded text-[10px] font-medium text-white bg-indigo-700 hover:bg-indigo-600 transition-colors">Word</a>}
          </div>
        )}

        {/* Actualizar documento si hay nuevos requisitos */}
        {canFinalize && (
          <button
            onClick={onFinalizar}
            className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 rounded-xl border border-indigo-500/40 hover:border-indigo-500/70 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-all duration-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar documento
          </button>
        )}
      </div>
    </>
  );
}

// ─── Configs de tipos y MoSCoW ────────────────────────────────────────────────

const TIPO_CONFIG = {
  Funcional: {
    label: "RF",
    className: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  },
  "No Funcional": {
    label: "RNF",
    className: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
  },
  Dominio: {
    label: "RD",
    className: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
  },
};

const MOSCOW_CONFIG = {
  "Must Have":   { label: "M",  className: "bg-red-500/20 text-red-300 border border-red-500/40" },
  "Should Have": { label: "S",  className: "bg-orange-500/20 text-orange-300 border border-orange-500/40" },
  "Could Have":  { label: "C",  className: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" },
  "Won't Have":  { label: "W",  className: "bg-gray-500/20 text-gray-400 border border-gray-500/40" },
};

const PRIO_COLOR = {
  Alta:  "text-red-400",
  Media: "text-yellow-400",
  Baja:  "text-green-400",
};

function RequirementItem({ req, moscowLabels }) {
  const tipo = TIPO_CONFIG[req.tipo] ?? { label: req.tipo, className: "bg-gray-700 text-gray-300 border border-gray-600" };
  const moscowCat = moscowLabels[req.id];
  const moscow = moscowCat ? MOSCOW_CONFIG[moscowCat] : null;
  const prioColor = PRIO_COLOR[req.prioridad] ?? "text-gray-400";

  return (
    <div className="px-3 py-2.5 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors group">
      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tipo.className}`}>
          {tipo.label}
        </span>
        <span className="text-[10px] font-mono text-gray-500">{req.id}</span>
        {moscow && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${moscow.className}`}>
            {moscow.label}
          </span>
        )}
        {!moscow && (
          <span className={`text-[10px] font-semibold ml-auto ${prioColor}`}>
            {req.prioridad}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
        {req.descripcion}
      </p>
    </div>
  );
}

// ─── Panel colapsable ─────────────────────────────────────────────────────────

export default function RequirementsPanel({ requisitos, moscowLabels, isOpen, onToggle, canFinalize, onFinalizar, docInfo }) {
  const total = requisitos.length;

  const counts = requisitos.reduce((acc, r) => {
    const t = r.tipo === "No Funcional" ? "RNF" : r.tipo === "Dominio" ? "RD" : "RF";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      {/* Botón toggle — siempre visible */}
      <button
        onClick={onToggle}
        title={isOpen ? "Cerrar panel de requisitos" : "Ver requisitos del proyecto"}
        className={`fixed top-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center gap-1
          w-5 h-20 rounded-l-lg bg-gray-700 hover:bg-gray-600 transition-all duration-300
          ${isOpen ? "right-72" : "right-0"}`}
      >
        <svg
          className={`w-3 h-3 text-gray-300 transition-transform duration-300 ${isOpen ? "rotate-0" : "rotate-180"}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 h-screen w-72 bg-gray-800 border-l border-gray-700 flex flex-col z-10
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Requisitos</h2>
            <span className="text-xs text-gray-400 font-mono bg-gray-700 px-2 py-0.5 rounded-full">
              {total}
            </span>
          </div>

          {/* Contadores por tipo */}
          {total > 0 && (
            <div className="flex gap-2 mt-2">
              {Object.entries(counts).map(([tipo, n]) => {
                const cfg = tipo === "RF"
                  ? "bg-blue-500/20 text-blue-300"
                  : tipo === "RNF"
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-amber-500/20 text-amber-300";
                return (
                  <span key={tipo} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg}`}>
                    {tipo} · {n}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {total === 0 ? (
            <div className="flex items-center justify-center h-32 px-4 text-center">
              <p className="text-xs text-gray-500 italic">
                Aquí aparecerán los requisitos conforme los vayas añadiendo.
              </p>
            </div>
          ) : (
            requisitos.map((req) => (
              <RequirementItem key={req.id} req={req} moscowLabels={moscowLabels} />
            ))
          )}
        </div>

        {/* Footer: documento generado o botón de generar */}
        <div className="flex-shrink-0">
          {docInfo
            ? <DocumentSection docInfo={docInfo} canFinalize={canFinalize} onFinalizar={onFinalizar} />
            : canFinalize && (
                <div className="border-t border-gray-700 px-3 py-3">
                  <button
                    onClick={onFinalizar}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-indigo-900/40"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generar documento
                  </button>
                </div>
              )
          }
        </div>
      </aside>
    </>
  );
}
