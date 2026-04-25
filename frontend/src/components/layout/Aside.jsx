// Aside del navegador
// CONTENIDO: Logo (SVG), Opciones, Historial

import logo from "../../assets/images/logo.svg";
import chat from "../../assets/images/chat.svg";
import search from "../../assets/images/search.svg";
import settings from "../../assets/images/settings.svg";
import auth from "../../assets/images/auth.svg";

import Button from "../ui/Button";
import useAside from "../../hooks/useAside";

export default function Aside() {
    const { showAside, showText, toggleAside } = useAside(true);

    return (
        <aside
        className={`fixed p-3 bg-gray-800 h-screen flex flex-col justify-between transition-all duration-300 ${
            showAside ? "w-64" : "w-16"
        }`}
        >
            <Button icon={logo} onClick={toggleAside} />

            <div className="flex flex-col justify-between">
                <Button icon={chat}>
                    {showText && <h1>Nueva conversación</h1>}
                </Button>
                <Button icon={search}>
                    {showText && <h1>Buscar conversación</h1>}
                </Button>
                <Button icon={settings}>
                    {showText && <h1>Configuración</h1>}
                </Button>
            </div>

            <div>
                <Button icon={auth}>
                    {showText && <h1>Autentifiquese</h1>}
                </Button>
            </div>
        </aside>
    )
}