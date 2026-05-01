import { useState } from "react";
import { obtenerPreview, urlDescarga } from "../../services/api";

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
  Alta: "text-red-400",
  Media: "text-yellow-400",
  Baja: "text-green-400",
};

const MOSCOW_COLOR = {
  "Must Have": "text-red-400",
  "Should Have": "text-orange-400",
  "Could Have": "text-yellow-400",
  "Won't Have": "text-gray-400",
};

// ─── Tarjeta de requisito individual ────────────────────────────────────────

function RequirementCard({ requisito, calidad }) {
  const tipoConfig = TIPO_CONFIG[requisito.tipo] ?? {
    label: requisito.tipo,
    className: "bg-gray-700/50 text-gray-300 border border-gray-600",
  };
  const prioClass = PRIO_COLOR[requisito.prioridad] ?? "text-gray-400";
  const quality = calidad?.puntuacion ?? 0;
  const barColor = quality >= 7 ? "bg-green-500" : quality >= 5 ? "bg-yellow-500" : "bg-red-500";

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
            <div
              className={`h-1.5 rounded-full transition-all ${barColor}`}
              style={{ width: `${quality * 10}%` }}
            />
          </div>
          <span className={quality >= 7 ? "text-green-400" : "text-yellow-400"}>
            {quality}/10
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Botón de descarga ───────────────────────────────────────────────────────

function DownloadBtn({ href, label, color }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      download
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors ${color}`}
    >
      {label}
    </a>
  );
}

// ─── Tarjeta de documento final ──────────────────────────────────────────────

function DocumentCard({ priorizacion, doc, proyecto, projectId }) {
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const labels = priorizacion?.moscow_labels ?? {};
  const counts = Object.values(labels).reduce((acc, cat) => {
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const descargar = doc?.descargar ?? {};

  async function togglePreview() {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    if (preview) {
      setShowPreview(true);
      return;
    }
    setLoadingPreview(true);
    try {
      const data = await obtenerPreview(projectId);
      setPreview(data.contenido);
      setShowPreview(true);
    } catch {
      setPreview("No se pudo cargar la vista previa del documento.");
      setShowPreview(true);
    }
    setLoadingPreview(false);
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden max-w-lg w-full">
      <div className="p-4 space-y-1">
        <h3 className="text-white font-semibold">
          {proyecto?.nombre ? `📄 ${proyecto.nombre}` : "📄 Documento de requisitos"}
        </h3>
        <p className="text-xs text-gray-400">
          {total} requisito{total !== 1 ? "s" : ""} procesado{total !== 1 ? "s" : ""}
        </p>
      </div>

      {Object.keys(counts).length > 0 && (
        <div className="grid grid-cols-2 gap-px bg-gray-700 border-t border-gray-700">
          {Object.entries(counts).map(([cat, count]) => (
            <div key={cat} className="bg-gray-800 p-3 text-center">
              <div className={`text-2xl font-bold ${MOSCOW_COLOR[cat] ?? "text-white"}`}>
                {count}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{cat}</div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={togglePreview}
          disabled={loadingPreview}
          className="w-full py-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:opacity-50"
        >
          {loadingPreview
            ? "Cargando vista previa..."
            : showPreview
            ? "▲ Ocultar documento"
            : "▼ Ver documento"}
        </button>

        {showPreview && preview && (
          <div className="mt-3 bg-gray-900 rounded-xl p-4 max-h-80 overflow-y-auto">
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
              {preview}
            </pre>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex flex-wrap gap-2">
        {descargar.md && (
          <DownloadBtn
            href={urlDescarga(projectId, "md")}
            label="Markdown"
            color="bg-gray-700 hover:bg-gray-600"
          />
        )}
        {descargar.pdf && (
          <DownloadBtn
            href={urlDescarga(projectId, "pdf")}
            label="PDF"
            color="bg-rose-700 hover:bg-rose-600"
          />
        )}
        {descargar.docx && (
          <DownloadBtn
            href={urlDescarga(projectId, "docx")}
            label="Word"
            color="bg-indigo-700 hover:bg-indigo-600"
          />
        )}
      </div>
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
          <DocumentCard
            priorizacion={msg.priorizacion}
            doc={msg.doc}
            proyecto={msg.proyecto}
            projectId={msg.projectId}
          />
        )}
      </div>
    </div>
  );
}
