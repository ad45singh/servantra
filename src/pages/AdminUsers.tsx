import { useEffect, useState } from "react";
import { Loader2, Search, Shield, ShieldOff, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserWithRole = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: string;
  services?: any[];
  experience_years?: number;
  is_online?: boolean;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const [profilesRes, rolesRes, servicesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("vendor_services").select("*"),
      ]);

      const rolesMap = new Map<string, string>();
      rolesRes.data?.forEach((r) => rolesMap.set(r.user_id, r.role));

      const vendorServicesMap = new Map<string, any[]>();
      servicesRes.data?.forEach((s) => {
        if (!vendorServicesMap.has(s.vendor_id)) vendorServicesMap.set(s.vendor_id, []);
        vendorServicesMap.get(s.vendor_id)?.push(s);
      });

      const merged = (profilesRes.data || []).map((p) => ({
        ...p,
        role: rolesMap.get(p.user_id) || "unknown",
        services: vendorServicesMap.get(p.user_id) || [],
      }));

      setUsers(merged);
      setLoading(false);
    };
    fetchUsers();

    // Real-time: instantly show new users/vendors
    const channel = supabase
      .channel("admin-users-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, fetchUsers)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, fetchUsers)
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_services" }, fetchUsers)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "vendor" ? "customer" : "vendor";
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
    );
    toast.success(`Role changed to ${newRole}`);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.role !== "vendor" &&
      ((u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.phone || "").includes(search) ||
        (u.city || "").toLowerCase().includes(search.toLowerCase()))
  );

  const filteredVendors = users.filter(
    (u) =>
      u.role === "vendor" &&
      ((u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.phone || "").includes(search) ||
        (u.city || "").toLowerCase().includes(search.toLowerCase()))
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
        <h1 className="text-2xl font-bold text-foreground">Users & Vendors</h1>
        <Badge variant="secondary">{users.length} total</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All Users</TabsTrigger>
          <TabsTrigger value="vendors" className="flex-1">Active Vendors</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-3 mt-4">
          {filteredUsers.map((user) => (
            <Card key={user.user_id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {(user.full_name || "?")[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.full_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{user.phone || "No phone"} · {user.city || "No city"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                    {user.role}
                  </Badge>
                  {user.role !== "admin" && (
                    <Button size="sm" variant="outline" onClick={() => toggleRole(user.user_id, user.role || "customer")}>
                      <Shield className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No users found</p>
          )}
        </TabsContent>
        <TabsContent value="vendors" className="space-y-3 mt-4">
          {filteredVendors.map((user) => (
            <Card key={user.user_id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {(user.full_name || "?")[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{user.full_name || "No name"}</p>
                        <span className="flex items-center gap-1 text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded-full font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Available
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="default">Vendor</Badge>
                        <Button size="sm" variant="outline" onClick={() => toggleRole(user.user_id, "vendor")}>
                          <ShieldOff className="w-4 h-4" /> Revoke
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {user.phone || "No phone"} · {user.city || "No city"} · Joined: {new Date(user.created_at).toLocaleDateString()}
                    </p>

                    {user.services && user.services.length > 0 && (
                      <div className="mt-3 bg-muted/30 rounded-lg p-2.5 border border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Services Offered</p>
                        <div className="flex flex-wrap gap-2">
                          {user.services.map((s: any) => (
                            <div key={s.id} className="text-xs bg-background border border-border px-2 py-1.5 rounded-md flex items-center gap-2">
                              <span className="font-medium text-foreground">{s.name} <span className="text-[10px] text-muted-foreground">({s.category})</span></span>
                              <span className="text-muted-foreground font-semibold">₹{s.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        <span className="text-sm font-semibold">4.8</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground text-sm">{user.experience_years || 5}</span> yrs experience
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredVendors.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No active vendors found</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsers;
