import { useState, useEffect } from "react";
import { NavProvider } from "../../context/NavContext";
import MobileLayout from "./MobileLayout";
import DesktopLayout from "./DesktopLayout";

/**
 * Renders MobileLayout below 768px, DesktopLayout above.
 * Listens for viewport resize changes reactively.
 */
export default function ResponsiveShell() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");

    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <NavProvider>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </NavProvider>
  );
}
