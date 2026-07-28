import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import { SplashHandoff } from "./components/common/SplashHandoff";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Analytics />
    {/* Lifts the index.html splash once App has committed its first render. */}
    <SplashHandoff />
  </StrictMode>,
);
