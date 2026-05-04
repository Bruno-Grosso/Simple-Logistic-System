/*
  Prototype file, ignore unless you are Bruno Sergio
*/

export async function handleRoutes(req: Request) {
  const url = new URL(req.url);

  if (url.pathname === "/route" && req.method === "POST") {
    try {
      const body = await req.json() as { locations: any };

      // Note: This requires the motor started by setup_valhalla.sh to be running
      const valhallaRes = await fetch("http://localhost:8002/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations: body.locations,
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
