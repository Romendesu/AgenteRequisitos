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

export default function RequirementsPanel({ requisitos, moscowLabels, isOpen, onToggle }) {
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

        {/* Footer con stats MoSCoW si hay priorización */}
        {Object.keys(moscowLabels).length > 0 && (
          <div className="border-t border-gray-700 px-4 py-3 flex-shrink-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">
              MoSCoW
            </p>
            <div className="grid grid-cols-2 gap-1">
              {["Must Have", "Should Have", "Could Have", "Won't Have"].map((cat) => {
                const n = Object.values(moscowLabels).filter((v) => v === cat).length;
                if (!n) return null;
                const cfg = MOSCOW_CONFIG[cat];
                return (
                  <div key={cat} className={`text-[10px] px-2 py-1 rounded-lg text-center ${cfg.className}`}>
                    <span className="font-bold">{n}</span>
                    <span className="ml-1 opacity-80">{cat.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
