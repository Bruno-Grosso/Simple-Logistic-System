import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { converterEndereco, converterCoordenadas } from "../src/geocoding";
import { testFetch } from "./test-utils";

// ---------------------------------------------------------------------------
// Mock global fetch so that geocoding tests don't depend on Nominatim network
// (Nominatim is unreachable inside the test Docker environment)
// ---------------------------------------------------------------------------

const PETROPOLIS_FORWARD_RESPONSE = [
  {
    place_id: 12345,
    display_name: "Rua do Imperador, Centro, Petrópolis, RJ, Brasil",
    lat: "-22.5094802",
    lon: "-43.1741191",
    address: { city: "Petrópolis", state: "Rio de Janeiro", country: "Brasil" },
  },
];

const PETROPOLIS_REVERSE_RESPONSE = {
  place_id: 12345,
  display_name: "Rua do Imperador, Centro, Petrópolis, RJ, Brasil",
  lat: "-22.5094802",
  lon: "-43.1741191",
};

function makeFetchMock(overrides?: {
  forward?: any;
  reverse?: any;
  failForward?: boolean;
  emptyForward?: boolean;
}) {
  return vi.fn(async (url: string) => {
    const urlStr = String(url);
    if (urlStr.includes("/search")) {
      // Forward geocoding
      if (overrides?.failForward) throw new Error("Network error");
      const body = overrides?.emptyForward ? [] : (overrides?.forward ?? PETROPOLIS_FORWARD_RESPONSE);
      return {
        ok: true,
        json: async () => body,
      } as Response;
    }
    if (urlStr.includes("/reverse")) {
      // Reverse geocoding
      const body = overrides?.reverse ?? PETROPOLIS_REVERSE_RESPONSE;
      return {
        ok: true,
        json: async () => body,
      } as Response;
    }
    // Fallthrough – used for HTTP endpoint integration tests via testFetch
    return fetch(urlStr);
  });
}

describe("Geocoding & Reverse Geocoding (OpenStreetMap Nominatim)", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  // 1. Direct function tests (converterEndereco)
  describe("converterEndereco (Forward Geocoding)", () => {
    beforeEach(() => {
      fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(makeFetchMock() as any);
    });
    afterEach(() => fetchSpy.mockRestore());

    test("converts valid address to latitude and longitude coordinates", async () => {
      const res = await converterEndereco("Rua do Imperador, Petrópolis, RJ");
      expect(typeof res).toBe("object");
      if (typeof res === "object") {
        expect(res).toHaveProperty("latitude");
        expect(res).toHaveProperty("longitude");
        expect(res).toHaveProperty("endereco_completo");
        expect(Number(res.latitude)).toBeCloseTo(-22.509, 1);
        expect(Number(res.longitude)).toBeCloseTo(-43.174, 1);
        expect(res.endereco_completo.toLowerCase()).toContain("petrópolis");
      }
    });

    test("converts regional address in Região Serrana (Petrópolis) to coordinates", async () => {
      const res = await converterEndereco("Rua do Imperador, Petrópolis, RJ");
      expect(typeof res).toBe("object");
      if (typeof res === "object") {
        expect(res.latitude).toBeDefined();
        expect(res.longitude).toBeDefined();
        expect(Number(res.latitude)).toBeCloseTo(-22.509, 1);
        expect(Number(res.longitude)).toBeCloseTo(-43.174, 1);
      }
    });

    test("returns error message for empty address", async () => {
      const res = await converterEndereco("");
      expect(res).toBe("Endereço não informado.");
    });

    test("handles non-existent address gracefully", async () => {
      // Override fetch to return empty result for unknown address
      fetchSpy.mockImplementation(makeFetchMock({ emptyForward: true }) as any);
      const res = await converterEndereco("aslkdjasldkjaslkdjaslkdjasldkjasldkjasldk");
      expect(typeof res).toBe("string");
      expect(res).toBe("Endereço não encontrado.");
    });
  });

  // 2. Direct function tests (converterCoordenadas)
  describe("converterCoordenadas (Reverse Geocoding)", () => {
    beforeEach(() => {
      fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(makeFetchMock() as any);
    });
    afterEach(() => fetchSpy.mockRestore());

    test("converts latitude and longitude back to an address", async () => {
      const res = await converterCoordenadas("-22.5094802", "-43.1741191");
      expect(typeof res).toBe("object");
      if (typeof res === "object") {
        expect(res).toHaveProperty("endereco_completo");
        expect(res.endereco_completo.toLowerCase()).toContain("petrópolis");
        expect(res.latitude).toBe("-22.5094802");
        expect(res.longitude).toBe("-43.1741191");
      }
    });

    test("converts numeric lat/lon inputs correctly", async () => {
      const res = await converterCoordenadas(-22.5094802, -43.1741191);
      expect(typeof res).toBe("object");
      if (typeof res === "object") {
        expect(res.endereco_completo.toLowerCase()).toContain("petrópolis");
      }
    });

    test("returns error message when coordinates are missing", async () => {
      const res = await converterCoordenadas("", "");
      expect(res).toBe("Coordenadas não informadas.");
    });
  });

  // 3. HTTP Endpoint Integration Tests (GET /geocode & GET /reverse-geocode)
  // The backend runs in Docker. Nominatim may or may not be reachable from that
  // container. Tests accept both 200 (success) and 502 (Nominatim unavailable)
  // to stay environment-independent.
  describe("HTTP Endpoints Integration", () => {
    test("GET /geocode: returns 200 with coords or 502 with error when Nominatim unavailable", async () => {
      const res = await testFetch("/geocode?address=Rua%20do%20Imperador,%20Petr%C3%B3polis,%20RJ");
      expect([200, 502]).toContain(res.status);
      const data = (await res.json()) as any;
      if (res.status === 200) {
        expect(data.success).toBe(true);
        expect(data.latitude).toBeDefined();
        expect(data.longitude).toBeDefined();
        expect(data.endereco_completo).toBeDefined();
      } else {
        // 502 — Nominatim unreachable from backend container
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      }
    });

    test("GET /geocode: returns 400 when address parameter is missing", async () => {
      const res = await testFetch("/geocode");
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    test("GET /reverse-geocode: returns 200 with address or 502 when Nominatim unavailable", async () => {
      const res = await testFetch("/reverse-geocode?lat=-22.5094802&lon=-43.1741191");
      expect([200, 502]).toContain(res.status);
      const data = (await res.json()) as any;
      if (res.status === 200) {
        expect(data.success).toBe(true);
        expect(data.endereco_completo).toBeDefined();
        expect(data.latitude).toBe("-22.5094802");
        expect(data.longitude).toBe("-43.1741191");
      } else {
        // 502 — Nominatim unreachable from backend container
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      }
    });

    test("GET /reverse-geocode: returns 400 when lat or lon are missing", async () => {
      const res = await testFetch("/reverse-geocode?lat=-22.5094802");
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });
  });
});
