import { useEffect, useState } from "react";
import { Loader2, Search, Wrench, IndianRupee, Clock, Trash2, Power } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type VendorService = {
  id: string;
  vendor_id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  active: boolean;
  vendor_name?: string;
};

const AdminServices = () => {
  const [services, setServices] = useState<VendorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchServices = async () => {
    try {
      // Fetch all vendor services
      const { data: servicesData, error: servicesError } = await supabase
        .from("vendor_services")
        .select("*")
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      // Fetch vendor profiles to get names
      const vendorIds = [...new Set(servicesData.map(s => s.vendor_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", vendorIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profilesData.map(p => [p.user_id, p.full_name]));

      const merged = servicesData.map(s => ({
        ...s,
        vendor_name: profileMap.get(s.vendor_id) || "Unknown Vendor"
      }));

      setServices(merged);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const toggleServiceStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("vendor_services")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      
      setServices(prev => 
        prev.map(s => s.id === id ? { ...s, active: !currentStatus } : s)
      );
      toast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const removeService = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this service?")) return;
    
    try {
      const { error } = await supabase
        .from("vendor_services")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success("Service removed successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filtered = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    (s.vendor_name && s.vendor_name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-foreground">Services Control</h1>
        <div className="flex gap-2">
          <Badge variant="secondary">{services.filter(s => s.active).length} Active</Badge>
          <Badge variant="outline">{services.length} Total</Badge>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by service, category or vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((service) => (
          <Card key={service.id} className={cn("transition-all", !service.active && "opacity-70 bg-muted/50")}>
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{service.name}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{service.category}</Badge>
                    {!service.active && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vendor: <span className="font-medium text-foreground">{service.vendor_name}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1 bg-background px-2 py-1 rounded-md border">
                      <IndianRupee className="w-3 h-3" /> {service.price}
                    </span>
                    <span className="flex items-center gap-1 bg-background px-2 py-1 rounded-md border">
                      <Clock className="w-3 h-3" /> {service.duration}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button 
                  size="sm" 
                  variant={service.active ? "outline" : "default"} 
                  onClick={() => toggleServiceStatus(service.id, service.active)}
                  className="flex-1 sm:flex-none"
                >
                  <Power className="w-4 h-4 mr-2" />
                  {service.active ? "Deactivate" : "Activate"}
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => removeService(service.id)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border border-border border-dashed">
            <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No services found</p>
            <p className="text-xs text-muted-foreground mt-1">No vendor has added services yet, or try adjusting your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminServices;
