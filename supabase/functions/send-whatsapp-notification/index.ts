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
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  serviceStatus: string;
  portalUrl: string;
}

// Status-specific message templates
const STATUS_MESSAGES: Record<string, (name: string, vehicle: string, plate: string, url: string) => string> = {
  received: (name, vehicle, plate, url) => 
    `¡Hola ${name}! 🚗\n\nTu vehículo ha sido recibido en nuestro taller:\n\n🚙 ${vehicle}\n📋 Placas: ${plate}\n\nTe mantendremos informado sobre el progreso. Puedes consultar el estado en:\n${url}`,
  
  diagnosing: (name, vehicle, plate, url) => 
    `¡Hola ${name}! 🔧\n\nEstamos diagnosticando tu vehículo:\n\n🚙 ${vehicle}\n📋 Placas: ${plate}\n\nTe notificaremos cuando tengamos el reporte listo. Consulta el estado en:\n${url}`,
  
  awaiting_approval: (name, vehicle, plate, url) => 
    `¡Hola ${name}! 📋\n\nEl diagnóstico de tu vehículo está listo:\n\n🚙 ${vehicle}\n📋 Placas: ${plate}\n\n✅ Por favor revisa y aprueba los servicios recomendados:\n${url}\n\n¡Responde a este mensaje si tienes preguntas!`,
  
  in_progress: (name, vehicle, plate, url) => 
    `¡Hola ${name}! ⚙️\n\nYa comenzamos a trabajar en tu vehículo:\n\n🚙 ${vehicle}\n📋 Placas: ${plate}\n\nTe avisaremos cuando esté listo. Consulta el progreso en:\n${url}`,
  
  ready: (name, vehicle, plate, url) => 
    `¡Hola ${name}! 🎉\n\n¡Tu vehículo está listo para recoger!\n\n🚙 ${vehicle}\n📋 Placas: ${plate}\n\n📍 Te esperamos en el taller.\n\nDetalles del servicio:\n${url}`,
  
  delivered: (name, vehicle, plate, url) => 
    `¡Hola ${name}! 🙏\n\n¡Gracias por confiar en nosotros!\n\n🚙 ${vehicle}\n📋 Placas: ${plate}\n\nEsperamos verte pronto. Consulta tu historial en:\n${url}`,
};

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
 * Returns the formatted number or throws an error if invalid.
 */
function validateAndFormatPhone(rawPhone: string): string {
  const cleaned = (rawPhone || "").trim();
  const digitsOnly = cleaned.replace(/\D/g, "");

  // Basic length check - international numbers are at least 8 digits
  if (digitsOnly.length < 8) {
    throw new Error("Phone number is too short. Please include country code.");
  }

  // Maximum reasonable length for international numbers
  if (digitsOnly.length > 15) {
    throw new Error("Phone number is too long. Please check the format.");
  }

  // Determine the E.164 format
  let e164: string;
  if (cleaned.startsWith("+")) {
    e164 = `+${digitsOnly}`;
  } else if (digitsOnly.startsWith("00")) {
    e164 = `+${digitsOnly.slice(2)}`;
  } else if (digitsOnly.length > 10) {
    // Assume it includes country code
    e164 = `+${digitsOnly}`;
  } else {
    throw new Error(
      "Phone number must include country code (e.g., +52 55 1234 5678)."
    );
  }

  const numberWithoutPlus = e164.slice(1);

  // Check if the number matches a blocked premium-rate pattern
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(numberWithoutPlus)) {
      throw new Error("This phone number type is not supported.");
    }
  }

  // Validate country code is in our allowlist
  let matchedCountryCode = false;
  for (const code of ALLOWED_COUNTRY_CODES) {
    if (numberWithoutPlus.startsWith(code)) {
      matchedCountryCode = true;
      // Additional validation: ensure there are enough digits after country code
      const nationalNumber = numberWithoutPlus.slice(code.length);
      if (nationalNumber.length < 6 || nationalNumber.length > 12) {
        throw new Error(
          `Invalid phone number length for country code +${code}.`
        );
      }
      break;
    }
  }

  if (!matchedCountryCode) {
    throw new Error(
      "Country not supported. Supported regions: Americas, Spain."
    );
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

    const userId = user.id;
    console.log("Authenticated user:", userId);

    // Verify user has a workshop (authorization check)
    const { data: workshop, error: workshopError } = await supabaseClient
      .from("workshops")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (workshopError || !workshop) {
      console.error("Workshop verification failed:", workshopError?.message || "No workshop found");
      return new Response(
        JSON.stringify({ error: "Unauthorized: User does not own a workshop" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authorized workshop:", workshop.id);

    const {
      clientName,
      clientPhone,
      vehicleBrand,
      vehicleModel,
      vehiclePlate,
      serviceStatus,
      portalUrl,
    }: NotificationRequest = await req.json();

    // Input validation for all fields
    if (!clientName || typeof clientName !== "string" || clientName.trim().length === 0) {
      throw new Error("Client name is required.");
    }
    if (clientName.length > 100) {
      throw new Error("Client name is too long.");
    }

    if (!vehicleBrand || typeof vehicleBrand !== "string") {
      throw new Error("Vehicle brand is required.");
    }
    if (!vehicleModel || typeof vehicleModel !== "string") {
      throw new Error("Vehicle model is required.");
    }
    if (!vehiclePlate || typeof vehiclePlate !== "string") {
      throw new Error("Vehicle plate is required.");
    }

    // Validate and sanitize portal URL
    console.log("Received portalUrl:", portalUrl);
    if (!portalUrl || typeof portalUrl !== "string") {
      throw new Error("Portal URL is required.");
    }
    
    // Parse URL - handle parsing errors separately from domain validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(portalUrl);
    } catch {
      throw new Error("Invalid portal URL format - could not parse URL.");
    }
    
    // Only allow our own domain in the URL
    const allowedHosts = ["localhost", "127.0.0.1"];
    const isAllowedHost = allowedHosts.includes(parsedUrl.hostname);
    const isLovableApp = parsedUrl.hostname.endsWith(".lovable.app");
    const isLovableProject = parsedUrl.hostname.endsWith(".lovableproject.com");
    const isSupabase = parsedUrl.hostname.endsWith(".supabase.co");
    
    if (!isAllowedHost && !isLovableApp && !isLovableProject && !isSupabase) {
      console.error("Rejected portal URL domain:", parsedUrl.hostname);
      throw new Error(`Invalid portal URL domain: ${parsedUrl.hostname}. Only Lovable domains are allowed.`);
    }

    // Validate phone number with comprehensive checks
    const toE164 = validateAndFormatPhone(clientPhone);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM");

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Missing Twilio credentials:", {
        hasAccountSid: !!accountSid,
        hasAuthToken: !!authToken,
        hasFromNumber: !!fromNumber,
      });
      throw new Error(
        "Twilio credentials not configured. Please check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM secrets."
      );
    }

    const formattedTo = `whatsapp:${toE164}`;

    // Ensure from number is properly formatted
    const formattedFrom = fromNumber.startsWith("whatsapp:")
      ? fromNumber
      : `whatsapp:${fromNumber.startsWith("+") ? fromNumber : "+" + fromNumber}`;

    if (formattedTo === formattedFrom) {
      throw new Error(
        "Client phone number cannot be the same as the Twilio WhatsApp sender number."
      );
    }

    // Sanitize text inputs for the message
    const safeName = clientName.trim().slice(0, 100);
    const safeBrand = vehicleBrand.trim().slice(0, 50);
    const safeModel = vehicleModel.trim().slice(0, 50);
    const safePlate = vehiclePlate.trim().slice(0, 20);

    // Generate status-specific message
    const vehicle = `${safeBrand} ${safeModel}`;
    const messageGenerator = STATUS_MESSAGES[serviceStatus] || STATUS_MESSAGES["awaiting_approval"];
    const message = messageGenerator(safeName, vehicle, safePlate, portalUrl);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    console.log("Sending WhatsApp message:", {
      to: formattedTo,
      from: formattedFrom,
    });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedTo,
        From: formattedFrom,
        Body: message,
      }),
    });

    // Get response text first to handle both JSON and XML responses
    const responseText = await response.text();
    console.log("Twilio response status:", response.status);

    if (!response.ok) {
      const trimmed = responseText.trim();

      // Try JSON first (Twilio can return JSON or XML depending on headers/errors)
      try {
        const errorData = JSON.parse(trimmed);
        console.error("Twilio API error:", errorData);
        const msg =
          errorData.message || `Twilio error ${errorData.code || response.status}`;
        throw new Error(msg);
      } catch {
        // If not JSON, it's probably XML - extract error message
        const messageMatch = trimmed.match(/<Message>(.*?)<\/Message>/);
        const errorMessage = messageMatch
          ? messageMatch[1]
          : `Twilio error ${response.status}`;
        console.error("Twilio non-JSON error:", errorMessage);
        throw new Error(errorMessage);
      }
    }

    // Parse successful response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { sid: "unknown", status: "sent" };
    }

    console.log("WhatsApp message sent successfully:", result.sid);

    // Fetch message status from Twilio to help diagnose delivery issues (sandbox opt-in, invalid recipient, etc.)
    // Note: Twilio status may still be 'queued'/'sent' immediately after creation.
    let deliveryStatus: {
      status?: string;
      error_code?: number | null;
      error_message?: string | null;
      to?: string;
      from?: string;
    } | null = null;

    if (result?.sid && result.sid !== "unknown") {
      try {
        const statusRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${result.sid}.json`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            },
          }
        );

        const statusText = await statusRes.text();
        if (statusRes.ok) {
          const statusJson = JSON.parse(statusText);
          deliveryStatus = {
            status: statusJson.status,
            error_code: statusJson.error_code,
            error_message: statusJson.error_message,
            to: statusJson.to,
            from: statusJson.from,
          };
          console.log("Twilio delivery status:", deliveryStatus);
        } else {
          console.warn("Could not fetch Twilio message status:", statusRes.status, statusText);
        }
      } catch (e: any) {
        console.warn("Error fetching Twilio message status:", e?.message || String(e));
      }
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid, deliveryStatus }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending WhatsApp notification:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
