import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAppContext } from '../../context/AppContext';

export function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const { state } = useAppContext();

  //inicjalizacja mapy
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = L.map('map').setView([52.0, 19.0], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(mapRef.current);

    layersRef.current = L.layerGroup().addTo(mapRef.current);

    setTimeout(() => {
        mapRef.current?.invalidateSize();
    }, 0);
  }, []);

  //rysowanie obszarów i śladów
  useEffect(() => {
    if (!layersRef.current) return;

    layersRef.current.clearLayers();

    //obszary naganek
    state.actions.forEach(action => {
      const polygon = action.area.map(p => [p.lat, p.lng]) as [number, number][];
      L.polygon(polygon, { color: 'green' }).addTo(layersRef.current!);
    });

    //ślady naganiaczy
    state.tracks.forEach(track => {
      if (track.points.length < 2) return;

      const line = track.points.map(p => [p.lat, p.lng]) as [number, number][];
      L.polyline(line, { color: 'red' }).addTo(layersRef.current!);
    });
  }, [state.actions, state.tracks]);

  //centrowanie przy zmianie aktywnej
  useEffect(() => {
      if (!mapRef.current) return;
      if (!state.activeActionId) return;

      const active = state.actions.find(a => a.id === state.activeActionId);
      if (!active) return;
      if (active.area.length < 3) return;

      const latLngs = active.area.map(p => L.latLng(p.lat, p.lng));
      const bounds = L.latLngBounds(latLngs);

      mapRef.current.fitBounds(bounds, {
          padding: [30, 30],
          animate: true,
          });
      }, [state.activeActionId, state.actions]);

  return (
      <div
        id="map"
        style={{
            height: "100%",
            width: "100%",
        }}
      />
    );

}
