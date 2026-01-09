import { useEffect, useRef } from "react";
import L from "leaflet";
import { useAppContext } from "../../context/AppContext";
import { findNearestPoint } from "../../services/nearestPath";
import type { Route } from "../../types/Route";

export function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const { state, dispatch } = useAppContext();

  //inicjalizacja mapy
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = L.map("map").setView([52.0, 19.0], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(mapRef.current);

    layersRef.current = L.layerGroup().addTo(mapRef.current);

    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 0);
  }, []);

  //glowna obsluga mapy
  useEffect(() => {
    if (!layersRef.current) return;

    layersRef.current.clearLayers();

    state.actions.forEach((action) => {
      const polygon = action.area.map((p) => [p.lat, p.lng]) as [
        number,
        number
      ][];
      L.polygon(polygon, { color: "green" }).addTo(layersRef.current!);
    });

    if (state.editActionMode && state.activeActionId) {
      const activeAction = state.actions.find(
        (a) => a.id === state.activeActionId
      );

      if (activeAction) {
        activeAction.area.forEach((point, index) => {
          const marker = L.marker([point.lat, point.lng], {
            draggable: true,
          }).addTo(layersRef.current!);

          marker.on("dragend", (e) => {
            const latlng = e.target.getLatLng();

            const newArea = [...activeAction.area];
            newArea[index] = {
              lat: latlng.lat,
              lng: latlng.lng,
            };

            dispatch({
              type: "UPDATE_ACTION",
              payload: {
                actionId: activeAction.id,
                area: newArea,
              },
            });
          });
        });
      }
    }

    state.tracks.forEach((track) => {
      const lastPoint = track.points[track.points.length - 1];
      L.circleMarker([lastPoint.lat, lastPoint.lng], {
        radius: 10,
        color: "red",
        fillColor: "red",
      }).addTo(layersRef.current!);
      if (track.points.length < 2) return;

      const line = track.points.map((p) => [p.lat, p.lng]) as [
        number,
        number
      ][];
      L.polyline(line, { color: "red" }).addTo(layersRef.current!);
    });

    // tymczasowe rysowanie
    if (state.drawingPoints.length >= 2) {
      const temp = state.drawingPoints.map((p) => [p.lat, p.lng]) as [
        number,
        number
      ][];

      if (state.drawingPoints.length === 2) {
        L.polyline(temp, {
          color: "orange",
          dashArray: "4",
        }).addTo(layersRef.current!);
      } else {
        L.polygon(temp, {
          color: "orange",
          fillOpacity: 0.3,
        }).addTo(layersRef.current!);
      }
    }

    /////////////////// obsługa ścieżki
    state.routes.forEach((route) => {
      if (route.points.length < 2) return;

      const line = route.points.map((p) => [p.lat, p.lng]) as [
        number,
        number
      ][];

      L.polyline(line, {
        color: "blue",
        weight: 4,
      }).addTo(layersRef.current!);
    });

    if (state.routePoints.length >= 2) {
      const temp = state.routePoints.map((p) => [p.lat, p.lng]) as [
        number,
        number
      ][];

      L.polyline(temp, {
        color: "blue",
        dashArray: "6,6",
      }).addTo(layersRef.current!);
    }
    ///////////////////
    //// wektor do najbliższego punkty ścieżki
    const lastTrack = state.tracks[state.tracks.length - 1];
    const activeRoute = state.routes.find(
      (r: Route) => r.actionId === state.activeActionId
    );

    if (
      lastTrack &&
      lastTrack.points.length > 0 &&
      activeRoute &&
      activeRoute.points.length > 0
    ) {
      const userPos = lastTrack.points[lastTrack.points.length - 1];

      const nearest = findNearestPoint(
        userPos.lat,
        userPos.lng,
        activeRoute.points
      );

      if (nearest) {
        L.polyline(
          [
            [userPos.lat, userPos.lng],
            [nearest.point.lat, nearest.point.lng],
          ],
          {
            color: "purple",
            dashArray: "5",
          }
        ).addTo(layersRef.current!);
      }
    }
  }, [
    state.actions,
    state.tracks,
    state.drawingPoints,
    state.routes,
    state.routePoints,
  ]);

  //centrowanie przy zmianie aktywnej
  useEffect(() => {
    if (!mapRef.current) return;
    if (!state.activeActionId) return;

    const active = state.actions.find((a) => a.id === state.activeActionId);
    if (!active) return;
    if (active.area.length < 3) return;

    const latLngs = active.area.map((p) => L.latLng(p.lat, p.lng));
    const bounds = L.latLngBounds(latLngs);

    mapRef.current.fitBounds(bounds, {
      padding: [30, 30],
      animate: true,
    });
  }, [state.activeActionId, state.actions]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const onClick = (e: L.LeafletMouseEvent) => {
      if (state.drawMode) {
        dispatch({
          type: "ADD_DRAW_POINT",
          payload: {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          },
        });
      }

      if (state.routeDrawMode) {
        dispatch({
          type: "ADD_ROUTE_POINT",
          payload: {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          },
        });
      }
    };

    map.on("click", onClick);

    return () => {
      map.off("click", onClick);
    };
  }, [state.drawMode, state.routeDrawMode]);

  useEffect(() => {
    if (!mapRef.current) return;

    const container = mapRef.current.getContainer();

    if (state.drawMode || state.routeDrawMode || state.editActionMode) {
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "";
    }
  }, [state.drawMode, state.routeDrawMode, state.editActionMode]);

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
