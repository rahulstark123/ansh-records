"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Maximize2, Minimize2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface MapNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  density?: "High" | "Medium" | "Low";
}

interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  markers: MapNode[];
  onMarkerClick: (id: string) => void;
  selectedId: string | null;
}

// Controller component to dynamically pan & zoom the map when props change
function MapViewControl({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number] | null>(null);
  const prevZoomRef = useRef<number | null>(null);

  useEffect(() => {
    const [lat, lng] = center;
    const prevCenter = prevCenterRef.current;
    const prevZoom = prevZoomRef.current;

    const centerChanged = !prevCenter || prevCenter[0] !== lat || prevCenter[1] !== lng;
    const zoomChanged = prevZoom !== zoom;

    if (centerChanged || zoomChanged) {
      map.setView(center, zoom, { animate: true, duration: 0.8 });
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
    }
  }, [center, zoom, map]);

  return null;
}

export default function LeafletMap({
  center,
  zoom,
  markers,
  onMarkerClick,
  selectedId
}: LeafletMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Fix leaflet default icon path
    L.Icon.Default.imagePath = "/";
  }, []);

  // Force Leaflet map layout to recalculate size when fullscreen toggles
  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen, isMounted]);

  if (!isMounted) {
    return (
      <div className="flex-1 flex flex-col h-full items-center justify-center bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl min-h-[380px]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading OSM Geographical Map Engine...
        </span>
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-6 flex flex-col w-screen h-screen transition-all duration-300"
          : "flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 relative min-h-[380px]"
      }
    >
      {/* Map Stats HUD */}
      <div className="absolute top-6 left-6 z-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>OSM Tile Server Active</span>
        </div>
        <div className="text-slate-400 text-[9px] font-semibold">
          Click map bubbles to drill down region lists.
        </div>
      </div>

      {/* Full Screen Mode Toggle Button */}
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute top-6 right-6 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 text-slate-500 hover:text-primary dark:hover:text-primary cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-xs font-bold"
        title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        <span>{isFullscreen ? "Exit" : "Full Screen"}</span>
      </button>

      {/* Actual Leaflet Map Canvas */}
      {/* NOTE: No key prop on MapContainer — use MapViewControl to animate instead */}
      <div className="flex-1 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-850 z-0 h-full">
        <MapContainer
          center={center}
          zoom={zoom}
          zoomControl={true}
          style={{ width: "100%", height: "100%" }}
        >
          {/* OpenStreetMap Layer (100% Free & Open Source) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles-filter"
          />

          {/* Sync map coordinates with component properties */}
          <MapViewControl center={center} zoom={zoom} />

          {/* Render markers as styled client-density bubbles */}
          {markers.map((node) => {
            const isSelected = selectedId === node.id;

            // Determine color based on density level or count
            let color = "#0ea5e9"; // primary Sky Blue
            if (node.density === "High" || node.count >= 3000) {
              color = "#f43f5e"; // Red/Rose (high density)
            } else if (node.density === "Medium" || node.count >= 1000) {
              color = "#6366f1"; // Indigo (medium density)
            } else if (node.density === "Low" || node.count < 1000) {
              color = "#10b981"; // Emerald/Green (low density)
            }

            // Adjust bubble size based on client count log scale
            const radius = Math.max(10, Math.min(28, 8 + Math.log(node.count + 1) * 2));

            return (
              <CircleMarker
                key={node.id}
                center={[node.lat, node.lng]}
                radius={radius}
                fillColor={color}
                color={isSelected ? "#ffffff" : color}
                weight={isSelected ? 3.5 : 1}
                fillOpacity={isSelected ? 0.85 : 0.55}
                eventHandlers={{
                  click: () => onMarkerClick(node.id)
                }}
              >
                <Popup>
                  <div className="p-1 text-slate-800 flex flex-col gap-0.5 text-xs">
                    <strong className="block text-slate-900 font-bold">{node.name}</strong>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      Clients count: <strong>{node.count.toLocaleString()}</strong>
                    </span>
                    {node.density && (
                      <span className="text-[9px] text-slate-400 font-bold mt-0.5 block uppercase">
                        Density Status: {node.density}
                      </span>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Leaflet Dark Mode CSS Filter overrides — inline style tag (App Router compatible) */}
      <style>{`
        .dark .map-tiles-filter {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(90%);
        }
        .dark .leaflet-popup-content-wrapper,
        .dark .leaflet-popup-tip {
          background: #0f172a !important;
          color: #f8fafc !important;
          border: 1px solid rgba(51, 65, 85, 0.5);
        }
        .dark .leaflet-popup-content-wrapper strong {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
