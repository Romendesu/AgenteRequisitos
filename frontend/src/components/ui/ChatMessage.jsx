import { useState } from "react";
import { obtenerPreview, urlDescarga } from "../../services/api";
import { parseMarkdown } from "../../utils/markdown";

// ─── Config de tipos de requisito ────────────────────────────────────────────

const TIPO_CONFIG = {
  Funcional: {
    label: "RF · Funcional",
    className: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  },
  "No Funcional": {
    label: "RNF · No Funcional",
    className: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
  },
  Dominio: {
    label: "RD · Restricción de Dominio",
    className: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
  },
};

const PRIO_COLOR = {
  Alta:  "text-red-400",
  Media: "text-yellow-400",
  Baja:  "text-green-400",
};

// ─── Config MoSCoW — orden y paleta fijos ────────────────────────────────────

const MOSCOW_ORDER = ["Must Have", "Should Have", "Could Have", "Won't Have"];

const MOSCOW_CONFIG = {
  "Must Have":   { color: "text-red-400",    dim: "text-red-900",    bg: "bg-red-500/10"    },
  "Should Have": { color: "text-orange-400", dim: "text-orange-900", bg: "bg-orange-500/10" },
  "Could Have":  { color: "text-yellow-400", dim: "text-yellow-900", bg: "bg-yellow-500/10" },
  "Won't Have":  { color: "text-slate-400",  dim: "text-slate-700",  bg: "bg-slate-500/10"  },
};

// ─── Botón de descarga ───────────────────────────────────────────────────────

function DownloadBtn({ href, label, color }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      download
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors ${color}`}
    >
      {label}
    </a>
  );
}

// ─── Modal del documento ─────────────────────────────────────────────────────

function DocumentModal({ content, projectId, descargar, onClose }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="modal-overlay fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="modal-panel bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-white font-semibold text-sm">Documento de requisitos</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo con markdown renderizado */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div
            className="doc-preview"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
          />
        </div>

        {/* Footer: exportar */}
        {Object.keys(descargar).length > 0 && (
          <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-700 flex-shrink-0">
            <span className="text-xs text-gray-500 mr-1">Exportar:</span>
            {descargar.md   && <DownloadBtn href={urlDescarga(projectId, "md")}   label="Markdown" color="bg-gray-700 hover:bg-gray-600" />}
            {descargar.pdf  && <DownloadBtn href={urlDescarga(projectId, "pdf")}  label="PDF"      color="bg-rose-700 hover:bg-rose-600" />}
            {descargar.docx && <DownloadBtn href={urlDescarga(projectId, "docx")} label="Word"     color="bg-indigo-700 hover:bg-indigo-600" />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tarjeta de documento (resumen MoSCoW) ───────────────────────────────────

function DocumentCard({ priorizacion, doc, proyecto, projectId }) {
  const [preview, setPreview]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const labels = priorizacion?.moscow_labels ?? {};
  const counts = Object.values(labels).reduce((acc, cat) => {
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});
  const total    = Object.values(counts).reduce((a, b) => a + b, 0);
  const descargar = doc?.descargar ?? {};

  async function openModal() {
    if (preview) { setModalOpen(true); return; }
    setLoading(true);
    try {
      const data = await obtenerPreview(projectId);
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
        <DocumentModal
          content={preview}
          projectId={projectId}
          descargar={descargar}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden w-full max-w-sm">

        {/* Encabezado */}
        <div className="px-4 pt-4 pb-3">
          <h3 className="text-sm font-semibold text-white truncate">
            {proyecto?.nombre ?? "Documento de requisitos"}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {total} requisito{total !== 1 ? "s" : ""} procesado{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Dashboard MoSCoW — 4 celdas siempre visibles */}
        <div className="grid grid-cols-4 gap-px bg-gray-700 border-t border-gray-700">
          {MOSCOW_ORDER.map((cat) => {
            const { color, dim, bg } = MOSCOW_CONFIG[cat];
            const count = counts[cat] ?? 0;
            const isEmpty = count === 0;
            return (
              <div key={cat} className={`${isEmpty ? "bg-gray-800" : bg} p-3 flex flex-col items-center gap-1`}>
                <span className={`text-xl font-bold tabular-nums leading-none ${isEmpty ? dim : color}`}>
                  {count}
                </span>
                <span className={`text-[9px] font-medium text-center leading-tight ${isEmpty ? "text-gray-600" : "text-gray-400"}`}>
                  {cat}
                </span>
              </div>
            );
          })}
        </div>

        {/* Acciones */}
        <div className="px-4 py-3 border-t border-gray-700 space-y-2.5">

          {/* Botón principal: Ver documento */}
          <button
            onClick={openModal}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Cargando documento...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ver documento
              </>
            )}
          </button>

          {/* Botones de exportación */}
          {Object.keys(descargar).length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-600 mr-0.5">Exportar</span>
              {descargar.md   && <DownloadBtn href={urlDescarga(projectId, "md")}   label="Markdown" color="bg-gray-700 hover:bg-gray-600" />}
              {descargar.pdf  && <DownloadBtn href={urlDescarga(projectId, "pdf")}  label="PDF"      color="bg-rose-700 hover:bg-rose-600" />}
              {descargar.docx && <DownloadBtn href={urlDescarga(projectId, "docx")} label="Word"     color="bg-indigo-700 hover:bg-indigo-600" />}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Tarjeta de requisito individual ────────────────────────────────────────

function RequirementCard({ requisito, calidad }) {
  const tipoConfig = TIPO_CONFIG[requisito.tipo] ?? {
    label: requisito.tipo,
    className: "bg-gray-700/50 text-gray-300 border border-gray-600",
  };
  const prioClass = PRIO_COLOR[requisito.prioridad] ?? "text-gray-400";
  const quality   = calidad?.puntuacion ?? 0;
  const barColor  = quality >= 7 ? "bg-green-500" : quality >= 5 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3 max-w-lg">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tipoConfig.className}`}>
          {tipoConfig.label}
        </span>
        <span className="text-xs font-mono text-gray-400">{requisito.id}</span>
        <span className={`text-xs font-semibold ml-auto ${prioClass}`}>
          ● {requisito.prioridad}
        </span>
      </div>
      <p className="text-sm text-white leading-relaxed">{requisito.descripcion}</p>
      <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
        <span className="text-gray-500">Criterio: </span>
        {requisito.criterio_aceptacion}
      </div>
      {calidad && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Calidad</span>
          <div className="flex-1 bg-gray-700 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${quality * 10}%` }} />
          </div>
          <span className={quality >= 7 ? "text-green-400" : "text-yellow-400"}>{quality}/10</span>
        </div>
      )}
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function AIAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-xs text-white font-bold mt-1 select-none">
      AI
    </div>
  );
}

// ─── Componente público ───────────────────────────────────────────────────────

export default function ChatMessage({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-lg text-sm leading-relaxed">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      <AIAvatar />
      <div className="min-w-0">
        {msg.type === "text" && (
          <div className={`rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg text-sm leading-relaxed ${
            msg.isWarning
              ? "bg-amber-500/10 border border-amber-500/30 text-amber-200"
              : "bg-gray-800 text-gray-100"
          }`}>
            {msg.text}
          </div>
        )}

        {msg.type === "requirement" && (
          <RequirementCard requisito={msg.requisito} calidad={msg.calidad} />
        )}

        {msg.type === "document" && (
          <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg text-sm leading-relaxed bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
            Documento generado. Puedes verlo en el panel de requisitos o seguir añadiendo más.
          </div>
        )}
      </div>
    </div>
  );
}
