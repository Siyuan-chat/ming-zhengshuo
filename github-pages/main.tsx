import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConverterShell } from "../app/components/ConverterShell";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConverterShell />
  </StrictMode>,
);
