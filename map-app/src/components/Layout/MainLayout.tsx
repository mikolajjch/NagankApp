import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useTracker } from "../../hooks/useTracker";
import { MapView } from "../Map/MapView";
import { Sidebar } from "./Sidebar";
import { RouteInfo } from "../Map/RouteInfo";
import { useAppContext } from "../../context/AppContext";
import { CreateGroup } from "../Groups/CreateGroup";
import { GroupList } from "../Groups/GroupList";

import "./layout.scss";

export function MainLayout() {
  const { logout } = useAuth();
  const { startTracking, stopTracking } = useTracker();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { state } = useAppContext();

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
        <header>NagankApp 2000</header>

        <div className="map-container">
          <MapView />
        </div>
        <div className="map-info">
          <strong>Panel informacyjny</strong>
          <RouteInfo />
          {state.lastMapClick && (
            <div style={{ marginTop: 6 }}>
              <div>Ostatnia interakcja z mapą:</div>
              <div>
                lat: <strong>{state.lastMapClick.lat.toFixed(6)}</strong>
              </div>
              <div>
                lng: <strong>{state.lastMapClick.lng.toFixed(6)}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="groups-container">
          <CreateGroup />
          <GroupList />
        </div>
      </main>
    </div>
  );
}
