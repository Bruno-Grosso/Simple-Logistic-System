function parseLocationCoords(raw: any, defaultLat: number, defaultLon: number): { lat: number; lon: number } {
  if (!raw) return { lat: defaultLat, lon: defaultLon }

  if (typeof raw === "object" && raw !== null) {
    const lat = Number(raw.latitude ?? raw.lat)
    const lon = Number(raw.longitude ?? raw.lon)
    if (!isNaN(lat) && !isNaN(lon) && lat !== 0) return { lat, lon }
  }

  const str = String(raw)

  if (str.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(str)
      const lat = Number(parsed.latitude ?? parsed.lat)
      const lon = Number(parsed.longitude ?? parsed.lon)
      if (!isNaN(lat) && !isNaN(lon) && lat !== 0) return { lat, lon }
    } catch {}
  }

  const latMatch = str.match(/Lat:\s*(-?\d+\.\d+)/i) || str.match(/(-?\d+\.\d+)\s*,/)
  const lonMatch = str.match(/Lon:\s*(-?\d+\.\d+)/i) || str.match(/,\s*(-?\d+\.\d+)/)

  if (latMatch && lonMatch) {
    const lat = Number(latMatch[1])
    const lon = Number(lonMatch[1])
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon }
  }

  if (str.includes("Petrópolis") || str.includes("Itaipava")) return { lat: -22.3842, lon: -43.1311 }
  if (str.includes("Teresópolis") || str.includes("Várzea") || str.includes("Alto")) return { lat: -22.4123, lon: -42.9656 }
  if (str.includes("Friburgo") || str.includes("Olaria")) return { lat: -22.2819, lon: -42.5311 }
  if (str.includes("Cachoeiras")) return { lat: -22.4633, lon: -42.6528 }
  if (str.includes("Guapimirim")) return { lat: -22.5367, lon: -42.9819 }

  return { lat: defaultLat, lon: defaultLon }
}

export async function handleRoutes(req: Request) {
  const url = new URL(req.url);

  if (url.pathname === "/route" && req.method === "POST") {
    try {
      const body = await req.json() as { orderId: string, warehouseId: string };

      const orderData = await orders.byId(body.orderId);
      const warehouseData = await warehouses.byId(body.warehouseId);

      if (orderData.length === 0 || warehouseData.length === 0) {
        return new Response("Pedido ou Armazém não encontrados no banco", { status: 404 });
      }

      const order = orderData[0];
      const warehouse = warehouseData[0];

      const wCoords = parseLocationCoords(warehouse.location, -22.3842, -43.1311);
      const oCoords = parseLocationCoords(order.final_destination, -22.4123, -42.9656);

      const valhallaLocations = [
        { lat: wCoords.lat, lon: wCoords.lon },
        { lat: oCoords.lat, lon: oCoords.lon }
      ];

      const valhallaUrls = [
        process.env.VALHALLA_URL,
        "http://localhost:8002/route",
        "http://127.0.0.1:8002/route",
        "http://host.docker.internal:8002/route",
      ].filter(Boolean) as string[];

      let valhallaRes: Response | null = null;
      for (const url of valhallaUrls) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              locations: valhallaLocations,
              costing: "truck",
              units: "kilometers",
              language: "en-US",
            }),
          });
          if (res.ok) {
            valhallaRes = res;
            break;
          }
        } catch {
          /* try next url */
        }
      }

      if (!valhallaRes || !valhallaRes.ok) {
        return new Response("Valhalla Engine Error", { status: 502 });
      }

      const data = await valhallaRes.json();
      
      // Sending the Polyline6 string directly from Valhalla to the frontend.
      const frontEndResponse = {
        success: true,
        summary: data.trip.summary, 
        encodedShape: data.trip.legs[0].shape
      };
      
      return Response.json(frontEndResponse);
    } catch (error) {
      console.error("Logistics Route Error:", error);
      return new Response("Internal Routing Server Error", { status: 500 });
    }
  }

  return null;
}
