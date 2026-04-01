import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

interface DGIIResponse {
  rnc: string;
  name: string;
  commercial_name?: string;
  status?: string;
}

async function lookupRNC(rnc: string): Promise<DGIIResponse | null> {
  const cleanRNC = rnc.replace(/[^0-9]/g, "");

  if (cleanRNC.length !== 9 && cleanRNC.length !== 11) {
    return null;
  }

  // Try multiple DGII API approaches
  const endpoints = [
    `https://dgii.gov.do/app/WebApps/ConsultasWeb2/ConsultasWeb/consultas/rnc.aspx`,
  ];

  // Approach 1: DGII web scraping via fetch
  try {
    const formData = new URLSearchParams();
    formData.append("txtRncCed", cleanRNC);

    const response = await fetch(
      "https://dgii.gov.do/app/WebApps/ConsultasWeb2/ConsultasWeb/consultas/rnc.aspx",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/html",
        },
        body: formData.toString(),
      },
    );

    if (response.ok) {
      const html = await response.text();

      // Parse name from response HTML
      const nameMatch = html.match(
        /id="lblNombre"[^>]*>([^<]+)</i,
      );
      const statusMatch = html.match(
        /id="lblEstado"[^>]*>([^<]+)</i,
      );
      const commercialMatch = html.match(
        /id="lblNombreComercial"[^>]*>([^<]+)</i,
      );

      if (nameMatch && nameMatch[1]?.trim()) {
        return {
          rnc: cleanRNC,
          name: nameMatch[1].trim(),
          commercial_name: commercialMatch?.[1]?.trim() || "",
          status: statusMatch?.[1]?.trim() || "ACTIVO",
        };
      }
    }
  } catch (e) {
    console.warn("DGII scrape failed:", (e as Error).message);
  }

  // Approach 2: Try public JSON API variations
  for (const path of [
    `https://api.digital.gob.do/v3/rnc/${cleanRNC}`,
    `https://dgii.gov.do/app/WebApps/ConsultasWeb/ConsultasWeb/api/rnc/${cleanRNC}`,
  ]) {
    try {
      const response = await fetch(path, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("json")) continue;

        const data = await response.json();
        const name =
          data.nombre || data.razonSocial || data.name || data.razon_social;
        if (name) {
          return {
            rnc: cleanRNC,
            name,
            commercial_name:
              data.nombreComercial || data.commercial_name || "",
            status: data.estado || data.status || "ACTIVO",
          };
        }
      }
    } catch (e) {
      console.warn(`API ${path} failed:`, (e as Error).message);
    }
  }

  // Fallback: local checksum validation only
  if (cleanRNC.length === 9) {
    const weights = [7, 9, 8, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += parseInt(cleanRNC[i]) * weights[i];
    }
    const remainder = sum % 11;
    const checkDigit =
      remainder === 0 ? 2 : remainder === 1 ? 1 : 11 - remainder;
    if (checkDigit !== parseInt(cleanRNC[8])) return null;
  }

  if (cleanRNC.length === 11) {
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      let product = parseInt(cleanRNC[i]) * weights[i];
      if (product >= 10) product -= 9;
      sum += product;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    if (checkDigit !== parseInt(cleanRNC[10])) return null;
  }

  return {
    rnc: cleanRNC,
    name: "",
    status: "VALIDADO_LOCAL",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { rnc } = await req.json();

    if (!rnc || typeof rnc !== "string") {
      return jsonResponse({ error: "RNC o Cédula es requerido" }, 400);
    }

    const cleanRNC = rnc.replace(/[^0-9]/g, "");
    if (cleanRNC.length !== 9 && cleanRNC.length !== 11) {
      return jsonResponse(
        { error: "RNC debe tener 9 dígitos o Cédula debe tener 11 dígitos" },
        400,
      );
    }

    const result = await lookupRNC(cleanRNC);

    if (!result) {
      return jsonResponse({ error: "RNC o Cédula no válido" }, 404);
    }

    return jsonResponse({
      rnc: result.rnc,
      name: result.name,
      commercial_name: result.commercial_name || null,
      status: result.status,
      valid: true,
    });
  } catch (error) {
    console.error("validate-rnc error:", error);
    return jsonResponse(
      { error: (error as Error).message || "Error interno" },
      500,
    );
  }
});
