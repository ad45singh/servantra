import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2, Settings as SettingsIcon } from "lucide-react";

type ServiceItem = {
  id: string;
  category: string;
  name: string;
  price: number;
  duration: string;
  active: boolean;
  display_order: number;
};

type FormState = {
  id?: string;
  category: string;
  name: string;
  price: string;
  duration: string;
  active: boolean;
};

const emptyForm: FormState = {
  category: "",
  name: "",
  price: "",
  duration: "",
  active: true,
};

const AdminSettings = () => {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("service_catalog")
      .select("*")
      .order("category", { ascending: true })
      .order("display_order", { ascending: true });
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setItems((data ?? []) as ServiceItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const categories = Array.from(new Set(items.map((i) => i.category))).sort();

  const grouped = categories.map((cat) => ({
    category: cat,
    services: items.filter((i) => i.category === cat),
  }));

  const openCreate = (preselectCategory?: string) => {
    setForm({ ...emptyForm, category: preselectCategory ?? "" });
    setNewCategory("");
    setDialogOpen(true);
  };

  const openEdit = (item: ServiceItem) => {
    setForm({
      id: item.id,
      category: item.category,
      name: item.name,
      price: String(item.price),
      duration: item.duration,
      active: item.active,
    });
    setNewCategory("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const finalCategory = (newCategory.trim() || form.category).trim();
    const name = form.name.trim();
    const duration = form.duration.trim();
    const price = parseInt(form.price, 10);

    if (!finalCategory || !name || !duration || isNaN(price) || price < 0) {
      toast({ title: "Missing fields", description: "Please fill all fields correctly.", variant: "destructive" });
      return;
    }

    setSaving(true);
    if (form.id) {
      const { error } = await supabase
        .from("service_catalog")
        .update({ category: finalCategory, name, price, duration, active: form.active })
        .eq("id", form.id);
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Service updated" });
        setDialogOpen(false);
        await load();
      }
    } else {
      const maxOrder = Math.max(
        0,
        ...items.filter((i) => i.category === finalCategory).map((i) => i.display_order),
      );
      const { error } = await supabase.from("service_catalog").insert({
        category: finalCategory,
        name,
        price,
        duration,
        active: form.active,
        display_order: maxOrder + 1,
      });
      if (error) {
        toast({ title: "Create failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Service added" });
        setDialogOpen(false);
        await load();
      }
    }
    setSaving(false);
  };

  const handleToggleActive = async (item: ServiceItem) => {
    const { error } = await supabase
      .from("service_catalog")
      .update({ active: !item.active })
      .eq("id", item.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i)));
    }
  };

  const handleDelete = async (item: ServiceItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    const { error } = await supabase.from("service_catalog").delete().eq("id", item.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Service deleted" });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            App Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage service categories, sub-services, and pricing.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openCreate()}>
              <Plus className="w-4 h-4" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit Service" : "Add Service"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or type a new category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Service name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Pipe Leak Repair"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g., 1 hr"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="text-sm">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Visible to customers and vendors
                  </p>
                </div>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
          <CardDescription>
            {categories.length} categories · {items.length} total services ·{" "}
            {items.filter((i) => i.active).length} active
          </CardDescription>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No services yet. Click "Add Service" to create the first one.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {grouped.map(({ category, services }) => (
            <AccordionItem
              key={category}
              value={category}
              className="border border-border rounded-lg bg-card px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-semibold">{category}</span>
                  <Badge variant="secondary">{services.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pb-2">
                  {services.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{item.name}</span>
                          {!item.active && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ₹{item.price} · {item.duration}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={item.active}
                          onCheckedChange={() => handleToggleActive(item)}
                        />
                        <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => openCreate(category)}
                  >
                    <Plus className="w-4 h-4" /> Add to {category}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default AdminSettings;
