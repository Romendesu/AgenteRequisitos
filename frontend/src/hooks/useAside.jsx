import { useEffect, useState } from "react";

export default function useAside(initialValue = true) {
  const [showAside, setShowAside] = useState(initialValue);
  const [showText, setShowText] = useState(initialValue);

  const toggleAside = () => {
    setShowAside(prev => !prev);
  };

  useEffect(() => {
    let timeout;

    if (showAside) {
      timeout = setTimeout(() => setShowText(true), 200);
    } else {
      setShowText(false);
    }

    return () => clearTimeout(timeout);
  }, [showAside]);

  return { showAside, showText, toggleAside };
}