import { useState } from "react";
import { Service, ServiceStatus, DiagnosticReport } from "@/types/service";

const INITIAL_SERVICES: Service[] = [
  {
    id: "1",
    clientName: "Michael Johnson",
    clientPhone: "+1 555-0123",
    vehicleBrand: "Toyota",
    vehicleModel: "Camry",
    vehiclePlate: "ABC-1234",
    vehicleYear: "2021",
    serviceType: "Oil Change",
    description: "Regular maintenance oil change with synthetic oil",
    status: "in_progress",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    diagnosticReport: {
      findings: "Engine oil is dark and needs replacement. Air filter is slightly dirty.",
      items: [
        { id: "1a", description: "Synthetic Oil Change", price: 75, approved: true, priority: "required" },
        { id: "1b", description: "Air Filter Replacement", price: 35, approved: true, priority: "recommended" },
      ],
      createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  },
  {
    id: "2",
    clientName: "Sarah Williams",
    clientPhone: "+1 555-0456",
    vehicleBrand: "Honda",
    vehicleModel: "Civic",
    vehiclePlate: "XYZ-5678",
    vehicleYear: "2019",
    serviceType: "Brake Service",
    description: "Front brake pads replacement",
    status: "diagnosing",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "3",
    clientName: "David Brown",
    clientPhone: "+1 555-0789",
    vehicleBrand: "Ford",
    vehicleModel: "F-150",
    vehiclePlate: "DEF-9012",
    vehicleYear: "2022",
    serviceType: "Engine Repair",
    description: "Check engine light diagnosis",
    status: "received",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    clientName: "Emily Davis",
    clientPhone: "+1 555-0321",
    vehicleBrand: "BMW",
    vehicleModel: "X5",
    vehiclePlate: "GHI-3456",
    vehicleYear: "2020",
    serviceType: "AC/Heating",
    description: "AC not cooling properly",
    status: "awaiting_approval",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    diagnosticReport: {
      findings: "AC compressor is failing and refrigerant levels are low. Cabin air filter is clogged.",
      items: [
        { id: "4a", description: "AC Compressor Replacement", price: 850, approved: false, priority: "required" },
        { id: "4b", description: "Refrigerant Recharge", price: 120, approved: false, priority: "required" },
        { id: "4c", description: "Cabin Air Filter", price: 45, approved: false, priority: "recommended" },
        { id: "4d", description: "AC System Flush", price: 180, approved: false, priority: "optional" },
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  },
];

export function useServices() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);

  const addService = (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newService: Service = {
      ...serviceData,
      id: crypto.randomUUID(),
      status: 'received',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setServices([newService, ...services]);
  };

  const updateStatus = (id: string, newStatus: ServiceStatus) => {
    setServices(services.map(service => 
      service.id === id 
        ? { ...service, status: newStatus, updatedAt: new Date() }
        : service
    ));
  };

  const addDiagnosticReport = (id: string, report: DiagnosticReport) => {
    setServices(services.map(service =>
      service.id === id
        ? { ...service, diagnosticReport: report, status: 'awaiting_approval', updatedAt: new Date() }
        : service
    ));
  };

  const approveServices = (id: string, approvedItemIds: string[], clientNotes?: string) => {
    setServices(services.map(service => {
      if (service.id !== id || !service.diagnosticReport) return service;
      
      return {
        ...service,
        status: 'in_progress' as ServiceStatus,
        updatedAt: new Date(),
        diagnosticReport: {
          ...service.diagnosticReport,
          approvedAt: new Date(),
          clientNotes,
          items: service.diagnosticReport.items.map(item => ({
            ...item,
            approved: approvedItemIds.includes(item.id),
          })),
        },
      };
    }));
  };

  const getCounts = () => {
    const counts: Record<ServiceStatus | 'all', number> = {
      all: services.length,
      received: 0,
      diagnosing: 0,
      awaiting_approval: 0,
      in_progress: 0,
      ready: 0,
      delivered: 0,
    };

    services.forEach(service => {
      counts[service.status]++;
    });

    return counts;
  };

  return {
    services,
    addService,
    updateStatus,
    addDiagnosticReport,
    approveServices,
    getCounts,
  };
}
