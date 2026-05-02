import logoMoscowAI from "../../assets/images/logo_moscowai.jpeg";

const ICONS = {
  projects: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  ),
  chat: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 12.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  requirements: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function Dock({ activeSheet, requisitosCount, onProyectos, onRequisitosMobile, onSettings }) {
  const tabs = [
    { id: "projects",     label: "Proyectos",   icon: ICONS.projects,     onClick: onProyectos },
    { id: "chat",         label: "Chat",         icon: ICONS.chat,         onClick: null },
    { id: "requirements", label: `Requisitos${requisitosCount > 0 ? ` · ${requisitosCount}` : ""}`,
                                                  icon: ICONS.requirements, onClick: onRequisitosMobile },
    { id: "settings",     label: "Config",       icon: ICONS.settings,     onClick: onSettings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/80 flex items-stretch safe-bottom">
      {tabs.map((tab) => {
        const isActive = activeSheet === tab.id || (tab.id === "chat" && activeSheet === null);
        return (
          <button
            key={tab.id}
            onClick={tab.onClick ?? undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors duration-150 relative ${
              isActive ? "text-indigo-400" : "text-gray-500 active:text-gray-300"
            }`}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
            )}
            {tab.id === "projects"
              ? <img src={logoMoscowAI} alt="Proyectos" className="w-5 h-5 rounded object-cover" />
              : tab.icon
            }
            <span className="text-[10px] font-medium leading-none truncate max-w-full px-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
