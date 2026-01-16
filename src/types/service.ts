export type ServiceStatus = 'received' | 'diagnosing' | 'in_progress' | 'ready' | 'delivered';

export interface Service {
  id: string;
  clientName: string;
  clientPhone: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear: string;
  serviceType: string;
  description: string;
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletion?: Date;
}

export const STATUS_LABELS: Record<ServiceStatus, string> = {
  received: 'Received',
  diagnosing: 'Diagnosing',
  in_progress: 'In Progress',
  ready: 'Ready for Pickup',
  delivered: 'Delivered',
};

export const STATUS_ORDER: ServiceStatus[] = [
  'received',
  'diagnosing',
  'in_progress',
  'ready',
  'delivered',
];
