import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, Check, X, RotateCcw, ChevronRight, Star, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format, parse, differenceInHours, isBefore, addDays } from "date-fns";
import { toast } from "sonner";

type BookingStatus = "upcoming" | "completed" | "cancelled";

const tabs: { key: BookingStatus; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const statusColors: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  confirmed: "bg-primary/10 text-primary",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const BookingHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<BookingStatus>("upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; booking: any | null }>({ open: false, booking: null });
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState<string>("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, service_type, sub_service, scheduled_date, scheduled_time, price, status,
          vendor:profiles!bookings_vendor_id_fkey(full_name)
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching customer bookings:", error);
        toast.error("Failed to load your bookings: " + error.message);
      }

      if (data) {
        // Map the database fields to the UI fields
        const formattedBookings = data.map((b: any) => ({
          id: b.id,
          service: b.sub_service || b.service_type,
          vendor: b.vendor?.full_name || "Assigning...",
          date: b.scheduled_date,
          time: b.scheduled_time,
          price: b.price,
          status: b.status,
          rated: false, // You would fetch actual ratings here in a complete app
        }));
        setBookings(formattedBookings);
      }
      setLoading(false);
    };

    fetchBookings();

    // Subscribe to real-time updates for bookings
    const channel = supabase
      .channel("customer-bookings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `customer_id=eq.${user.id}` },
        () => {
          fetchBookings(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "upcoming") return ["pending", "confirmed", "in_progress"].includes(b.status);
    if (activeTab === "completed") return b.status === "completed";
    if (activeTab === "cancelled") return b.status === "cancelled";
    return false;
  });

  // Helper function to check if reschedule is allowed (not within 8 hours)
  const canReschedule = (date: string, time: string) => {
    try {
      const scheduledDateTime = parse(`${date} ${time}`, "MMM dd, yyyy hh:mm a", new Date());
      const hoursUntil = differenceInHours(scheduledDateTime, new Date());
      return hoursUntil > 8;
    } catch {
      return false;
    }
  };

  const handleRescheduleOpen = (booking: any) => {
    setRescheduleDialog({ open: true, booking });
    setNewDate(undefined);
    setNewTime("");
  };

  const handleRescheduleSubmit = async () => {
    if (!newDate || !newTime || !rescheduleDialog.booking) {
      toast.error("Please select both date and time");
      return;
    }

    setIsRescheduling(true);
    try {
      const formattedDate = format(newDate, "yyyy-MM-dd");
      const { error } = await supabase
        .from("bookings")
        .update({
          scheduled_date: formattedDate,
          scheduled_time: newTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rescheduleDialog.booking.id);

      if (error) throw error;

      toast.success("Booking rescheduled successfully!");
      setRescheduleDialog({ open: false, booking: null });
      // In a real app, refetch bookings here
      window.location.reload();
    } catch (error: any) {
      toast.error("Failed to reschedule booking");
      console.error(error);
    } finally {
      setIsRescheduling(false);
    }
  };

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
  ];

  // Fetch unread counts for upcoming bookings
  useEffect(() => {
    if (!user || bookings.length === 0) return;
    const bookingIds = bookings.map(b => b.id);

    const fetchUnread = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("booking_id")
        .in("booking_id", bookingIds)
        .neq("sender_id", user.id)
        .eq("read", false);
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((m: any) => {
          counts[m.booking_id] = (counts[m.booking_id] || 0) + 1;
        });
        setUnreadCounts(counts);
      }
    };
    fetchUnread();

    const channel = supabase
      .channel('customer-unread-badges')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload: any) => {
        const msg = payload.new;
        if (msg.sender_id !== user.id) {
          setUnreadCounts(prev => ({ ...prev, [msg.booking_id]: (prev[msg.booking_id] || 0) + 1 }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border px-4 pt-4 pb-0">
        <h1 className="font-heading font-semibold text-foreground mb-3">My Bookings</h1>
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold transition-all border-b-2",
                activeTab === tab.key
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-heading font-semibold text-foreground">No {activeTab} bookings</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === "upcoming" ? "Book a service to get started!" : "Your past bookings will appear here."}
            </p>
            {activeTab === "upcoming" && (
              <Button size="sm" className="mt-4" onClick={() => navigate("/search")}>
                Find Services
              </Button>
            )}
          </div>
        ) : (
          filteredBookings.map((booking: any) => (
          <div key={booking.id} className="bg-card rounded-xl shadow-card overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-heading font-semibold text-foreground">{booking.service}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{booking.vendor}</p>
                </div>
                <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-full capitalize", statusColors[booking.status])}>
                  {booking.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> {booking.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {booking.time}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-sm font-heading font-bold text-foreground">₹{booking.price}</span>
                <div className="flex gap-2 flex-wrap justify-end">
                  {activeTab === "completed" && !booking.rated && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/review/${booking.id}`)}
                    >
                      <Star className="w-3.5 h-3.5" /> Rate
                    </Button>
                  )}
                  {activeTab === "completed" && (
                    <Button variant="outline" size="sm" onClick={() => navigate("/book")}>
                      <RotateCcw className="w-3.5 h-3.5" /> Rebook
                    </Button>
                  )}
                  {activeTab === "upcoming" && (
                    <Button variant="outline" size="sm" className="relative" onClick={() => navigate(`/chat/${booking.id}`)}>
                      <MessageCircle className="w-3.5 h-3.5" />
                      {unreadCounts[booking.id] > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                          {unreadCounts[booking.id]}
                        </Badge>
                      )}
                    </Button>
                  )}
                  {activeTab === "upcoming" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRescheduleOpen(booking)}
                      disabled={!canReschedule(booking.date, booking.time)}
                      title={!canReschedule(booking.date, booking.time) ? "Cannot reschedule within 8 hours of service" : "Reschedule booking"}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                    </Button>
                  )}
                  {activeTab === "upcoming" && booking.status === "confirmed" && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/tracking/${booking.id}`)}>
                      Track <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialog.open} onOpenChange={(open) => setRescheduleDialog({ open, booking: open ? rescheduleDialog.booking : null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Select a new date and time for your {rescheduleDialog.booking?.service} service.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            {/* Date Picker */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Select Date</p>
              <Calendar
                mode="single"
                selected={newDate}
                onSelect={setNewDate}
                disabled={(date) => isBefore(date, addDays(new Date(), 0))}
                className="rounded-md border pointer-events-auto"
              />
            </div>

            {/* Time Slots */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Select Time</p>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={newTime === slot ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setNewTime(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              className="w-full" 
              onClick={handleRescheduleSubmit}
              disabled={!newDate || !newTime || isRescheduling}
            >
              {isRescheduling ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Note: Rescheduling is not available within 8 hours of scheduled service time.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingHistory;
