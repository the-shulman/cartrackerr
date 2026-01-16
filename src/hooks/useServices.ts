import { useState } from "react";
import { Service, ServiceStatus } from "@/types/service";

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
    status: "ready",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
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

  const getCounts = () => {
    const counts: Record<ServiceStatus | 'all', number> = {
      all: services.length,
      received: 0,
      diagnosing: 0,
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
    getCounts,
  };
}
