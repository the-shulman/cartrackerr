import { useState } from "react";
import { Header } from "@/components/Header";
import { ServiceCard } from "@/components/ServiceCard";
import { AddServiceDialog } from "@/components/AddServiceDialog";
import { StatsCard } from "@/components/StatsCard";
import { FilterTabs } from "@/components/FilterTabs";
import { useServicesContext } from "@/contexts/ServicesContext";
import { useBranding } from "@/hooks/useBranding";
import { ServiceStatus } from "@/types/service";
import { Inbox, Search, Wrench, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

const Index = () => {
  const { services, addService, updateStatus, addDiagnosticReport, approveServices, getCounts } = useServicesContext();
  const { branding, updateBranding, resetBranding } = useBranding();
  const [activeFilter, setActiveFilter] = useState<ServiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const counts = getCounts();

  const filteredServices = services.filter(service => {
    const matchesFilter = activeFilter === 'all' || service.status === activeFilter;
    const matchesSearch = searchQuery === "" || 
      service.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.vehicleBrand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header 
        branding={branding} 
        onUpdateBranding={updateBranding} 
        onResetBranding={resetBranding} 
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            title="Received" 
            value={counts.received} 
            icon={Inbox} 
            color="received" 
          />
          <StatsCard 
            title="Diagnosing" 
            value={counts.diagnosing} 
            icon={Search} 
            color="diagnosing" 
          />
          <StatsCard 
            title="In Progress" 
            value={counts.in_progress} 
            icon={Wrench} 
            color="progress" 
          />
          <StatsCard 
            title="Ready" 
            value={counts.ready} 
            icon={CheckCircle} 
            color="ready" 
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="w-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <FilterTabs 
              activeFilter={activeFilter} 
              onFilterChange={setActiveFilter}
              counts={counts}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <AddServiceDialog onAdd={addService} />
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onStatusChange={updateStatus}
                onAddDiagnosticReport={addDiagnosticReport}
                onApproveServices={approveServices}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No services found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Add a new service to get started"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
