import { useState } from 'react';
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
  const [foundService, setFoundService] = useState<Service | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = () => {
    setError('');
    setSearched(true);

    const normalizedPhone = phone.replace(/\D/g, '');
    const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!normalizedPhone || !normalizedPlate) {
      setError('Please enter both phone number and license plate');
      setFoundService(null);
      return;
    }

    const service = services.find(s => {
      const servicePhone = s.clientPhone.replace(/\D/g, '');
      const servicePlate = s.vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return servicePhone.includes(normalizedPhone) || normalizedPhone.includes(servicePhone);
    })?.vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedPlate
      ? services.find(s => {
          const servicePhone = s.clientPhone.replace(/\D/g, '');
          const servicePlate = s.vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '');
          return (servicePhone.includes(normalizedPhone) || normalizedPhone.includes(servicePhone)) && servicePlate === normalizedPlate;
        })
      : null;

    if (service) {
      setFoundService(service);
    } else {
      setFoundService(null);
      setError('No service found with the provided phone number and license plate');
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.workshopName} className="h-10 w-10 object-contain" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Car className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{branding.workshopName}</h1>
              <p className="text-sm text-muted-foreground">Service Status Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!foundService ? (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Track Your Service</CardTitle>
                <CardDescription>
                  Enter your phone number and license plate to view your vehicle's service status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plate" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    License Plate
                  </Label>
                  <Input
                    id="plate"
                    placeholder="Enter your license plate"
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
                  Find My Vehicle
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
          © {new Date().getFullYear()} {branding.workshopName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
