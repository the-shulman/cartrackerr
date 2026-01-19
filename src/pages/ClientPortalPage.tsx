import { ClientPortal } from './ClientPortal';
import { useServicesContext } from '@/contexts/ServicesContext';

export default function ClientPortalPage() {
  const { services, approveServices } = useServicesContext();

  return (
    <ClientPortal 
      services={services} 
      onApproveServices={approveServices}
    />
  );
}
