import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useTracker } from "../../hooks/useTracker";
import { MapView } from "../Map/MapView";
import { Sidebar } from "./Sidebar";
import { RouteInfo } from "../Map/RouteInfo";

import "./layout.scss";

export function MainLayout() {
  const { logout } = useAuth();
  const { startTracking, stopTracking } = useTracker();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="layout">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onLogout={logout}
        onStartTracking={startTracking}
        onStopTracking={stopTracking}
      />

      <main className="layout__main">
        <div className="map-container">
          <MapView />
        </div>
        <div className="map-info">
          <strong>Panel informacyjny</strong>
          <RouteInfo />
        </div>
      </main>
    </div>
  );
}
