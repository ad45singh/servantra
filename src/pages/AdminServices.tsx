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
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<VendorService | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

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
    
    const channel = supabase
      .channel('admin-services')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_services' }, () => {
        fetchServices();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  const promptDeleteService = (service: VendorService) => {
    setServiceToDelete(service);
    setDeleteReason("");
    setDeleteModalOpen(true);
  };

  const confirmRemoveService = async () => {
    if (!serviceToDelete || !deleteReason.trim()) {
      toast.error("Reason for deletion is required");
      return;
    }
    
    setDeleting(true);
    try {
      // 1. Log the deletion reason
      const { data: userData } = await supabase.auth.getUser();
      
      try {
        await supabase.from("deleted_vendors_log" as any).insert({
          vendor_id: serviceToDelete.vendor_id,
          vendor_name: serviceToDelete.vendor_name,
          service_id: serviceToDelete.id,
          service_name: serviceToDelete.name,
          reason: deleteReason,
          deleted_by: userData?.user?.id
        });
      } catch (e) {
        console.log("Log table might not exist yet:", e);
      }

      // 2. Delete the service
      const { error: serviceError } = await supabase
        .from("vendor_services")
        .delete()
        .eq("id", serviceToDelete.id);

      if (serviceError) throw serviceError;
      
      // 3. Delete the vendor account associated automatically
      await supabase.from("user_roles").delete().eq("user_id", serviceToDelete.vendor_id);
      await supabase.from("profiles").delete().eq("user_id", serviceToDelete.vendor_id);
      
      setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
      toast.success("Service and associated vendor account deleted successfully");
      setDeleteModalOpen(false);
      setServiceToDelete(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
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

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-elevated border-destructive/20 animate-slide-up">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-destructive mb-2">
                <Trash2 className="w-6 h-6" />
                <h2 className="text-xl font-bold">Delete Vendor Service</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                You are about to delete the service <strong className="text-foreground">{serviceToDelete?.name}</strong>. 
                <span className="text-destructive font-semibold block mt-1">Warning: This will also automatically delete the associated vendor account ({serviceToDelete?.vendor_name}).</span>
              </p>
              
              <div className="space-y-2 mt-4">
                <label className="text-sm font-semibold text-foreground">Reason for Deletion <span className="text-destructive">*</span></label>
                <textarea 
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Please specify why this vendor is being removed..."
                  className="w-full min-h-[100px] p-3 rounded-xl bg-muted border-none focus:outline-none focus:ring-2 focus:ring-destructive resize-none text-sm text-foreground"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={confirmRemoveService} disabled={!deleteReason.trim() || deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Permanently"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  onClick={() => promptDeleteService(service)}
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
