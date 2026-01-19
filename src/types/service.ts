export type ServiceStatus = 'received' | 'diagnosing' | 'awaiting_approval' | 'in_progress' | 'ready' | 'delivered';

export interface DiagnosticItem {
  id: string;
  description: string;
  price: number;
  approved: boolean;
  priority: 'required' | 'recommended' | 'optional';
}

export interface DiagnosticReport {
  findings: string;
  items: DiagnosticItem[];
  createdAt: Date;
  approvedAt?: Date;
  clientNotes?: string;
}

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
  diagnosticReport?: DiagnosticReport;
}

export const STATUS_LABELS: Record<ServiceStatus, string> = {
  received: 'Received',
  diagnosing: 'Diagnosing',
  awaiting_approval: 'Awaiting Approval',
  in_progress: 'In Progress',
  ready: 'Ready for Pickup',
  delivered: 'Delivered',
};

export const STATUS_ORDER: ServiceStatus[] = [
  'received',
  'diagnosing',
  'awaiting_approval',
  'in_progress',
  'ready',
  'delivered',
];
