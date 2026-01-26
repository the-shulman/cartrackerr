
# Plan de Implementacion: 5 Nuevas Funcionalidades para AutoTrack

## Resumen Ejecutivo
Implementaremos 5 nuevas funcionalidades que transformaran AutoTrack en una plataforma completa de gestion de taller mecanico:

1. **Historial de Servicios por Cliente** - Ver servicios pasados
2. **Recordatorios Automaticos de Mantenimiento** - Envio programado via WhatsApp
3. **Presupuestos en PDF** - Generacion de cotizaciones profesionales
4. **Dashboard de Metricas** - Analiticas del negocio
5. **Sistema de Pagos** - Anticipos y pagos con Stripe

---

## Fase 1: Historial de Servicios por Cliente

### Descripcion
Permitir que los clientes vean todos sus servicios pasados en el portal de clientes, no solo el servicio activo actual.

### Cambios en Base de Datos
- No se requieren cambios en el esquema de la tabla `services`
- Nueva funcion RPC: `get_client_service_history` que devuelve todos los servicios de un cliente por telefono/placa

```sql
CREATE OR REPLACE FUNCTION public.get_client_service_history(p_phone text, p_plate text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
```

### Cambios en Frontend
- Modificar `ClientPortal.tsx` para mostrar lista de servicios historicos
- Nuevo componente `ServiceHistoryList.tsx` con tarjetas resumidas
- Actualizar `ClientServiceView.tsx` para navegar entre servicios

### Tiempo Estimado: 2-3 horas

---

## Fase 2: Dashboard de Metricas del Negocio

### Descripcion
Panel de analiticas para el dueño del taller con:
- Ingresos totales (por dia/semana/mes)
- Servicios completados vs pendientes
- Tiempo promedio de servicio
- Clientes recurrentes
- Grafico de tendencias

### Cambios en Base de Datos
- Nueva funcion RPC: `get_workshop_metrics` que calcula estadisticas agregadas
- Vista segura para metricas del taller

```sql
CREATE OR REPLACE FUNCTION public.get_workshop_metrics(p_start_date date, p_end_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

### Cambios en Frontend
- Nueva pagina `/metricas` con ruta protegida
- Componente `MetricsDashboard.tsx` con graficos (usando Recharts - ya instalado)
- Tarjetas de metricas: ingresos, tiempo promedio, clientes
- Selector de rango de fechas
- Agregar enlace en el Header

### Componentes Nuevos
```
src/pages/Metrics.tsx
src/components/metrics/RevenueChart.tsx
src/components/metrics/ServicesPieChart.tsx
src/components/metrics/MetricsOverview.tsx
src/components/metrics/DateRangeSelector.tsx
```

### Tiempo Estimado: 4-5 horas

---

## Fase 3: Generacion de Presupuestos en PDF

### Descripcion
Generar PDFs profesionales del reporte diagnostico para enviar al cliente o imprimir.

### Implementacion
- Edge Function: `generate-pdf-quote` usando la libreria `jsPDF` para Deno
- Incluir: logo del taller, datos del vehiculo, items del diagnostico, totales, terminos
- Almacenar PDFs generados en el bucket `diagnostic-images` (o nuevo bucket `quotes`)

### Edge Function Nueva
```
supabase/functions/generate-pdf-quote/index.ts
```

**Contenido del PDF:**
- Encabezado con logo y datos del taller
- Informacion del cliente y vehiculo
- Lista detallada de servicios con precios
- Total estimado
- Notas y condiciones
- Codigo QR con link al portal

### Cambios en Frontend
- Boton "Descargar Presupuesto" en `ServiceCard.tsx`
- Boton en `ClientServiceView.tsx` para que el cliente descargue
- Componente `DownloadQuoteButton.tsx`

### Tiempo Estimado: 4-5 horas

---

## Fase 4: Recordatorios Automaticos de Mantenimiento

### Descripcion
Sistema para enviar recordatorios automaticos por WhatsApp cuando se acerque la fecha de proximo servicio.

### Cambios en Base de Datos
- Nueva columna en `services`: `next_maintenance_date` (timestamp)
- Nueva columna en `services`: `next_maintenance_km` (integer, opcional)
- Nueva tabla `maintenance_reminders` para rastrear recordatorios enviados

```sql
ALTER TABLE public.services 
ADD COLUMN next_maintenance_date timestamp with time zone,
ADD COLUMN next_maintenance_km integer;

CREATE TABLE public.maintenance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  reminder_date timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

### Edge Functions
- `schedule-maintenance-reminders`: Funcion programada (cron) que revisa servicios y envia recordatorios
- Reutilizar logica de `send-whatsapp-notification` con nuevo template

### Cambios en Frontend
- Campo en `DiagnosticReportDialog.tsx` para capturar fecha de proximo mantenimiento
- Mostrar fecha de proximo servicio en `ServiceCard.tsx` para servicios entregados
- Seccion de "Recordatorios Programados" en configuracion

### Tiempo Estimado: 5-6 horas

---

## Fase 5: Sistema de Pagos/Anticipos con Stripe

### Descripcion
Permitir que los clientes paguen anticipos o el total del servicio aprobado directamente desde el portal.

### Prerequisitos
- Habilitar integracion de Stripe en Lovable
- Configurar Stripe secret key

### Cambios en Base de Datos
- Nueva tabla `payments` para registrar pagos

```sql
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  workshop_id uuid REFERENCES public.workshops(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  currency text DEFAULT 'mxn',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  status text DEFAULT 'pending',
  payment_type text DEFAULT 'deposit',
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);
```

### Edge Functions
- `create-checkout-session`: Crea sesion de Stripe Checkout
- `stripe-webhook`: Procesa eventos de Stripe (payment success/failure)

### Cambios en Frontend
- Boton "Pagar Anticipo" o "Pagar Total" en `ClientServiceView.tsx`
- Nuevo componente `PaymentButton.tsx`
- Pagina de confirmacion de pago `/payment-success`
- Mostrar historial de pagos en el servicio
- Badge de "Pagado" o "Anticipo Recibido" en `ServiceCard.tsx`

### Seguridad
- RLS policies para tabla `payments`
- Validacion de montos en el backend
- Webhook seguro con firma de Stripe

### Tiempo Estimado: 6-8 horas

---

## Orden de Implementacion Recomendado

```text
+------------------+     +-------------------+     +------------------+
|  1. Historial    | --> |  2. Dashboard     | --> |  3. PDF Quotes   |
|  de Servicios    |     |  de Metricas      |     |                  |
+------------------+     +-------------------+     +------------------+
         |                                                   |
         v                                                   v
+------------------+     +-------------------+
|  4. Recordatorios| --> |  5. Sistema de    |
|  Automaticos     |     |  Pagos (Stripe)   |
+------------------+     +-------------------+
```

1. **Historial** - Base para las demas funcionalidades
2. **Dashboard** - Metricas requieren datos historicos
3. **PDF Quotes** - Independiente, puede ir en paralelo
4. **Recordatorios** - Requiere estructura de historial
5. **Pagos** - Funcionalidad mas compleja, al final

---

## Archivos Nuevos a Crear

### Frontend
```
src/pages/Metrics.tsx
src/pages/PaymentSuccess.tsx
src/components/ServiceHistoryList.tsx
src/components/DownloadQuoteButton.tsx
src/components/PaymentButton.tsx
src/components/metrics/MetricsDashboard.tsx
src/components/metrics/RevenueChart.tsx
src/components/metrics/ServicesPieChart.tsx
src/components/metrics/TimeMetricsChart.tsx
src/components/metrics/DateRangeSelector.tsx
```

### Edge Functions
```
supabase/functions/generate-pdf-quote/index.ts
supabase/functions/schedule-maintenance-reminders/index.ts
supabase/functions/create-checkout-session/index.ts
supabase/functions/stripe-webhook/index.ts
```

---

## Consideraciones de Seguridad

- Todas las nuevas tablas tendran RLS habilitado
- Funciones RPC con SECURITY DEFINER para acceso controlado
- Validacion de inputs en todas las Edge Functions
- Stripe webhooks con verificacion de firma
- Pagos solo para servicios del taller del usuario autenticado

---

## Tiempo Total Estimado

| Funcionalidad | Tiempo |
|--------------|--------|
| Historial de Servicios | 2-3 horas |
| Dashboard de Metricas | 4-5 horas |
| Presupuestos PDF | 4-5 horas |
| Recordatorios Automaticos | 5-6 horas |
| Sistema de Pagos | 6-8 horas |
| **Total** | **21-27 horas** |

---

## Proximos Pasos

Al aprobar este plan, comenzare implementando las funcionalidades en el orden indicado. Cada fase sera funcional de manera independiente, permitiendo probar cada caracteristica antes de continuar con la siguiente.
