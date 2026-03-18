// src/context/ZoomContext.jsx
"use client";

import { createContext, useState, useEffect, useCallback } from "react";

export const ZoomContext = createContext();

const ZOOM_LEVELS = [75, 80, 85, 90, 95, 100, 110, 120, 130, 140, 150, 160, 170, 180];
const DEFAULT_ZOOM = 90;

export const ZoomProvider = ({ children }) => {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    const stored = localStorage.getItem("uiZoom");
    const level = stored ? parseInt(stored) : DEFAULT_ZOOM;
    setZoom(level);
    document.documentElement.style.fontSize = `${level}%`;
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((current) => {
      const idx = ZOOM_LEVELS.indexOf(current);
      const next = ZOOM_LEVELS[Math.min(idx + 1, ZOOM_LEVELS.length - 1)];
      localStorage.setItem("uiZoom", next);
      document.documentElement.style.fontSize = `${next}%`;
      return next;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => {
      const idx = ZOOM_LEVELS.indexOf(current);
      const next = ZOOM_LEVELS[Math.max(idx - 1, 0)];
      localStorage.setItem("uiZoom", next);
      document.documentElement.style.fontSize = `${next}%`;
      return next;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    localStorage.setItem("uiZoom", DEFAULT_ZOOM);
    document.documentElement.style.fontSize = `${DEFAULT_ZOOM}%`;
  }, []);

  const canZoomIn = ZOOM_LEVELS.indexOf(zoom) < ZOOM_LEVELS.length - 1;
  const canZoomOut = ZOOM_LEVELS.indexOf(zoom) > 0;

  return (
    <ZoomContext.Provider value={{ zoom, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut }}>
      {children}
    </ZoomContext.Provider>
  );
};
