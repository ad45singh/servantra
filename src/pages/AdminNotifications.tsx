import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle, AlertTriangle, ShieldAlert, UserPlus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminNotification = {
  id: string;
  type: "user" | "emergency" | "ticket" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const mockAdminNotifications: AdminNotification[] = [
  { id: "1", type: "emergency", title: "Active SOS Alert!", body: "Vendor Raj Kumar has triggered an SOS alert in Mumbai.", time: "Just now", read: false },
  { id: "2", type: "ticket", title: "New Support Ticket", body: "Customer Priya raised an issue regarding booking #B1234.", time: "10 min ago", read: false },
  { id: "3", type: "user", title: "New Vendor Registration", body: "Amit Singh has registered as a new Vendor (Electrician). Pending approval.", time: "1 hr ago", read: false },
  { id: "4", type: "system", title: "System Update", body: "The platform will undergo scheduled maintenance tonight at 2 AM.", time: "3 hrs ago", read: true },
  { id: "5", type: "ticket", title: "Ticket Resolved", body: "Support Agent marked ticket #T092 as resolved.", time: "Yesterday", read: true },
  { id: "6", type: "user", title: "User Reported", body: "Vendor reported customer for inappropriate behavior.", time: "2 days ago", read: true },
];

const iconMap = {
  user: UserPlus,
  emergency: ShieldAlert,
  ticket: Info,
  system: Bell,
};

const colorMap = {
  user: "bg-primary/10 text-primary",
  emergency: "bg-destructive/10 text-destructive",
  ticket: "bg-secondary/10 text-secondary",
  system: "bg-muted text-foreground",
};

const AdminNotifications = () => {
  const unread = mockAdminNotifications.filter((n) => !n.read);
  const read = mockAdminNotifications.filter((n) => n.read);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform alerts and updates</p>
        </div>
        {unread.length > 0 && (
          <span className="px-3 py-1 text-xs font-bold bg-destructive text-destructive-foreground rounded-full shadow-sm">
            {unread.length} Unread
          </span>
        )}
      </header>

      <div className="space-y-8">
        {unread.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">New</h2>
            <div className="space-y-3">
              {unread.map((n) => (
                <AdminNotifCard key={n.id} notif={n} />
              ))}
            </div>
          </section>
        )}

        {read.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Earlier</h2>
            <div className="space-y-3">
              {read.map((n) => (
                <AdminNotifCard key={n.id} notif={n} />
              ))}
            </div>
          </section>
        )}

        {mockAdminNotifications.length === 0 && (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-base font-bold text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No new notifications for the admin team.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminNotifCard = ({ notif }: { notif: AdminNotification }) => {
  const Icon = iconMap[notif.type];
  const color = colorMap[notif.type];

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl transition-all",
        notif.read ? "bg-card shadow-sm border border-border" : "bg-card shadow-md border-l-4 border-l-primary"
      )}
    >
      <div className={cn("p-2.5 rounded-lg flex-shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={cn("text-base font-semibold text-foreground", !notif.read && "font-bold")}>{notif.title}</p>
          <span className="text-xs font-medium text-muted-foreground flex-shrink-0 mt-1">{notif.time}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{notif.body}</p>
      </div>
    </div>
  );
};

export default AdminNotifications;
