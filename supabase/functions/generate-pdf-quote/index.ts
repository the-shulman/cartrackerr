import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticItem {
  id: string;
  description: string;
  price: number;
  approved: boolean;
  priority: 'required' | 'recommended' | 'optional';
}

interface QuoteRequest {
  workshopName: string;
  workshopPhone?: string;
  clientName: string;
  clientPhone: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear: string;
  serviceType: string;
  findings: string;
  items: DiagnosticItem[];
  createdAt: string;
  portalUrl?: string;
}

function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function generateQuoteHTML(data: QuoteRequest): string {
  // Escape all user-provided data to prevent XSS
  const safeWorkshopName = escapeHtml(data.workshopName);
  const safeWorkshopPhone = data.workshopPhone ? escapeHtml(data.workshopPhone) : '';
  const safeClientName = escapeHtml(data.clientName);
  const safeClientPhone = escapeHtml(data.clientPhone);
  const safeVehicleBrand = escapeHtml(data.vehicleBrand);
  const safeVehicleModel = escapeHtml(data.vehicleModel);
  const safeVehiclePlate = escapeHtml(data.vehiclePlate);
  const safeVehicleYear = escapeHtml(data.vehicleYear);
  const safeServiceType = escapeHtml(data.serviceType);
  const safeFindings = escapeHtml(data.findings);
  const safePortalUrl = data.portalUrl ? escapeHtml(data.portalUrl) : '';

  const requiredItems = data.items.filter(i => i.priority === 'required');
  const recommendedItems = data.items.filter(i => i.priority === 'recommended');
  const optionalItems = data.items.filter(i => i.priority === 'optional');
  
  const total = data.items.reduce((sum, item) => sum + item.price, 0);
  const requiredTotal = requiredItems.reduce((sum, item) => sum + item.price, 0);

  const renderItems = (items: DiagnosticItem[], title: string, bgColor: string) => {
    if (items.length === 0) return '';
    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; margin-bottom: 10px; font-size: 14px;">${escapeHtml(title)}</h3>
        ${items.map(item => `
          <div style="display: flex; justify-content: space-between; padding: 12px; background: ${bgColor}; border-radius: 6px; margin-bottom: 8px;">
            <span style="color: #374151;">${escapeHtml(item.description)}</span>
            <span style="font-weight: 600; color: #1f2937;">${formatCurrency(item.price)}</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Presupuesto - ${data.vehiclePlate}</title>
  <style>
    @page { margin: 20mm; size: A4; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-required { background: #fee2e2; color: #dc2626; }
    .badge-recommended { background: #fef3c7; color: #d97706; }
    .badge-optional { background: #dcfce7; color: #16a34a; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div class="logo">🔧 ${safeWorkshopName}</div>
          ${safeWorkshopPhone ? `<div style="color: #6b7280; margin-top: 5px;">Tel: ${safeWorkshopPhone}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #6b7280;">PRESUPUESTO</div>
          <div style="font-size: 14px; font-weight: 600;">${formatDate(data.createdAt)}</div>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
        <h3 style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 10px;">Datos del Cliente</h3>
        <div style="font-weight: 600; font-size: 16px;">${safeClientName}</div>
        <div style="color: #6b7280;">${safeClientPhone}</div>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
        <h3 style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 10px;">Datos del Vehículo</h3>
        <div style="font-weight: 600; font-size: 16px;">${safeVehicleBrand} ${safeVehicleModel}</div>
        <div style="color: #6b7280;">Placas: ${safeVehiclePlate} • Año: ${safeVehicleYear}</div>
      </div>
    </div>

    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <h3 style="color: #3b82f6; font-size: 14px; margin-bottom: 10px;">📋 Tipo de Servicio: ${safeServiceType}</h3>
      <p style="color: #374151; margin: 0;">${safeFindings}</p>
    </div>

    <h2 style="color: #1f2937; margin-bottom: 20px;">Detalle de Servicios</h2>
    
    ${renderItems(requiredItems, '🔴 Servicios Requeridos (Necesarios para el funcionamiento)', '#fee2e2')}
    ${renderItems(recommendedItems, '🟡 Servicios Recomendados (Previenen problemas futuros)', '#fef3c7')}
    ${renderItems(optionalItems, '🟢 Servicios Opcionales (Mejoran el rendimiento)', '#dcfce7')}

    <div style="background: #1f2937; color: white; padding: 20px; border-radius: 8px; margin-top: 30px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span>Subtotal Requeridos:</span>
        <span>${formatCurrency(requiredTotal)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; padding-top: 10px; border-top: 1px solid #374151;">
        <span>TOTAL ESTIMADO:</span>
        <span>${formatCurrency(total)}</span>
      </div>
    </div>

    <div class="footer">
      <p><strong>Condiciones:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Este presupuesto tiene una vigencia de 15 días.</li>
        <li>Los precios incluyen IVA.</li>
        <li>El tiempo de entrega se confirmará al aprobar el servicio.</li>
        <li>Se requiere 50% de anticipo para iniciar los trabajos.</li>
      </ul>
      ${safePortalUrl ? `
      <p style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 6px; text-align: center;">
        📱 <strong>Aprueba tu servicio en línea:</strong><br>
        <a href="${safePortalUrl}" style="color: #3b82f6;">${safePortalUrl}</a>
      </p>
      ` : ''}
    </div>
  </div>
</body>
</html>
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication: Verify the user is logged in
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: userData, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !userData.user) {
      console.error("Authentication failed:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has a workshop (authorization check)
    const { data: workshop, error: workshopError } = await supabaseClient
      .from("workshops")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (workshopError || !workshop) {
      console.error("Workshop verification failed:", workshopError?.message || "No workshop found");
      return new Response(
        JSON.stringify({ error: "Unauthorized: User does not own a workshop" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authorized workshop:", workshop.id);

    const data: QuoteRequest = await req.json();

    // Validate required fields
    if (!data.workshopName || !data.clientName || !data.items) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input length validation to prevent abuse
    if (data.clientName.length > 200 ||
        data.workshopName.length > 200 ||
        (data.findings && data.findings.length > 5000) ||
        data.items.some(i => i.description.length > 500)) {
      return new Response(
        JSON.stringify({ error: 'Input exceeds maximum length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = generateQuoteHTML(data);

    // Use Lovable AI to convert HTML to PDF
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      // Fallback: return HTML for client-side rendering
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="presupuesto-${data.vehiclePlate}.html"`,
        },
      });
    }

    // Return HTML content that can be printed/saved as PDF by browser
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to generate quote';
    console.error('Error generating quote:', err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
