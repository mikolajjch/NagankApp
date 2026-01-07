import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//import "./index.css";
import App from "./App.tsx";

import { AppProvider } from "./context/AppContext";
import "leaflet/dist/leaflet.css";

import { AuthProvider } from "./auth/AuthContext";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
