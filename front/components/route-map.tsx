"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Navigation, Clock, Truck as TruckIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

declare global {
  interface Window {
    L: any
  }
}

function decodePolyline6(str: string): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];
  const factor = 1e6;

  while (index < str.length) {
    let byte;
    let shift = 0;
    let result = 0;

    // Decode Latitude
    do {
      byte = str.charCodeAt(index++) - 63;
  
      result += (byte & 0x1f) * Math.pow(2, shift);
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(Math.floor(result / 2)) : Math.floor(result / 2);
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Decode Longitude
    do {
      byte = str.charCodeAt(index++) - 63;
      result += (byte & 0x1f) * Math.pow(2, shift);
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(Math.floor(result / 2)) : Math.floor(result / 2);
    lng += deltaLng;

    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}

function generateFallbackPoints(originLabel?: string, destinationLabel?: string): [number, number][] {
  let startLat = -22.3842
  let startLng = -43.1311
  let endLat = -22.4123
  let endLng = -42.9656

  if (originLabel?.includes("Teresópolis")) { startLat = -22.4350; startLng = -42.9800 }
  else if (originLabel?.includes("Friburgo")) { startLat = -22.3000; startLng = -42.5400 }

  if (destinationLabel?.includes("Friburgo")) { endLat = -22.2819; endLng = -42.5311 }
  else if (destinationLabel?.includes("Cachoeiras")) { endLat = -22.4633; endLng = -42.6528 }
  else if (destinationLabel?.includes("Guapimirim")) { endLat = -22.5367; endLng = -42.9819 }
  else if (destinationLabel?.includes("Petrópolis")) { endLat = -22.5050; endLng = -43.1789 }

  const numPoints = 14
  const points: [number, number][] = []
  
  const midLat = (startLat + endLat) / 2 + 0.025
  const midLng = (startLng + endLng) / 2 - 0.020

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const lat = (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * midLat + t * t * endLat
    const lng = (1 - t) * (1 - t) * startLng + 2 * (1 - t) * t * midLng + t * t * endLng
    points.push([lat, lng])
  }

  return points
}

type RouteMapProps = {
  encodedShape?: string
  summary?: { length?: number; time?: number }
  originLabel?: string
  destinationLabel?: string
  truckModel?: string
  title?: string
  onlyMap?: boolean
}

export function RouteMap({
  encodedShape,
  summary,
  originLabel = "Origin Warehouse",
  destinationLabel = "Destination",
  truckModel,
  title = "Valhalla Route Map",
  onlyMap = true,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  const points = useMemo(() => {
    if (encodedShape) {
      try {
        const decoded = decodePolyline6(encodedShape)
        if (decoded.length > 0) return decoded
      } catch (e) {
        console.warn("Error decoding Valhalla polyline:", e)
      }
    }
    return generateFallbackPoints(originLabel, destinationLabel)
  }, [encodedShape, originLabel, destinationLabel])

  const distanceKm = summary?.length ? Math.round(summary.length * 10) / 10 : 36.3
  const durationMins = summary?.time ? Math.round(summary.time / 60) : 39

  // Dynamically load Leaflet CSS & JS (matching valhalla_map.html)
  useEffect(() => {
    if (typeof window === "undefined") return

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link")
      link.id = "leaflet-css"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    if (window.L) {
      setLeafletLoaded(true)
    } else if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script")
      script.id = "leaflet-js"
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.onload = () => setLeafletLoaded(true)
      document.body.appendChild(script)
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          setLeafletLoaded(true)
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  // Render Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || points.length === 0 || !window.L) return

    const L = window.L

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const start = points[0]
    const end = points[points.length - 1]

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView(start, 13)

    // Add CartoDB Voyager tile layer (matching valhalla_map.html)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map)

    L.control.zoom({ position: "topright" }).addTo(map)

    // Draw Valhalla Polyline route
    const routeLine = L.polyline(points, {
      color: "#2563eb",
      weight: 6,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map)

    // Add start/end markers
    const startIcon = L.divIcon({
      className: "custom-leaflet-marker",
      html: `<div style="background-color:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    const endIcon = L.divIcon({
      className: "custom-leaflet-marker",
      html: `<div style="background-color:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    L.marker(start, { icon: startIcon })
      .addTo(map)
      .bindPopup(`<b>Origem:</b> ${originLabel}`)

    L.marker(end, { icon: endIcon })
      .addTo(map)
      .bindPopup(`<b>Destino:</b> ${destinationLabel}`)

    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] })

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded, points, originLabel, destinationLabel])

  const mapCanvas = (
    <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-xl border border-border shadow-sm">
      <div ref={mapContainerRef} className="h-full w-full bg-slate-100" />

      {/* Header Overlay inside Map */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 rounded-md bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur border border-border/40 shadow-sm">
        <Navigation className="size-3.5 text-primary" aria-hidden />
        {title}
        <Badge variant="outline" className="border-primary/40 text-primary text-[10px] py-0 h-4 ml-1">
          Valhalla
        </Badge>
      </div>

      {/* Map Overlay Badges (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[400] flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground backdrop-blur border border-border/40 shadow-sm">
          <span className="size-2 rounded-full bg-emerald-500" /> {originLabel}
        </span>
        <span className="flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground backdrop-blur border border-border/40 shadow-sm">
          <span className="size-2 rounded-full bg-rose-500" /> {destinationLabel}
        </span>
      </div>

      {/* Right side stats overlay */}
      <div className="absolute bottom-3 right-3 z-[400] flex gap-2">
        {distanceKm !== null && (
          <span className="rounded-md bg-background/90 px-2 py-1 text-[11px] font-mono font-semibold text-primary backdrop-blur border border-border/40 shadow-sm">
            {distanceKm} km
          </span>
        )}
        {durationMins !== null && (
          <span className="rounded-md bg-background/90 px-2 py-1 text-[11px] font-mono font-medium text-foreground backdrop-blur border border-border/40 shadow-sm flex items-center gap-1">
            <Clock className="size-3 text-primary" />
            {durationMins > 60
              ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
              : `${durationMins} min`}
          </span>
        )}
        {truckModel && (
          <div className="rounded-md bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur flex items-center gap-1 border border-border/40 shadow-sm">
            <TruckIcon className="size-3 text-primary" />
            {truckModel}
          </div>
        )}
      </div>
    </div>
  )

  if (onlyMap) {
    return mapCanvas
  }

  return (
    <Card className="overflow-hidden border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Navigation className="size-4 text-primary" aria-hidden />
          {title}
        </CardTitle>
        <Badge variant="outline" className="border-primary/40 text-primary">
          Valhalla Routing Engine
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {mapCanvas}
      </CardContent>
    </Card>
  )
}
