import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { serviceCatalog } from "@/data/services";

type VendorService = {
  id: string; // local unique id for array mapping
  category: string;
  sub_service: string;
  description: string;
  experience: string;
  price: string;
};

const VendorOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shopNumber, setShopNumber] = useState("");
  const [services, setServices] = useState<VendorService[]>([
    { id: "1", category: "Plumbing", sub_service: "", description: "", experience: "", price: "" }
  ]);

  const addService = () => {
    setServices([
      ...services,
      { id: Date.now().toString(), category: "Plumbing", sub_service: "", description: "", experience: "", price: "" }
    ]);
  };

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter(s => s.id !== id));
    } else {
      toast.error("You must provide at least one service.");
    }
  };

  const updateService = (id: string, field: keyof VendorService, value: string) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    for (const s of services) {
      if (!s.sub_service.trim() || !s.description.trim() || !s.experience.trim() || !s.price.trim()) {
        toast.error("Please fill all required fields for each service.");
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Update Profile with shop number (if needed, or store in a separate table)
      if (shopNumber.trim()) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ address: shopNumber.trim() }) // storing shop number in address for simplicity
          .eq("user_id", user.id);
        if (profileError) throw profileError;
      }

      // 2. Insert services into vendor_services
      const servicesToInsert = services.map(s => ({
        vendor_id: user.id,
        category: s.category,
        sub_service: s.sub_service,
        description: s.description,
        experience_years: parseInt(s.experience) || 0,
        price: parseFloat(s.price) || 0,
        is_active: true
      }));

      const { error: serviceError } = await supabase
        .from("vendor_services")
        .insert(servicesToInsert);

      if (serviceError) throw serviceError;

      toast.success("Welcome aboard! Your services have been listed.");
      navigate("/vendor");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-4">
        <h1 className="text-xl font-heading font-bold text-foreground">Set Up Your Services</h1>
        <p className="text-sm text-muted-foreground mt-1">Tell us what you do to start getting bookings.</p>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 animate-fade-in">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* General Information */}
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
            <h2 className="text-base font-semibold text-foreground mb-4">General Details</h2>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Shop/Office Number (Optional)</label>
              <Input
                placeholder="e.g. Shop No 42, Main Market"
                value={shopNumber}
                onChange={(e) => setShopNumber(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Services Array */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Your Services</h2>
            </div>

            {services.map((service, index) => (
              <div key={service.id} className="bg-card rounded-2xl p-5 shadow-card border border-border relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-primary">Service #{index + 1}</h3>
                  {services.length > 1 && (
                    <button type="button" onClick={() => removeService(service.id)} className="text-destructive hover:text-destructive/80 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={service.category}
                        onChange={(e) => updateService(service.id, "category", e.target.value)}
                      >
                        {serviceCatalog.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Specific Service</label>
                      <Input
                        required
                        placeholder="e.g. Pipe Leak Repair"
                        value={service.sub_service}
                        onChange={(e) => updateService(service.id, "sub_service", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                    <Textarea
                      required
                      placeholder="Describe what is included in this service..."
                      value={service.description}
                      onChange={(e) => updateService(service.id, "description", e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Experience (Years)</label>
                      <Input
                        required
                        type="number"
                        min="0"
                        placeholder="e.g. 5"
                        value={service.experience}
                        onChange={(e) => updateService(service.id, "experience", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Base Price (₹)</label>
                      <Input
                        required
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={service.price}
                        onChange={(e) => updateService(service.id, "price", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addService} className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-2" /> Add Another Service
          </Button>

          <Button type="submit" size="xl" className="w-full h-14 text-base" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Complete Setup <CheckCircle2 className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VendorOnboarding;
