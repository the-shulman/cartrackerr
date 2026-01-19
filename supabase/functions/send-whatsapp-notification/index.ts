import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  portalUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientPhone, vehicleBrand, vehicleModel, vehiclePlate, portalUrl }: NotificationRequest = await req.json();

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM");

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Missing Twilio credentials:", { 
        hasAccountSid: !!accountSid, 
        hasAuthToken: !!authToken, 
        hasFromNumber: !!fromNumber 
      });
      throw new Error("Twilio credentials not configured. Please check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM secrets.");
    }

    // Normalize phone number into E.164 for WhatsApp
    const rawPhone = (clientPhone || "").trim();
    const digitsOnly = rawPhone.replace(/\D/g, "");

    let toE164: string;
    if (rawPhone.startsWith("+")) {
      if (!digitsOnly) throw new Error("Client phone number is invalid");
      toE164 = `+${digitsOnly}`;
    } else if (digitsOnly.startsWith("00")) {
      toE164 = `+${digitsOnly.slice(2)}`;
    } else {
      // Require country code to avoid sending to the wrong number
      if (digitsOnly.length <= 10) {
        throw new Error(
          "Client phone must include country code (example: +52 55 1234 5678)."
        );
      }
      toE164 = `+${digitsOnly}`;
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

    const message = `Hi ${clientName}! 🚗\n\nYour vehicle diagnostic report is ready:\n\n🚙 ${vehicleBrand} ${vehicleModel}\n📋 Plate: ${vehiclePlate}\n\nPlease review and approve the recommended services:\n${portalUrl}\n\nReply to this message if you have any questions!`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    console.log("Sending WhatsApp message:", { to: formattedTo, from: formattedFrom });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
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
    console.log("Twilio response:", responseText);

    if (!response.ok) {
      // Try to parse as JSON first
      try {
        const errorData = JSON.parse(responseText);
        console.error("Twilio API error:", errorData);
        throw new Error(errorData.message || `Twilio error: ${errorData.code || response.status}`);
      } catch (parseError) {
        // If not JSON, it's probably XML - extract error message
        const messageMatch = responseText.match(/<Message>(.*?)<\/Message>/);
        const errorMessage = messageMatch ? messageMatch[1] : `Twilio returned status ${response.status}`;
        console.error("Twilio XML error:", errorMessage);
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

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending WhatsApp notification:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
