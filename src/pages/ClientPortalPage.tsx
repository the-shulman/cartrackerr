import { ClientPortal } from './ClientPortal';
import { useServices } from '@/hooks/useServices';

export default function ClientPortalPage() {
  const { services, approveServices } = useServices();

  return (
    <ClientPortal 
      services={services} 
      onApproveServices={approveServices}
    />
  );
}
