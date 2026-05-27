import { orders, warehouses } from "./controller";

function decodePolyline6(encoded: string): [number, number][] { //Function to decode the Valhalla shapefile (Polyline6)
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  let coordinates: [number, number][] = [];

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push([lat / 1000000.0, lng / 1000000.0]);
  }
  return coordinates;
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

      const wLocation = typeof warehouse.location === 'string' 
        ? JSON.parse(warehouse.location) 
        : warehouse.location;
      
      const wLat = Number(wLocation.lat || wLocation.latitude);
      const wLon = Number(wLocation.lon || wLocation.longitude);

      const [oLatStr, oLonStr] = order.final_destination.split(',');
      const oLat = Number(oLatStr.trim());
      const oLon = Number(oLonStr.trim());

      const valhallaLocations = [
        { lat: wLat, lon: wLon },
        { lat: oLat, lon: oLon }
      ];

      const valhallaRes = await fetch("http://host.docker.internal:8002/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations: valhallaLocations,
          costing: "truck",
          units: "kilometers",
          language: "en-US",
        }),
      });

      if (!valhallaRes.ok) {
        return new Response("Valhalla Engine Error", { status: valhallaRes.status });
      }

      const data = await valhallaRes.json();
      
      const encodedShape = data.trip.legs[0].shape;
      const decodedCoordinates = decodePolyline6(encodedShape);

      const frontEndResponse = {
        success: true,
        summary: data.trip.summary, 
        routeCoordinates: decodedCoordinates
      };
      
      return Response.json(data);
    } catch (error) {
      console.error("Logistics Route Error:", error);
      return new Response("Internal Routing Server Error", { status: 500 });
    }
  }

  return null;
}
