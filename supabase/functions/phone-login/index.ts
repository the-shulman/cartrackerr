import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const MIN_RESPONSE_TIME_MS = 300; // Constant-time to prevent timing attacks

    const { phone, password } = await req.json();

    if (!phone || !password) {
      return new Response(
        JSON.stringify({ error: "Phone and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: 5 attempts per 15 minutes per phone
    const { data: allowed, error: rlError } = await supabaseAdmin.rpc(
      "check_rate_limit",
      { p_identifier: phone, p_attempt_type: "phone_login", p_max_attempts: 5, p_window_minutes: 15 }
    );

    if (rlError || !allowed) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) await new Promise(r => setTimeout(r, MIN_RESPONSE_TIME_MS - elapsed));
      return new Response(
        JSON.stringify({ error: "Demasiados intentos. Por favor espera unos minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: emailData, error: lookupError } = await supabaseAdmin.rpc(
      "get_email_by_phone",
      { p_phone: phone }
    );

    if (lookupError || !emailData) {
      // Perform a dummy auth attempt to normalize timing regardless of phone existence
      await supabaseAdmin.auth.signInWithPassword({
        email: `invalid-${Date.now()}@noreply.local`,
        password: "dummy-password-attempt",
      }).catch(() => {});

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) await new Promise(r => setTimeout(r, MIN_RESPONSE_TIME_MS - elapsed));
      return new Response(
        JSON.stringify({ error: "Credenciales inválidas" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: emailData,
      password,
    });

    if (authError) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RESPONSE_TIME_MS) await new Promise(r => setTimeout(r, MIN_RESPONSE_TIME_MS - elapsed));
      return new Response(
        JSON.stringify({ error: "Credenciales inválidas" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_TIME_MS) await new Promise(r => setTimeout(r, MIN_RESPONSE_TIME_MS - elapsed));
    return new Response(
      JSON.stringify({ session: authData.session }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
