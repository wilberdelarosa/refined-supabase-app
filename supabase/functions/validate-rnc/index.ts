import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

/**
 * Edge function to validate Dominican Republic RNC/Cédula numbers.
 * Uses the DGII public API to look up taxpayer information.
 */

interface DGIIResponse {
  rnc: string;
  name: string;
  commercial_name?: string;
  status?: string;
  category?: string;
  payment_regime?: string;
}

async function lookupRNC(rnc: string): Promise<DGIIResponse | null> {
  const cleanRNC = rnc.replace(/[^0-9]/g, "");

  if (cleanRNC.length !== 9 && cleanRNC.length !== 11) {
    return null;
  }

  // Try DGII public API
  try {
    const url = `https://dgii.gov.do/app/WebApps/ConsultasWeb2/ConsultasWeb/consultas/rnc.aspx`;
    
    // Use the DGII API endpoint directly
    const apiUrl = `https://dgii.gov.do/app/WebApps/ConsultasWeb/ConsultasWeb/api/rnc/${cleanRNC}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && (data.nombre || data.razonSocial || data.name)) {
        return {
          rnc: cleanRNC,
          name: data.nombre || data.razonSocial || data.name || "",
          commercial_name: data.nombreComercial || data.commercial_name || "",
          status: data.estado || data.status || "ACTIVO",
        };
      }
    }
  } catch (e) {
    console.warn("DGII API lookup failed, trying fallback...", (e as Error).message);
  }

  // Fallback: try dgii-rnc npm package approach
  try {
    // Simple validation based on check digit algorithm for RNC (9 digits)
    if (cleanRNC.length === 9) {
      const weights = [7, 9, 8, 6, 5, 4, 3, 2];
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        sum += parseInt(cleanRNC[i]) * weights[i];
      }
      const remainder = sum % 11;
      const checkDigit = remainder === 0 ? 2 : remainder === 1 ? 1 : 11 - remainder;
      
      if (checkDigit !== parseInt(cleanRNC[8])) {
        return null; // Invalid check digit
      }
    }

    // For cédula (11 digits), validate with Luhn-like algorithm
    if (cleanRNC.length === 11) {
      const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
      let sum = 0;
      for (let i = 0; i < 10; i++) {
        let product = parseInt(cleanRNC[i]) * weights[i];
        if (product >= 10) product -= 9;
        sum += product;
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      
      if (checkDigit !== parseInt(cleanRNC[10])) {
        return null; // Invalid check digit
      }
    }

    // Return validated but without name (DGII lookup failed)
    return {
      rnc: cleanRNC,
      name: "",
      status: "VALIDADO_LOCAL",
    };
  } catch {
    return null;
  }
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
