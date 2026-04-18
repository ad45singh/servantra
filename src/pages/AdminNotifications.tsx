import { useEffect, useState } from "react";
import { Bell, ShieldAlert, UserPlus, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

type DBNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  user_id: string;
};

const iconMap: Record<string, any> = {
  user: UserPlus,
  emergency: ShieldAlert,
  booking: Info,
  info: Bell,
};

const colorMap: Record<string, string> = {
  user: "bg-primary/10 text-primary",
  emergency: "bg-destructive/10 text-destructive",
  booking: "bg-secondary/10 text-secondary",
  info: "bg-muted text-foreground",
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    // Admin sees all notifications across all users
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    // Real-time: listen to all new notifications platform-wide
    const channel = supabase
      .channel("admin-notifications-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => fetchNotifications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform-wide alerts and updates</p>
        </div>
        <div className="flex items-center gap-3">
          {unread.length > 0 && (
            <>
              <span className="px-3 py-1 text-xs font-bold bg-destructive text-destructive-foreground rounded-full shadow-sm">
                {unread.length} Unread
              </span>
              <button onClick={markAllRead} className="text-sm text-primary font-medium hover:underline">
                Mark all read
              </button>
            </>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {unread.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">New</h2>
              <div className="space-y-3">
                {unread.map((n) => <AdminNotifCard key={n.id} notif={n} />)}
              </div>
            </section>
          )}

          {read.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Earlier</h2>
              <div className="space-y-3">
                {read.map((n) => <AdminNotifCard key={n.id} notif={n} />)}
              </div>
            </section>
          )}

          {notifications.length === 0 && (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-base font-bold text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No notifications across the platform.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminNotifCard = ({ notif }: { notif: DBNotification }) => {
  const Icon = iconMap[notif.type] || Bell;
  const color = colorMap[notif.type] || colorMap.info;
  const timeAgo = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true });

  return (
    <div className={cn(
      "flex items-start gap-4 p-4 rounded-xl transition-all",
      notif.read ? "bg-card shadow-sm border border-border" : "bg-card shadow-md border-l-4 border-l-primary"
    )}>
      <div className={cn("p-2.5 rounded-lg flex-shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={cn("text-base font-semibold text-foreground", !notif.read && "font-bold")}>{notif.title}</p>
          <span className="text-xs font-medium text-muted-foreground flex-shrink-0 mt-1">{timeAgo}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{notif.message}</p>
      </div>
    </div>
  );
};

export default AdminNotifications;
