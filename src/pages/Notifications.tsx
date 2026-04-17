import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Tag, Truck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

type DBNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

const iconMap: Record<string, any> = {
  booking: CheckCircle,
  deal: Tag,
  emergency: AlertTriangle,
  update: Truck,
  info: Bell,
};

const colorMap: Record<string, string> = {
  booking: "bg-primary/10 text-primary",
  deal: "bg-secondary/10 text-secondary",
  emergency: "bg-emergency/10 text-emergency",
  update: "bg-success/10 text-success",
  info: "bg-muted text-muted-foreground",
};

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setNotifications(data || []);
      setLoading(false);
    };
    fetch();

    // Real-time subscription
    const channel = supabase
      .channel("user-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">Notifications</h1>
        {unread.length > 0 && (
          <>
            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-emergency text-emergency-foreground rounded-full">
              {unread.length} new
            </span>
            <button onClick={markAllRead} className="text-xs text-primary font-medium">Mark all read</button>
          </>
        )}
      </header>

      <div className="px-4 py-4 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {unread.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">New</h2>
                <div className="space-y-2">
                  {unread.map((n) => <NotifCard key={n.id} notif={n} />)}
                </div>
              </section>
            )}

            {read.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Earlier</h2>
                <div className="space-y-2">
                  {read.map((n) => <NotifCard key={n.id} notif={n} />)}
                </div>
              </section>
            )}

            {notifications.length === 0 && (
              <div className="text-center py-16">
                <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-heading font-semibold text-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-1">We'll notify you about bookings and offers</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const NotifCard = ({ notif }: { notif: DBNotification }) => {
  const Icon = iconMap[notif.type] || Bell;
  const color = colorMap[notif.type] || colorMap.info;
  const timeAgo = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true });

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl transition-all",
      notif.read ? "bg-card shadow-card" : "bg-card shadow-elevated border-l-4 border-primary"
    )}>
      <div className={cn("p-2 rounded-lg flex-shrink-0 mt-0.5", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-semibold text-foreground", !notif.read && "font-bold")}>{notif.title}</p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">{timeAgo}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
      </div>
    </div>
  );
};

export default Notifications;
