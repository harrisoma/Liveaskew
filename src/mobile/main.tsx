import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MobileApp } from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Bee: #root is missing");

createRoot(root).render(
  <StrictMode>
    <MobileApp />
  </StrictMode>,
);
