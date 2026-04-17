import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, ArrowRight, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ActiveBooking = {
  id: string;
  service_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  vendor_id: string | null;
};

const statusColor: Record<string, string> = {
  confirmed: "bg-secondary/10 text-secondary",
  in_progress: "bg-primary/10 text-primary",
  pending: "bg-muted text-muted-foreground",
};

const statusLabel: Record<string, string> = {
  confirmed: "Confirmed",
  in_progress: "In Progress",
  pending: "Pending",
};

const ActiveBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ActiveBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, service_type, status, scheduled_date, scheduled_time, vendor_id")
        .eq("customer_id", user.id)
        .in("status", ["pending", "confirmed", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(3);
      setBookings(data || []);
      setLoading(false);
    };
    fetch();

    // Real-time subscription
    const channel = supabase
      .channel("active-bookings-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `customer_id=eq.${user.id}` }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading || bookings.length === 0) return null;

  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Active Bookings</h2>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <button
            key={booking.id}
            onClick={() => navigate("/bookings")}
            className="w-full flex items-center gap-3 bg-card rounded-xl p-4 shadow-card hover:shadow-elevated transition-all text-left"
          >
            <div className={`p-2 rounded-lg ${statusColor[booking.status] || "bg-muted text-muted-foreground"}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-semibold text-foreground">{booking.service_type}</p>
              <p className="text-xs text-muted-foreground">{booking.scheduled_date} · {booking.scheduled_time}</p>
            </div>
            
            {booking.vendor_id ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/chat/${booking.id}`);
                }}
                className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                title="Chat with Vendor"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            ) : (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[booking.status] || "bg-muted text-muted-foreground"}`}>
                {statusLabel[booking.status] || booking.status}
              </span>
            )}
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </section>
  );
};

export default ActiveBookings;
