import { useEffect, useRef } from "react";
import L from "leaflet";
import { useAppContext } from "../../context/AppContext";
import { findNearestPoint } from "../../services/nearestPath";
import type { Route } from "../../types/Route";
import type { Track } from "../../types/Track";
import type { ActionArea } from "../../types/ActionArea";

export function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const { state, dispatch, api } = useAppContext();

  // map initialization
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

  // main map handling
  useEffect(() => {
    if (!layersRef.current) return;

    layersRef.current.clearLayers();

    // only show objects from the active group
    const visibleActions = state.actions.filter(
      (a: ActionArea) => (a.groupId ?? null) === state.activeGroupId
    );
    const visibleIds = new Set<string>(
      visibleActions.map((a: ActionArea) => a.id)
    );
    const visibleTracks = state.tracks.filter((t: Track) =>
      visibleIds.has(t.actionId)
    );
    const visibleRoutes = state.routes.filter((r: Route) =>
      visibleIds.has(r.actionId)
    );

    visibleActions.forEach((action: ActionArea) => {
      const polygon = action.area.map((p) => [p.lat, p.lng]) as [
        number,
        number
      ][];
      L.polygon(polygon, { color: "green" }).addTo(layersRef.current!);
    });

    if (state.editActionMode && state.activeActionId) {
      const activeAction = visibleActions.find(
        (a: ActionArea) => a.id === state.activeActionId
      );

      if (activeAction) {
        activeAction.area.forEach(
          (point: { lat: number; lng: number }, index: number) => {
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

              api.updateAction(
                activeAction.id,
                activeAction.name,
                activeAction.description ?? "",
                newArea
              );
            });
          }
        );
      }
    }

    visibleTracks.forEach((track: Track) => {
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

    // temporary drawing
    if (state.drawingPoints.length >= 2) {
      const temp = state.drawingPoints.map(
        (p: { lat: number; lng: number }) => [p.lat, p.lng]
      ) as [number, number][];

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

    /////////////////// route handling
    visibleRoutes.forEach((route: Route) => {
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
      const temp = state.routePoints.map(
        (p: { lat: number; lng: number }) => [p.lat, p.lng]
      ) as [number, number][];

      L.polyline(temp, {
        color: "blue",
        dashArray: "6,6",
      }).addTo(layersRef.current!);
    }
    ///////////////////
    //// vector to the nearest route point
    const lastTrack = visibleTracks[visibleTracks.length - 1];
    const activeRoute = visibleRoutes.find(
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
    state.activeGroupId,
  ]);

  // center the map when the active drive changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (!state.activeActionId) return;

    const active = state.actions.find(
      (a: ActionArea) => a.id === state.activeActionId
    );
    if (!active) return;
    if (active.area.length < 3) return;

    const latLngs = active.area.map((p: { lat: number; lng: number }) =>
      L.latLng(p.lat, p.lng)
    );
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
      dispatch({
        type: "SET_LAST_MAP_CLICK",
        payload: {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        },
      });

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
