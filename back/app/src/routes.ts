import { orders, warehouses } from "./controller";

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
      return Response.json(data);
    } catch (error) {
      console.error("Logistics Route Error:", error);
      return new Response("Internal Routing Server Error", { status: 500 });
    }
  }

  return null;
}
