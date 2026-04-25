import { useEffect, useState } from "react";

export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const update = () => setIsMobile(media.matches);

    update(); // inicial

    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}