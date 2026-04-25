import bars from "../../assets/images/bars.svg";
import chat from "../../assets/images/chat.svg";
import search from "../../assets/images/search.svg";
import settings from "../../assets/images/settings.svg";
import auth from "../../assets/images/auth.svg";

import Button from "./Button";

export default function Aside({ isOpen, showText, toggleAside }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gray-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      {/* TOP */}
      <div className="p-3">
        <Button icon={bars} onClick={toggleAside} />
      </div>

      <hr className="border-gray-600 mx-3" />

      {/* MIDDLE */}
      <div className="flex flex-col gap-2 flex-1 justify-center p-3">
        <Button icon={chat}>
          <span className={`transition-opacity duration-200 ${
            showText ? "opacity-100" : "opacity-0"
          }`}>
            Nueva conversación
          </span>
        </Button>

        <Button icon={search}>
          <span className={`transition-opacity duration-200 ${
            showText ? "opacity-100" : "opacity-0"
          }`}>
            Buscar conversación
          </span>
        </Button>

        <Button icon={settings}>
          <span className={`transition-opacity duration-200 ${
            showText ? "opacity-100" : "opacity-0"
          }`}>
            Configuración
          </span>
        </Button>
      </div>

    </aside>
  );
}