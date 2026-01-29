import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  clientName: string;
  clientPhone: string;
  portalUrl: string;
}

// Allowed country codes for phone number validation (E.164 format)
const ALLOWED_COUNTRY_CODES = [
  "1",    // USA, Canada
  "52",   // Mexico
  "54",   // Argentina
  "55",   // Brazil
  "56",   // Chile
  "57",   // Colombia
  "34",   // Spain
  "51",   // Peru
  "58",   // Venezuela
  "593",  // Ecuador
  "506",  // Costa Rica
  "502",  // Guatemala
  "503",  // El Salvador
  "504",  // Honduras
  "505",  // Nicaragua
  "507",  // Panama
];

// Premium-rate or short-code number patterns to reject
const BLOCKED_PATTERNS = [
  /^1900/,    // US premium rate
  /^1976/,    // US premium rate
  /^44870/,   // UK non-geographic
  /^44871/,   // UK premium
  /^44872/,   // UK premium
  /^44900/,   // UK premium
  /^4909/,    // Germany premium
  /^5219\d{2}/,  // Mexico premium
];

/**
 * Validates and formats a phone number to E.164 format.
 */
function validateAndFormatPhone(rawPhone: string): string {
  const cleaned = (rawPhone || "").trim();
  const digitsOnly = cleaned.replace(/\D/g, "");

  if (digitsOnly.length < 8) {
    throw new Error("Phone number is too short. Please include country code.");
  }

  if (digitsOnly.length > 15) {
    throw new Error("Phone number is too long. Please check the format.");
  }

  let e164: string;
  if (cleaned.startsWith("+")) {
    e164 = `+${digitsOnly}`;
  } else if (digitsOnly.startsWith("00")) {
    e164 = `+${digitsOnly.slice(2)}`;
  } else if (digitsOnly.length > 10) {
    e164 = `+${digitsOnly}`;
  } else {
    throw new Error("Phone number must include country code (e.g., +52 55 1234 5678).");
  }

  const numberWithoutPlus = e164.slice(1);

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(numberWithoutPlus)) {
      throw new Error("This phone number type is not supported.");
    }
  }

  let matchedCountryCode = false;
  for (const code of ALLOWED_COUNTRY_CODES) {
    if (numberWithoutPlus.startsWith(code)) {
      matchedCountryCode = true;
      const nationalNumber = numberWithoutPlus.slice(code.length);
      if (nationalNumber.length < 6 || nationalNumber.length > 12) {
        throw new Error(`Invalid phone number length for country code +${code}.`);
      }
      break;
    }
  }

  if (!matchedCountryCode) {
    throw new Error("Country not supported. Supported regions: Americas, Spain.");
  }

  return e164;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication: Verify the user is logged in
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing or invalid authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Verify user has a workshop (authorization check)
    const { data: workshop, error: workshopError } = await supabaseClient
      .from("workshops")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (workshopError || !workshop) {
      console.error("Workshop verification failed:", workshopError?.message || "No workshop found");
      return new Response(
        JSON.stringify({ error: "Unauthorized: User does not own a workshop" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authorized workshop:", workshop.id);

    const { clientName, clientPhone, portalUrl }: NotificationRequest = await req.json();

    // Validate inputs
    if (!clientName || typeof clientName !== "string" || clientName.trim().length === 0) {
      throw new Error("Client name is required.");
    }
    if (clientName.length > 100) {
      throw new Error("Client name is too long.");
    }

    // Validate portal URL
    console.log("Received portalUrl:", portalUrl);
    if (!portalUrl || typeof portalUrl !== "string") {
      throw new Error("Portal URL is required.");
    }
    
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(portalUrl);
    } catch {
      throw new Error("Invalid portal URL format - could not parse URL.");
    }
    
    const allowedHosts = ["localhost", "127.0.0.1"];
    const isAllowedHost = allowedHosts.includes(parsedUrl.hostname);
    const isLovableApp = parsedUrl.hostname.endsWith(".lovable.app");
    const isLovableProject = parsedUrl.hostname.endsWith(".lovableproject.com");
    const isSupabase = parsedUrl.hostname.endsWith(".supabase.co");
    
    if (!isAllowedHost && !isLovableApp && !isLovableProject && !isSupabase) {
      console.error("Rejected portal URL domain:", parsedUrl.hostname);
      throw new Error(`Invalid portal URL domain: ${parsedUrl.hostname}. Only Lovable domains are allowed.`);
    }

    // Validate phone number
    const toE164 = validateAndFormatPhone(clientPhone);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_SMS_FROM");

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Missing Twilio credentials:", {
        hasAccountSid: !!accountSid,
        hasAuthToken: !!authToken,
        hasFromNumber: !!fromNumber,
      });
      throw new Error(
        "Twilio credentials not configured. Please check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_FROM secrets."
      );
    }

    // Format the from number for SMS
    const formattedFrom = fromNumber.startsWith("+") ? fromNumber : `+${fromNumber}`;

    // Simple, short SMS message with just the link
    const safeName = clientName.trim().slice(0, 50);
    const message = `Hola ${safeName}! Tu reporte de diagnóstico está listo. Revisa y aprueba los servicios aquí: ${portalUrl}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    console.log("Sending SMS:", { to: toE164, from: formattedFrom });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: toE164,
        From: formattedFrom,
        Body: message,
      }),
    });

    const responseText = await response.text();
    console.log("Twilio response status:", response.status);

    if (!response.ok) {
      const trimmed = responseText.trim();
      let errorCode = 'UNKNOWN';
      let internalMessage = '';

      try {
        const errorData = JSON.parse(trimmed);
        errorCode = errorData.code?.toString() || response.status.toString();
        internalMessage = errorData.message || '';
      } catch {
        const messageMatch = trimmed.match(/<Message>(.*?)<\/Message>/);
        internalMessage = messageMatch ? messageMatch[1] : `HTTP ${response.status}`;
      }

      // Log full details server-side for debugging
      console.error("Twilio API error:", { code: errorCode, message: internalMessage });

      // Map error codes to safe, user-friendly messages (no internal details exposed)
      const errorMap: Record<string, string> = {
        '21211': 'Formato de número telefónico inválido',
        '21408': 'Número no válido para este servicio',
        '21606': 'Número no autorizado para este servicio',
        '21610': 'No se pudo enviar el mensaje',
        '21612': 'Número de teléfono no válido',
        '20003': 'Servicio temporalmente no disponible',
        '20429': 'Demasiadas solicitudes - intenta más tarde',
      };

      throw new Error(errorMap[errorCode] || 'Error al enviar notificación. Verifica el número telefónico.');
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { sid: "unknown", status: "sent" };
    }

    console.log("SMS sent successfully:", result.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid, status: result.status }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending SMS notification:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
