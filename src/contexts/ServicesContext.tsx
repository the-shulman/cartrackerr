import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Service, ServiceStatus, DiagnosticReport } from '@/types/service';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Workshop {
  id: string;
  phone: string | null;
  workshop_name: string;
}

interface ServicesContextType {
  services: Service[];
  loading: boolean;
  workshopId: string | null;
  workshopPhone: string | null;
  workshopName: string | null;
  addService: (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  updateStatus: (id: string, newStatus: ServiceStatus, sendNotification?: boolean) => Promise<void>;
  addDiagnosticReport: (id: string, report: DiagnosticReport, nextMaintenanceDate?: Date) => Promise<void>;
  approveServices: (id: string, approvedItemIds: string[], clientNotes?: string) => Promise<void>;
  getCounts: () => Record<ServiceStatus | 'all' | 'total', number>;
  refreshServices: () => Promise<void>;
  refreshWorkshopInfo: () => Promise<void>;
  sendWhatsAppNotification: (service: Service, status: ServiceStatus) => Promise<boolean>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

// Database row type for services table
interface ServiceRow {
  id: string;
  workshop_id: string;
  client_name: string;
  client_phone: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_year: string;
  service_type: string;
  description: string | null;
  status: string;
  diagnostic_report: any;
  estimated_completion: string | null;
  created_at: string;
  updated_at: string;
}

// Safely parse a date value that may be missing, malformed, or already a Date.
// Falls back to `fallback` (or now) instead of producing an Invalid Date that
// later throws "Invalid time value" when something calls .toISOString() on it.
function safeDate(value: unknown, fallback?: Date): Date {
  if (!value) return fallback ?? new Date();
  const d = new Date(value as string | number | Date);
  return isNaN(d.getTime()) ? (fallback ?? new Date()) : d;
}

// Helper to convert database row to Service type
function dbRowToService(row: ServiceRow): Service {
  return {
    id: row.id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    vehicleBrand: row.vehicle_brand,
    vehicleModel: row.vehicle_model,
    vehiclePlate: row.vehicle_plate,
    vehicleYear: row.vehicle_year,
    serviceType: row.service_type,
    description: row.description || '',
    status: row.status as ServiceStatus,
    createdAt: safeDate(row.created_at),
    updatedAt: safeDate(row.updated_at),
    estimatedCompletion: row.estimated_completion ? safeDate(row.estimated_completion) : undefined,
    diagnosticReport: row.diagnostic_report ? {
      findings: row.diagnostic_report.findings || '',
      items: row.diagnostic_report.items || [],
      images: row.diagnostic_report.images,
      // Fall back to the service's own createdAt if the report is missing/has an invalid date
      // (older records saved before this field was always set), so downstream .toISOString()
      // calls (e.g. PDF quote generation) never throw "Invalid time value".
      createdAt: safeDate(row.diagnostic_report.createdAt, safeDate(row.created_at)),
      approvedAt: row.diagnostic_report.approvedAt ? safeDate(row.diagnostic_report.approvedAt) : undefined,
      clientNotes: row.diagnostic_report.clientNotes,
    } : undefined,
  };
}

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [workshopId, setWorkshopId] = useState<string | null>(null);
  const [workshopPhone, setWorkshopPhone] = useState<string | null>(null);
  const [workshopName, setWorkshopName] = useState<string | null>(null);
  const { user, session } = useAuthContext();
  const { toast } = useToast();

  // Fetch workshop info for the current user
  const fetchWorkshopInfo = useCallback(async () => {
    if (!user) {
      setWorkshopId(null);
      setWorkshopPhone(null);
      setWorkshopName(null);
      return null;
    }

    const { data, error } = await supabase
      .from('workshops')
      .select('id, phone, workshop_name')
      .eq('user_id', user.id)
      .maybeSingle() as { data: Workshop | null; error: any };

    if (error) {
      console.error('Error fetching workshop:', error);
      return null;
    }

    if (data) {
      setWorkshopId(data.id);
      setWorkshopPhone(data.phone);
      setWorkshopName(data.workshop_name);
      return data.id;
    }

    return null;
  }, [user]);

  // Refresh workshop info (exposed for settings updates)
  const refreshWorkshopInfo = useCallback(async () => {
    await fetchWorkshopInfo();
  }, [fetchWorkshopInfo]);

  // Fetch services from database using raw query since types aren't generated yet
  const fetchServices = useCallback(async () => {
    if (!user) {
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use raw SQL query via rpc or postgrest
      const { data, error } = await supabase
        .from('services' as any)
        .select('*')
        .order('created_at', { ascending: false }) as unknown as { data: ServiceRow[] | null; error: any };

      if (error) throw error;

      const mappedServices = (data || []).map(dbRowToService);
      setServices(mappedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los servicios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Initialize on user change
  useEffect(() => {
    const init = async () => {
      await fetchWorkshopInfo();
      await fetchServices();
    };
    init();
  }, [fetchWorkshopInfo, fetchServices]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
        },
        () => {
          // Refresh services when any change occurs
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchServices]);

  const refreshServices = useCallback(async () => {
    await fetchServices();
  }, [fetchServices]);

  const addService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    if (!workshopId) {
      toast({
        title: 'Error',
        description: 'No se encontró el taller. Por favor, inicia sesión de nuevo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('services' as any)
        .insert({
          workshop_id: workshopId,
          client_name: serviceData.clientName,
          client_phone: serviceData.clientPhone,
          vehicle_brand: serviceData.vehicleBrand,
          vehicle_model: serviceData.vehicleModel,
          vehicle_plate: serviceData.vehiclePlate,
          vehicle_year: serviceData.vehicleYear,
          service_type: serviceData.serviceType,
          description: serviceData.description,
          status: 'received',
        } as any);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Servicio registrado correctamente',
      });

      // Refresh is handled by realtime subscription
    } catch (error) {
      console.error('Error adding service:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el servicio',
        variant: 'destructive',
      });
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.filter(s => s.id !== id));

      toast({
        title: 'Servicio eliminado',
        description: 'El servicio fue eliminado correctamente',
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el servicio',
        variant: 'destructive',
      });
    }
  };

  // Send WhatsApp notification for a service status change
  const sendWhatsAppNotification = async (service: Service, status: ServiceStatus): Promise<boolean> => {
    if (!session?.access_token) {
      console.error('No session token available');
      return false;
    }

    // Format phone with country code for WhatsApp
    const phoneWithCountryCode = service.clientPhone.length === 10
      ? `+52${service.clientPhone}`
      : service.clientPhone;

    const portalUrl = `${window.location.origin}/portal?phone=${encodeURIComponent(service.clientPhone)}&plate=${encodeURIComponent(service.vehiclePlate)}`;

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          clientName: service.clientName,
          clientPhone: phoneWithCountryCode,
          vehicleBrand: service.vehicleBrand,
          vehicleModel: service.vehicleModel,
          vehiclePlate: service.vehiclePlate,
          serviceStatus: status,
          portalUrl,
        },
      });

      if (error) {
        console.error('WhatsApp notification error:', error);
        return false;
      }

      console.log('WhatsApp notification sent:', data);
      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      return false;
    }
  };

  const updateStatus = async (id: string, newStatus: ServiceStatus, sendNotification: boolean = true) => {
    const service = services.find(s => s.id === id);
    
    try {
      const { error } = await supabase
        .from('services' as any)
        .update({ status: newStatus } as any)
        .eq('id', id);

      if (error) throw error;

      // Optimistic update
      setServices(prev => prev.map(s =>
        s.id === id
          ? { ...s, status: newStatus, updatedAt: new Date() }
          : s
      ));

      // Send WhatsApp notification if enabled and workshop has phone configured
      if (sendNotification && workshopPhone && service) {
        const notificationSent = await sendWhatsAppNotification({ ...service, status: newStatus }, newStatus);
        if (notificationSent) {
          toast({
            title: 'Notificación enviada',
            description: `Se notificó a ${service.clientName} por WhatsApp`,
          });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  const addDiagnosticReport = async (id: string, report: DiagnosticReport, nextMaintenanceDate?: Date) => {
    const service = services.find(s => s.id === id);
    
    try {
      const dbReport = {
        findings: report.findings,
        items: report.items,
        images: report.images,
        createdAt: report.createdAt.toISOString(),
      };

      const updateData: any = {
        diagnostic_report: dbReport,
        status: 'awaiting_approval',
      };

      // Add next maintenance date if provided
      if (nextMaintenanceDate) {
        updateData.next_maintenance_date = nextMaintenanceDate.toISOString();
      }

      const { error } = await supabase
        .from('services' as any)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Create maintenance reminder if date is set and we have workshop ID
      if (nextMaintenanceDate && workshopId && service) {
        // Calculate reminder date (7 days before maintenance)
        const reminderDate = new Date(nextMaintenanceDate);
        reminderDate.setDate(reminderDate.getDate() - 7);

        const vehicleInfo = `${service.vehicleBrand} ${service.vehicleModel} (${service.vehiclePlate})`;
        
        // Prepend Mexico country code for 10-digit numbers
        const phoneWithCountryCode = service.clientPhone.length === 10 
          ? `+52${service.clientPhone}` 
          : service.clientPhone;

        await supabase
          .from('maintenance_reminders' as any)
          .insert({
            service_id: id,
            workshop_id: workshopId,
            client_phone: phoneWithCountryCode,
            client_name: service.clientName,
            vehicle_info: vehicleInfo,
            reminder_date: reminderDate.toISOString().split('T')[0],
            reminder_type: 'date',
          } as any);
      }

      // Optimistic update
      setServices(prev => prev.map(s =>
        s.id === id
          ? {
              ...s,
              status: 'awaiting_approval' as ServiceStatus,
              diagnosticReport: report,
              updatedAt: new Date(),
            }
          : s
      ));
    } catch (error) {
      console.error('Error adding diagnostic report:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el reporte diagnóstico',
        variant: 'destructive',
      });
    }
  };

  const approveServices = async (id: string, approvedItemIds: string[], clientNotes?: string) => {
    const service = services.find(s => s.id === id);
    if (!service?.diagnosticReport) return;

    try {
      const updatedReport = {
        ...service.diagnosticReport,
        approvedAt: new Date().toISOString(),
        clientNotes,
        items: service.diagnosticReport.items.map(item => ({
          ...item,
          approved: approvedItemIds.includes(item.id),
        })),
      };

      // Convert dates to ISO strings for JSON storage
      const dbReport = {
        findings: updatedReport.findings,
        items: updatedReport.items,
        images: updatedReport.images,
        createdAt: service.diagnosticReport.createdAt instanceof Date 
          ? service.diagnosticReport.createdAt.toISOString() 
          : service.diagnosticReport.createdAt,
        approvedAt: updatedReport.approvedAt,
        clientNotes: updatedReport.clientNotes,
      };

      const { error } = await supabase
        .from('services' as any)
        .update({
          diagnostic_report: dbReport,
          status: 'in_progress',
        } as any)
        .eq('id', id);

      if (error) throw error;

      // Optimistic update
      setServices(prev => prev.map(s =>
        s.id === id
          ? {
              ...s,
              status: 'in_progress' as ServiceStatus,
              updatedAt: new Date(),
              diagnosticReport: {
                ...s.diagnosticReport!,
                approvedAt: new Date(),
                clientNotes,
                items: s.diagnosticReport!.items.map(item => ({
                  ...item,
                  approved: approvedItemIds.includes(item.id),
                })),
              },
            }
          : s
      ));
    } catch (error) {
      console.error('Error approving services:', error);
      toast({
        title: 'Error',
        description: 'No se pudo aprobar los servicios',
        variant: 'destructive',
      });
    }
  };

  const getCounts = (): Record<ServiceStatus | 'all' | 'total', number> => {
    const counts: Record<ServiceStatus | 'all' | 'total', number> = {
      all: services.length,
      received: 0,
      diagnosing: 0,
      awaiting_approval: 0,
      in_progress: 0,
      ready: 0,
      delivered: 0,
      total: services.length,
    };

    services.forEach(service => {
      counts[service.status]++;
    });

    return counts;
  };

  return (
    <ServicesContext.Provider value={{
      services,
      loading,
      workshopId,
      workshopPhone,
      workshopName,
      addService,
      deleteService,
      updateStatus,
      addDiagnosticReport,
      approveServices,
      getCounts,
      refreshServices,
      refreshWorkshopInfo,
      sendWhatsAppNotification,
    }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServicesContext() {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServicesContext must be used within a ServicesProvider');
  }
  return context;
}
