import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MobileApp } from "./App";
import { PlatformShell } from "./PlatformShell";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Bee: #root is missing");

createRoot(root).render(
  <StrictMode>
    <PlatformShell>
      <MobileApp />
    </PlatformShell>
  </StrictMode>,
);
