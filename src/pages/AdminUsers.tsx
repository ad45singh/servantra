import { useEffect, useState } from "react";
import { Loader2, Search, Shield, ShieldOff, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
  approval_status: string;
  role: string;
  services: any[];
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    const [profilesRes, rolesRes, servicesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("vendor_services").select("*"),
    ]);

    const rolesMap = new Map<string, string>();
    rolesRes.data?.forEach((r) => rolesMap.set(r.user_id, r.role));

    const servicesMap = new Map<string, any[]>();
    servicesRes.data?.forEach((s) => {
      if (!servicesMap.has(s.vendor_id)) servicesMap.set(s.vendor_id, []);
      servicesMap.get(s.vendor_id)!.push(s);
    });

    const merged: UserRow[] = (profilesRes.data || []).map((p: any) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      phone: p.phone,
      city: p.city,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      approval_status: p.approval_status ?? "pending",
      role: rolesMap.get(p.user_id) ?? "unknown",
      services: servicesMap.get(p.user_id) ?? [],
    }));

    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    // Realtime: any change to profiles, user_roles or vendor_services → re-fetch instantly
    const channel = supabase
      .channel("admin-users-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchUsers)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, fetchUsers)
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_services" }, fetchUsers)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Approve or reject a vendor
  const setApproval = async (userId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: status })
      .eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    setUsers((prev) =>
      prev.map((u) => u.user_id === userId ? { ...u, approval_status: status } : u)
    );
    toast.success(
      status === "approved"
        ? "✅ Vendor approved — they are now live on the service site!"
        : "Vendor rejected."
    );
  };

  // Change a user's role (customer ↔ vendor)
  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "vendor" ? "customer" : "vendor";
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    setUsers((prev) =>
      prev.map((u) => u.user_id === userId ? { ...u, role: newRole } : u)
    );
    toast.success(`Role changed to ${newRole}`);
  };

  const matches = (u: UserRow) => {
    const q = search.toLowerCase();
    return (
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").includes(q) ||
      (u.city ?? "").toLowerCase().includes(q)
    );
  };

  const pendingVendors  = users.filter((u) => u.role === "vendor" && u.approval_status === "pending"  && matches(u));
  const approvedVendors = users.filter((u) => u.role === "vendor" && u.approval_status === "approved" && matches(u));
  const rejectedVendors = users.filter((u) => u.role === "vendor" && u.approval_status === "rejected" && matches(u));
  const customers       = users.filter((u) => u.role !== "vendor" && u.role !== "admin"               && matches(u));

  const Avatar = ({ u }: { u: UserRow }) => (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
      {u.avatar_url
        ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
        : <span className="text-sm font-semibold text-muted-foreground">{(u.full_name || "?")[0]?.toUpperCase()}</span>
      }
    </div>
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-foreground">Users & Vendors</h1>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{users.length} total</Badge>
          {pendingVendors.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {pendingVendors.length} awaiting approval
            </Badge>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">
            Pending
            {pendingVendors.length > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {pendingVendors.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex-1">Approved</TabsTrigger>
          <TabsTrigger value="customers" className="flex-1">Customers</TabsTrigger>
        </TabsList>

        {/* ── PENDING TAB ── */}
        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingVendors.length === 0 && rejectedVendors.length === 0 && (
            <div className="text-center py-14">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">No vendors awaiting approval</p>
            </div>
          )}

          {pendingVendors.map((v) => (
            <Card key={v.user_id} className="border-orange-200 dark:border-orange-900/60">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar u={v} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{v.full_name || "No name"}</p>
                      <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-900/20 text-[10px]">
                        <Clock className="w-3 h-3 mr-1" /> Awaiting Approval
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.phone || "No phone"} · {v.city || "No city"}</p>
                    <p className="text-[10px] text-muted-foreground">Registered: {new Date(v.created_at).toLocaleDateString()}</p>

                    {v.services.length > 0 && (
                      <div className="mt-3 bg-muted/40 rounded-lg p-2.5 border border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Services Offered</p>
                        <div className="flex flex-wrap gap-1.5">
                          {v.services.map((s: any) => (
                            <div key={s.id} className="text-xs bg-background border border-border px-2 py-1 rounded-md">
                              <span className="font-medium">{s.name}</span>
                              <span className="text-muted-foreground ml-1">({s.category})</span>
                              <span className="ml-2 font-bold text-primary">₹{s.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/90 text-white flex-1"
                        onClick={() => setApproval(v.user_id, "approved")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setApproval(v.user_id, "rejected")}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Rejected vendors shown at bottom */}
          {rejectedVendors.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pt-4 pb-1 px-1">Rejected</p>
              {rejectedVendors.map((v) => (
                <Card key={v.user_id} className="opacity-60">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar u={v} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{v.full_name || "No name"}</p>
                        <p className="text-xs text-muted-foreground">{v.phone || "No phone"} · {v.city || "No city"}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setApproval(v.user_id, "approved")}>
                      Re-approve
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* ── APPROVED TAB ── */}
        <TabsContent value="approved" className="space-y-3 mt-4">
          {approvedVendors.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">No approved vendors yet</p>
          )}
          {approvedVendors.map((v) => (
            <Card key={v.user_id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar u={v} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{v.full_name || "No name"}</p>
                        <Badge className="bg-success/10 text-success border-success/20 text-[10px] shrink-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Live
                        </Badge>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setApproval(v.user_id, "rejected")}>
                          <ShieldOff className="w-3.5 h-3.5 mr-1" /> Suspend
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleRole(v.user_id, "vendor")} title="Change to customer">
                          <Shield className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.phone || "No phone"} · {v.city || "No city"}</p>
                    {v.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {v.services.map((s: any) => (
                          <span key={s.id} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                            {s.name} · ₹{s.price}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── CUSTOMERS TAB ── */}
        <TabsContent value="customers" className="space-y-3 mt-4">
          {customers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">No customers found</p>
          )}
          {customers.map((u) => (
            <Card key={u.user_id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar u={u} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.full_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{u.phone || "No phone"} · {u.city || "No city"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={u.role === "admin" ? "destructive" : "secondary"}>{u.role}</Badge>
                  {u.role !== "admin" && (
                    <Button size="sm" variant="outline" onClick={() => toggleRole(u.user_id, u.role)}>
                      <Shield className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsers;
