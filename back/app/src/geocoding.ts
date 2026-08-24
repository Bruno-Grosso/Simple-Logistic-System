// Interface para tipar a resposta oficial da API Nominatim
export interface NominatimResult {
  place_id?: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
  [key: string]: any;
}

// Interface para o retorno formatado da função
export interface CoordenadasResultado {
  endereco_completo: string;
  latitude: string;
  longitude: string;
}

/**
 * Converte um endereço em coordenadas geográficas (latitude e longitude) usando a API Nominatim (OpenStreetMap).
 */
export async function converterEndereco(endereco: string): Promise<CoordenadasResultado | string> {
  if (!endereco || !endereco.trim()) {
    return "Endereço não informado.";
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`;

  try {
    const resposta = await fetch(url, {
      headers: {
        "User-Agent": "MeuConversorDeCoordenadasTS",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    const dados: NominatimResult[] = await resposta.json();

    if (dados && dados.length > 0) {
      const primeiroResultado = dados[0];
      return {
        endereco_completo: primeiroResultado.display_name,
        latitude: primeiroResultado.lat,
        longitude: primeiroResultado.lon,
      };
    } else {
      return "Endereço não encontrado.";
    }
  } catch (erro: any) {
    return `Erro ao conectar com o serviço: ${erro.message}`;
  }
}

/**
 * Converte coordenadas (latitude e longitude) de volta em endereço usando a API Nominatim (OpenStreetMap).
 */
export async function converterCoordenadas(
  lat: string | number,
  lon: string | number
): Promise<CoordenadasResultado | string> {
  if (lat === undefined || lon === undefined || lat === "" || lon === "") {
    return "Coordenadas não informadas.";
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  try {
    const resposta = await fetch(url, {
      headers: {
        "User-Agent": "MeuConversorDeCoordenadasTS",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    const dados: NominatimResult = await resposta.json();

    if (dados && dados.display_name) {
      return {
        endereco_completo: dados.display_name,
        latitude: String(dados.lat || lat),
        longitude: String(dados.lon || lon),
      };
    } else {
      return "Coordenadas não encontradas.";
    }
  } catch (erro: any) {
    return `Erro ao conectar com o serviço: ${erro.message}`;
  }
}
