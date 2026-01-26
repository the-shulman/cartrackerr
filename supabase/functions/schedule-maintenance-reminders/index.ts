import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Find pending reminders for today or earlier
    const { data: reminders, error: fetchError } = await supabase
      .from('maintenance_reminders')
      .select('*')
      .is('sent_at', null)
      .lte('reminder_date', today);

    if (fetchError) throw fetchError;

    console.log(`Found ${reminders?.length || 0} pending reminders`);

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const reminder of reminders || []) {
      try {
        // Prepare message for WhatsApp
        const message = `¡Hola ${reminder.client_name}! 🔧

Te recordamos que tu vehículo ${reminder.vehicle_info} tiene programado su próximo mantenimiento.

📅 Fecha sugerida: ${new Date(reminder.reminder_date).toLocaleDateString('es-MX', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}

Agenda tu cita con nosotros para mantener tu vehículo en óptimas condiciones. ¡Te esperamos!`;

        // Call the existing WhatsApp function
        const whatsappResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            clientName: reminder.client_name,
            clientPhone: reminder.client_phone,
            customMessage: message,
          }),
        });

        const whatsappResult = await whatsappResponse.json();

        if (whatsappResult.error) {
          throw new Error(whatsappResult.error);
        }

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('maintenance_reminders')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', reminder.id);

        if (updateError) throw updateError;

        results.push({ id: reminder.id, success: true });
        console.log(`Reminder ${reminder.id} sent successfully`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error sending reminder ${reminder.id}:`, errorMessage);
        results.push({ id: reminder.id, success: false, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ 
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in schedule-maintenance-reminders:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
