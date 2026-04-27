// Componentes
import Aside from "../components/layout/Aside";
import Dock from "../components/layout/Dock";

// Hooks
import useIsMobile from "../hooks/matchMedia";
import useAside from "../hooks/useAside";
import { useState } from "react";

// UI
import IntroductionSection from "../components/ui/IntroductionSection";
import PromptLabel from "../components/ui/PromptLabel";

// Menu de inicio
export default function Home() {
  // Actualizar el label con el response haciendo una llamada al servidor
  const [response, setResponse] = useState();

  const isMobile = useIsMobile();
  const isDesktop = !isMobile;

  const { showAside: isOpen, showText, toggleAside } = useAside(true);

  const mainPadding = isOpen ? "pl-64" : "pl-16";

  return (
    <div>
      {/* SIDEBAR */}
      {isMobile ? (
        <Dock toggleAside={toggleAside} />
      ) : (
        <Aside
          isOpen={isOpen}
          showText={showText}
          toggleAside={toggleAside}
        />
      )}

      {/* MAIN */}
      <main
        className={`h-screen transition-all duration-300 ${
          isDesktop ? mainPadding : "pl-0"
        }`}
      >
        <div className="p-6">
          <h1 className="text-xl font-semibold">
            MoSCoW AI
          </h1>
        </div>

        <div className="flex flex-col items-center">
                <IntroductionSection response={response}/>
                <PromptLabel setResponse={setResponse}/>
        </div>
      </main>
    </div>
  );
}