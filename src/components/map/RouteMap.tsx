'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Order, Vehicle, Neighborhood } from '@/domain/types';
import { buildRoutesForAssignment } from '@/domain/routing/buildRoutesForAssignment';
import { fetchOsrmRoute } from '@/lib/fetchOsrmRoute';

function coordsForOrder(
  order: Order,
  neighborhoods: Neighborhood[]
): [number, number] | null {
  const n = neighborhoods.find(
    (x) =>
      x.name.toLowerCase() === order.neighborhood.toLowerCase() &&
      x.city.toLowerCase() === order.city.toLowerCase()
  );
  if (n) return [n.lat, n.lng];
  const byName = neighborhoods.find(
    (x) => x.name.toLowerCase() === order.neighborhood.toLowerCase()
  );
  if (byName) return [byName.lat, byName.lng];
  return null;
}

const COLORS = [
  '#111111',
  '#0058A3',
  '#C8001E',
  '#1A8A3C',
  '#6B3FA0',
  '#D4700A',
  '#0072CE',
];

interface Props {
  orders: Order[];
  vehicles: Vehicle[];
  neighborhoods: Neighborhood[];
  /** null = all vehicles with assignments */
  selectedVehicleId: string | null;
}

export function RouteMap({
  orders,
  vehicles,
  neighborhoods,
  selectedVehicleId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // Free demo style — no API key
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-7.5898, 33.5731], // lng, lat — Casablanca
      zoom: 10,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;

    async function draw() {
      // Wait until style loaded
      if (!map!.isStyleLoaded()) {
        await new Promise<void>((resolve) => {
          map!.once('load', () => resolve());
        });
      }
      if (cancelled) return;

      // Clear old layers/sources
      const style = map!.getStyle();
      if (style?.layers) {
        for (const layer of [...style.layers]) {
          if (layer.id.startsWith('ap-')) {
            if (map!.getLayer(layer.id)) map!.removeLayer(layer.id);
          }
        }
      }
      if (style?.sources) {
        for (const id of Object.keys(style.sources)) {
          if (id.startsWith('ap-') && map!.getSource(id)) {
            map!.removeSource(id);
          }
        }
      }
      // Remove old markers
      document
        .querySelectorAll('.ap-marker')
        .forEach((el) => el.parentElement?.remove());

      const assigned = orders.filter((o) => o.assignedTo);
      if (assigned.length === 0) return;

      const routes = buildRoutesForAssignment(
        orders,
        vehicles,
        neighborhoods
      );

      const filtered = selectedVehicleId
        ? routes.filter((r) => r.vehicleId === selectedVehicleId)
        : routes;

      const bounds = new maplibregl.LngLatBounds();
      let colorIdx = 0;

      for (const route of filtered) {
        const vehicle = vehicles.find((v) => v.id === route.vehicleId);
        const color = COLORS[colorIdx % COLORS.length];
        colorIdx++;

        const origin: [number, number] =
          vehicle?.startLat != null && vehicle?.startLng != null
            ? [vehicle.startLat, vehicle.startLng]
            : [33.5731, -7.5898];

        const stopCoords: [number, number][] = [];
        for (const o of route.orderedOrders) {
          const c = coordsForOrder(o, neighborhoods);
          if (c) stopCoords.push(c);
        }
        if (stopCoords.length === 0) continue;

        const pathLatLng: [number, number][] = [origin, ...stopCoords];
        pathLatLng.forEach(([lat, lng]) => bounds.extend([lng, lat]));

        // Markers
        pathLatLng.forEach(([lat, lng], i) => {
          const el = document.createElement('div');
          el.className = 'ap-marker';
          el.style.cssText = `
            width: 22px; height: 22px; border-radius: 50%;
            background: ${i === 0 ? '#fff' : color};
            border: 2px solid ${color};
            color: ${i === 0 ? color : '#fff'};
            font-size: 10px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 1px 4px rgba(0,0,0,.25);
          `;
          el.textContent = i === 0 ? 'S' : String(i);

          new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .setPopup(
              new maplibregl.Popup({ offset: 12 }).setHTML(
                i === 0
                  ? `<strong>${vehicle?.type ?? 'Start'}</strong>`
                  : `<strong>${route.orderedOrders[i - 1]?.custName || route.orderedOrders[i - 1]?.id}</strong><br/>${route.orderedOrders[i - 1]?.neighborhood || ''}`
              )
            )
            .addTo(map!);
        });

        // Road geometry via OSRM, else straight lines
        let lineCoords = await fetchOsrmRoute(pathLatLng);
        if (!lineCoords) {
          lineCoords = pathLatLng.map(([lat, lng]) => [lng, lat]);
        }

        const sourceId = `ap-route-${route.vehicleId}`;
        const layerId = `ap-line-${route.vehicleId}`;

        map!.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: lineCoords,
            },
          },
        });

        map!.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': 4,
            'line-opacity': 0.85,
          },
        });
      }

      if (!bounds.isEmpty()) {
        map!.fitBounds(bounds, { padding: 48, maxZoom: 13 });
      }
    }

    void draw();
    return () => {
      cancelled = true;
    };
  }, [orders, vehicles, neighborhoods, selectedVehicleId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[480px] rounded-[var(--radius)] overflow-hidden border border-[var(--border)]"
    />
  );
}
