import { describe, test, expect } from "vitest";
import { converterEndereco, converterCoordenadas } from "../src/geocoding";
import { testFetch } from "./test-utils";

describe("Geocoding & Reverse Geocoding (OpenStreetMap Nominatim)", () => {
  // 1. Direct function tests (converterEndereco)
  describe("converterEndereco (Forward Geocoding)", () => {
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
      const res = await converterEndereco("aslkdjasldkjaslkdjaslkdjasldkjasldkjasldk");
      expect(typeof res).toBe("string");
      expect(res).toBe("Endereço não encontrado.");
    });
  });

  // 2. Direct function tests (converterCoordenadas)
  describe("converterCoordenadas (Reverse Geocoding)", () => {
    test("converts latitude and longitude back to an address", async () => {
      // Coords for Rua do Imperador, Petrópolis.
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
  describe("HTTP Endpoints Integration", () => {
    test("GET /geocode: returns coordinates for given address query", async () => {
      const res = await testFetch("/geocode?address=Rua%20do%20Imperador,%20Petr%C3%B3polis,%20RJ");
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.latitude).toBeDefined();
      expect(data.longitude).toBeDefined();
      expect(data.endereco_completo).toBeDefined();
    });

    test("GET /geocode: returns 400 when address parameter is missing", async () => {
      const res = await testFetch("/geocode");
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    test("GET /reverse-geocode: returns address for lat and lon query", async () => {
      const res = await testFetch("/reverse-geocode?lat=-22.5094802&lon=-43.1741191");
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.endereco_completo).toBeDefined();
      expect(data.latitude).toBe("-22.5094802");
      expect(data.longitude).toBe("-43.1741191");
    });

    test("GET /reverse-geocode: returns 400 when lat or lon are missing", async () => {
      const res = await testFetch("/reverse-geocode?lat=-22.5094802");
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });
  });
});
