import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Service } from '@/types/service';
import { useBranding } from '@/hooks/useBranding';
import { ClientServiceView } from '@/components/ClientServiceView';
import { Car, Phone, Search } from 'lucide-react';

interface ClientPortalProps {
  services: Service[];
  onApproveServices: (serviceId: string, approvedItemIds: string[], clientNotes?: string) => void;
}

export function ClientPortal({ services, onApproveServices }: ClientPortalProps) {
  const { branding } = useBranding();
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [foundServiceId, setFoundServiceId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // Derive the current service from the services array to keep it reactive
  const foundService = useMemo(() => {
    if (!foundServiceId) return null;
    return services.find(s => s.id === foundServiceId) || null;
  }, [foundServiceId, services]);

  const handleSearch = () => {
    setError('');
    setSearched(true);

    const normalizedPhone = phone.replace(/\D/g, '');
    const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!normalizedPhone || !normalizedPlate) {
      setError('Por favor ingresa tu número de teléfono y placas');
      setFoundServiceId(null);
      return;
    }

    const service = services.find(s => {
      const servicePhone = s.clientPhone.replace(/\D/g, '');
      const servicePlate = s.vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return (servicePhone.includes(normalizedPhone) || normalizedPhone.includes(servicePhone)) && servicePlate === normalizedPlate;
    });

    if (service) {
      setFoundServiceId(service.id);
    } else {
      setFoundServiceId(null);
      setError('No se encontró ningún servicio con el número de teléfono y placas proporcionados');
    }
  };

  const handleBack = () => {
    setFoundServiceId(null);
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                {error && searched && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button onClick={handleSearch} className="w-full" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Mi Vehículo
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ClientServiceView 
            service={foundService} 
            onApprove={onApproveServices}
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
