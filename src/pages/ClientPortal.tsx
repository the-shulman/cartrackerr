import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Service, ServiceStatus } from '@/types/service';
import { useBranding } from '@/hooks/useBranding';
import { ClientServiceView } from '@/components/ClientServiceView';
import { Car, Phone, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Helper to convert database response to Service type
function dbResponseToService(data: any): Service {
  return {
    id: data.id,
    clientName: data.client_name,
    clientPhone: data.client_phone,
    vehicleBrand: data.vehicle_brand,
    vehicleModel: data.vehicle_model,
    vehiclePlate: data.vehicle_plate,
    vehicleYear: data.vehicle_year,
    serviceType: data.service_type,
    description: data.description || '',
    status: data.status as ServiceStatus,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    diagnosticReport: data.diagnostic_report ? {
      findings: data.diagnostic_report.findings,
      items: data.diagnostic_report.items || [],
      images: data.diagnostic_report.images,
      createdAt: new Date(data.diagnostic_report.createdAt),
      approvedAt: data.diagnostic_report.approvedAt ? new Date(data.diagnostic_report.approvedAt) : undefined,
      clientNotes: data.diagnostic_report.clientNotes,
    } : undefined,
  };
}

export function ClientPortal() {
  const { branding } = useBranding();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [foundService, setFoundService] = useState<Service | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setError('');
    setSearched(true);
    setSearching(true);

    const normalizedPhone = phone.trim();
    const normalizedPlate = plate.trim();

    if (!normalizedPhone || !normalizedPlate) {
      setError('Por favor ingresa tu número de teléfono y placas');
      setFoundService(null);
      setSearching(false);
      return;
    }

    try {
      // Use the secure RPC function for server-side lookup
      // @ts-ignore - RPC function exists but types aren't generated yet
      const response = await supabase.rpc('lookup_service_by_phone_plate', {
        p_phone: normalizedPhone,
        p_plate: normalizedPlate,
      });
      
      const { data, error: rpcError } = response as { data: any; error: any };

      if (rpcError) throw rpcError;

      if (data) {
        setFoundService(dbResponseToService(data));
      } else {
        setFoundService(null);
        setError('No se encontró ningún servicio con el número de teléfono y placas proporcionados');
      }
    } catch (err) {
      console.error('Error looking up service:', err);
      setError('Ocurrió un error al buscar el servicio. Por favor, intenta de nuevo.');
      setFoundService(null);
    } finally {
      setSearching(false);
    }
  };

  const handleApproveServices = async (serviceId: string, approvedItemIds: string[], clientNotes?: string) => {
    try {
      // Use the secure RPC function for server-side approval
      // @ts-ignore - RPC function exists but types aren't generated yet
      const response = await supabase.rpc('approve_service_items', {
        p_service_id: serviceId,
        p_phone: phone,
        p_plate: plate,
        p_approved_item_ids: approvedItemIds,
        p_client_notes: clientNotes || null,
      });
      
      const { data, error: rpcError } = response as { data: { success: boolean; error?: string } | null; error: any };

      if (rpcError) throw rpcError;

      if (data?.success) {
        toast({
          title: '¡Servicios Aprobados!',
          description: 'Tu aprobación ha sido registrada. El taller comenzará a trabajar en tu vehículo.',
        });

        // Refresh the service data
        await handleSearch();
      } else {
        throw new Error(data?.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error approving services:', err);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la aprobación. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    setFoundService(null);
    setSearched(false);
    setPhone('');
    setPlate('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.workshopName} className="h-8 w-8 md:h-10 md:w-10 object-contain flex-shrink-0" />
            ) : (
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Car className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold truncate">{branding.workshopName}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Portal de Estado de Servicio</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 flex-1">
        {!foundService ? (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center px-4 md:px-6">
                <CardTitle className="text-xl md:text-2xl">Rastrea tu Servicio</CardTitle>
                <CardDescription className="text-sm">
                  Ingresa tu número de teléfono y placas para ver el estado del servicio de tu vehículo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 md:px-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Número de Teléfono
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ingresa tu número de teléfono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !searching && handleSearch()}
                    disabled={searching}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plate" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Placas
                  </Label>
                  <Input
                    id="plate"
                    placeholder="Ingresa tus placas"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && !searching && handleSearch()}
                    disabled={searching}
                  />
                </div>

                {error && searched && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button onClick={handleSearch} className="w-full" size="lg" disabled={searching}>
                  {searching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar Mi Vehículo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ClientServiceView 
            service={foundService} 
            onApprove={handleApproveServices}
            onBack={handleBack}
          />
        )}
      </main>

      <footer className="border-t bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {branding.workshopName}. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
