import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/tokens.css";
import "@/styles/base.css";
import App from "@/App";
import { NotificationProvider } from "@/notifications";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </StrictMode>,
  );
}
