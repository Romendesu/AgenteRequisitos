import { useState } from "react";
import { createPortal } from "react-dom";
import { obtenerPreview, urlDescarga } from "../../services/api";
import { parseMarkdown } from "../../utils/markdown";

const TIPO_CONFIG = {
  Funcional:      { label: "RF",  className: "bg-blue-500/20 text-blue-300 border border-blue-500/40" },
  "No Funcional": { label: "RNF", className: "bg-purple-500/20 text-purple-300 border border-purple-500/40" },
  Dominio:        { label: "RD",  className: "bg-amber-500/20 text-amber-300 border border-amber-500/40" },
};
const MOSCOW_CONFIG = {
  "Must Have":   { label: "M", className: "bg-red-500/20 text-red-300 border border-red-500/40" },
  "Should Have": { label: "S", className: "bg-orange-500/20 text-orange-300 border border-orange-500/40" },
  "Could Have":  { label: "C", className: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" },
  "Won't Have":  { label: "W", className: "bg-gray-500/20 text-gray-400 border border-gray-500/40" },
};
const MOSCOW_ORDER = ["Must Have", "Should Have", "Could Have", "Won't Have"];
const MOSCOW_CELL = {
  "Must Have":   { color: "text-red-400",    bg: "bg-red-500/10" },
  "Should Have": { color: "text-orange-400", bg: "bg-orange-500/10" },
  "Could Have":  { color: "text-yellow-400", bg: "bg-yellow-500/10" },
  "Won't Have":  { color: "text-slate-400",  bg: "bg-slate-500/10" },
};
const PRIO_COLOR = { Alta: "text-red-400", Media: "text-yellow-400", Baja: "text-green-400" };

function DocumentModal({ content, projectId, descargar, onClose }) {
  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="modal-overlay fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-end"
    >
      <div className="modal-panel bg-gray-900 border-t border-gray-700 rounded-t-2xl w-full max-h-[88vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Documento de requisitos
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="doc-preview" dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
        </div>
        {Object.keys(descargar).length > 0 && (
          <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-700 flex-shrink-0">
            <span className="text-xs text-gray-500 mr-1">Exportar:</span>
            {descargar.md   && <a href={urlDescarga(projectId, "md")}   download target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gray-700 hover:bg-gray-600 transition-colors">MD</a>}
            {descargar.pdf  && <a href={urlDescarga(projectId, "pdf")}  download target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-700 hover:bg-rose-600 transition-colors">PDF</a>}
            {descargar.docx && <a href={urlDescarga(projectId, "docx")} download target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-600 transition-colors">Word</a>}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function MobileRequirementsSheet({ onClose, requisitos, moscowLabels, docInfo, canFinalize, onFinalizar }) {
  const [docPreview, setDocPreview] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);

  const total = requisitos.length;
  const counts = requisitos.reduce((acc, r) => {
    const t = r.tipo === "No Funcional" ? "RNF" : r.tipo === "Dominio" ? "RD" : "RF";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  const labels = docInfo?.priorizacion?.moscow_labels ?? {};
  const descargar = docInfo?.doc?.descargar ?? {};
  const moscowCounts = Object.values(labels).reduce((acc, cat) => {
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  async function openDoc() {
    if (docPreview) { setDocModalOpen(true); return; }
    setLoadingDoc(true);
    try {
      const data = await obtenerPreview(docInfo.projectId);
      setDocPreview(data.contenido);
      setDocModalOpen(true);
    } catch {
      setDocPreview("No se pudo cargar el documento.");
      setDocModalOpen(true);
    }
    setLoadingDoc(false);
  }

  return createPortal(
    <>
      {docModalOpen && docPreview && (
        <DocumentModal content={docPreview} projectId={docInfo?.projectId} descargar={descargar} onClose={() => setDocModalOpen(false)} />
      )}
      <div
        onClick={(e) => e.target === e.currentTarget && onClose()}
        className="modal-overlay fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end"
      >
        <div className="modal-panel w-full bg-gray-900 border-t border-gray-700 rounded-t-2xl flex flex-col shadow-2xl max-h-[85vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold text-base">Requisitos</h2>
              <span className="text-xs text-gray-400 font-mono bg-gray-800 px-2 py-0.5 rounded-full">{total}</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contadores por tipo */}
          {total > 0 && (
            <div className="flex gap-2 px-5 pb-3 flex-shrink-0">
              {Object.entries(counts).map(([tipo, n]) => {
                const cfg = tipo === "RF" ? "bg-blue-500/20 text-blue-300" : tipo === "RNF" ? "bg-purple-500/20 text-purple-300" : "bg-amber-500/20 text-amber-300";
                return <span key={tipo} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg}`}>{tipo} · {n}</span>;
              })}
            </div>
          )}

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-5 pb-2">
            {total === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-8">
                Aquí aparecerán los requisitos conforme los vayas añadiendo.
              </p>
            ) : (
              <div className="space-y-1">
                {requisitos.map((req) => {
                  const tipo = TIPO_CONFIG[req.tipo] ?? { label: req.tipo, className: "bg-gray-700 text-gray-300 border border-gray-600" };
                  const moscowCat = moscowLabels[req.id];
                  const moscow = moscowCat ? MOSCOW_CONFIG[moscowCat] : null;
                  const prioColor = PRIO_COLOR[req.prioridad] ?? "text-gray-400";
                  return (
                    <div key={req.id} className="px-3 py-3 rounded-xl bg-gray-800/60 border border-gray-700/30">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tipo.className}`}>{tipo.label}</span>
                        <span className="text-[10px] font-mono text-gray-500">{req.id}</span>
                        {moscow
                          ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${moscow.className}`}>{moscow.label}</span>
                          : <span className={`text-[10px] font-semibold ml-auto ${prioColor}`}>{req.prioridad}</span>
                        }
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{req.descripcion}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer: documento */}
          {docInfo && (
            <div className="flex-shrink-0 border-t border-gray-700 px-5 py-4 space-y-3">
              {/* MoSCoW grid */}
              <div className="grid grid-cols-4 gap-px bg-gray-700 rounded-xl overflow-hidden">
                {MOSCOW_ORDER.map((cat) => {
                  const { color, bg } = MOSCOW_CELL[cat];
                  const count = moscowCounts[cat] ?? 0;
                  return (
                    <div key={cat} className={`${count ? bg : "bg-gray-800"} py-2.5 flex flex-col items-center gap-0.5`}>
                      <span className={`text-sm font-bold tabular-nums ${count ? color : "text-gray-700"}`}>{count}</span>
                      <span className="text-[9px] text-gray-500 text-center px-0.5">{cat.split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={openDoc}
                disabled={loadingDoc}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 text-sm font-medium transition-all disabled:opacity-50"
              >
                {loadingDoc
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Cargando...</>
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Ver documento</>
                }
              </button>
              {Object.keys(descargar).length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Exportar</span>
                  {descargar.md   && <a href={urlDescarga(docInfo.projectId, "md")}   download target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gray-700 hover:bg-gray-600 transition-colors">MD</a>}
                  {descargar.pdf  && <a href={urlDescarga(docInfo.projectId, "pdf")}  download target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-700 hover:bg-rose-600 transition-colors">PDF</a>}
                  {descargar.docx && <a href={urlDescarga(docInfo.projectId, "docx")} download target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-600 transition-colors">Word</a>}
                </div>
              )}
              {canFinalize && (
                <button
                  onClick={onFinalizar}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar documento
                </button>
              )}
            </div>
          )}

          {/* Generar documento si no hay doc pero puede finalizar */}
          {!docInfo && canFinalize && (
            <div className="flex-shrink-0 border-t border-gray-700 px-5 py-4">
              <button
                onClick={onFinalizar}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generar documento
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
