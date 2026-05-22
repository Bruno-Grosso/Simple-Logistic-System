/*
  Prototype file, ignore unless you are Bruno Sergio
*/

import { orders, warehouses } from "./controller"; 

export async function handleRoutes(req: Request) {
  const url = new URL(req.url);

  if (url.pathname === "/route" && req.method === "POST") {
    try {      
      const body = await req.json() as { orderId: string, warehouseId: string };
      const orderData = await orders.byId(body.orderId);
      const warehouseData = await warehouses.byId(body.warehouseId);

      if (orderData.length === 0 || warehouseData.length === 0) {
        return new Response("Pedido ou Armazém não encontrados", { status: 404 });
      }

      const valhallaLocations = [
        { lat: Number(warehouseData[0].latitude), lon: Number(warehouseData[0].longitude) },
        { lat: Number(orderData[0].latitude), lon: Number(orderData[0].longitude) }
      ];

      const valhallaRes = await fetch("http://localhost:8002/route", {
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
        return new Response("Valhalla Engine Error", {
          status: valhallaRes.status,
        });
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
