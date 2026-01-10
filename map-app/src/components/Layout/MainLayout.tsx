import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useTracker } from "../../hooks/useTracker";
import { MapView } from "../Map/MapView";
import { Sidebar } from "./Sidebar";
import { RouteInfo } from "../Map/RouteInfo";
import { useAppContext } from "../../context/AppContext";

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
          <h2>Stwórz grupę</h2>
          <p></p>
          <div>
            <h2>komentarze grupy</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
              accumsan ullamcorper ultricies. Nam et accumsan purus. Nulla
              malesuada lorem diam, et blandit lacus suscipit sit amet. In
              iaculis hendrerit diam eu dictum. Sed dapibus magna sit amet
              iaculis sollicitudin. Morbi vehicula tortor ut ex venenatis, sed
              placerat lacus egestas. Duis et purus ipsum. Vivamus egestas
              sagittis venenatis. Duis consectetur eros eu ligula porttitor
              tincidunt. Curabitur sed ultricies augue, non pretium elit.
              Aliquam imperdiet semper sem, sit amet vehicula turpis varius eu.
              Mauris sapien odio, egestas sit amet nunc ac, pharetra fermentum
              augue. Curabitur fermentum nulla ac dolor convallis vehicula.
              Mauris porta vestibulum scelerisque. Praesent blandit vel nulla et
              aliquet. Nunc felis eros, venenatis id magna nec, pharetra laoreet
              sapien. Sed pulvinar nisl sed metus pharetra, id aliquam nibh
              porta. Fusce malesuada vel elit vel venenatis. Nullam cursus nibh
              sed augue viverra blandit. Mauris dapibus diam sed ligula cursus,
              eu vestibulum felis faucibus. Suspendisse sollicitudin tortor nec
              risus lacinia gravida. Praesent auctor ac dolor eget pellentesque.
              Nam nec pretium orci. Quisque massa dolor, luctus sit amet ligula
              vel, dapibus dapibus justo. Nunc mollis aliquet dolor vitae
              condimentum. Nullam congue justo nec congue rutrum.
            </p>
          </div>
          <p></p>
        </div>
      </main>
    </div>
  );
}
