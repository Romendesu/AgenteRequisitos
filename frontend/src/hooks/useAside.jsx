import { useEffect, useState, useRef } from "react";

export default function useAside(initialValue = true) {
  const [showAside, setShowAside] = useState(initialValue);
  const [showText, setShowText] = useState(initialValue);
  const isClosing = useRef(false);
  const isInitial = useRef(true);

  const toggleAside = () => {
    if (showAside) {
      // Cerrar: primero ocultar texto, luego colapsar aside
      isClosing.current = true;
      setShowText(false);
    } else {
      // Abrir: primero expandir aside, luego mostrar texto
      setShowAside(true);
    }
  };

  useEffect(() => {
    // Skip inicial
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }

    let timeout;

    if (showAside && !isClosing.current) {
      // Abrir: esperar ~60% de la transición de ancho (360ms) antes de mostrar texto
      timeout = setTimeout(() => setShowText(true), 200);
    } else if (isClosing.current) {
      // Cerrar: el texto tarda 210ms en desvanecerse (blur-fade), luego colapsamos
      timeout = setTimeout(() => {
        setShowAside(false);
        isClosing.current = false;
      }, 190);
    }

    return () => clearTimeout(timeout);
  }, [showAside, showText]);

  return {
    showAside,
    showText,
    toggleAside,
  };
}