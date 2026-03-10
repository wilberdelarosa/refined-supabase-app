import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeRnc(value: string | null | undefined) {
  return (value || '').replace(/\D/g, '');
}

function isValidRncFormat(value: string) {
  return /^\d{9}$/.test(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
}

function normalizeRemoteResponse(rawPayload: unknown, requestedRnc: string) {
  const payload = asRecord(rawPayload);
  const nested = asRecord(payload.data);
  const source = Object.keys(nested).length > 0 ? nested : payload;

  const businessName = pickString(source, ['name', 'nombre', 'razon_social', 'razonSocial', 'business_name']);
  const commercialName = pickString(source, ['commercial_name', 'commercialName', 'nombre_comercial']);
  const status = pickString(source, ['status', 'estado']);
  const category = pickString(source, ['category', 'categoria', 'regimen']);
  const found = businessName.length > 0 || source.found === true;

  return {
    success: true,
    data: {
      rnc: requestedRnc,
      found,
      validFormat: true,
      businessName,
      commercialName,
      status,
      category,
      source: 'external-provider',
      raw: rawPayload,
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const rnc = normalizeRnc(body?.rnc);

    if (!isValidRncFormat(rnc)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El RNC debe tener 9 dígitos numéricos.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const endpointTemplate = Deno.env.get('RNC_LOOKUP_API_URL');

    if (!endpointTemplate) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            rnc,
            found: false,
            validFormat: true,
            businessName: '',
            commercialName: '',
            status: '',
            category: '',
            source: 'local-format-validation',
          },
          message:
            'No hay un proveedor externo configurado para consultar DGII. Se validó únicamente el formato del RNC.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const apiUrl = endpointTemplate.includes('{rnc}')
      ? endpointTemplate.replace('{rnc}', rnc)
      : `${endpointTemplate}${endpointTemplate.includes('?') ? '&' : '?'}rnc=${rnc}`;

    const apiKey = Deno.env.get('RNC_LOOKUP_API_KEY');
    const apiKeyHeader = Deno.env.get('RNC_LOOKUP_API_KEY_HEADER') || 'Authorization';
    const extraHeaders: HeadersInit = apiKey
      ? apiKeyHeader.toLowerCase() === 'authorization'
        ? { Authorization: `Bearer ${apiKey}` }
        : { [apiKeyHeader]: apiKey }
      : {};

    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Proveedor RNC respondió ${response.status}`);
    }

    const payload = await response.json();

    return new Response(JSON.stringify(normalizeRemoteResponse(payload, rnc)), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado consultando el RNC';

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});