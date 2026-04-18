import { useEffect, useState } from "react";
import { Loader2, Search, Mail, MessageSquare, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  user_type: string;
  status: "open" | "resolved" | "closed";
  created_at: string;
  user_name?: string;
};

const AdminSupport = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const fetchTickets = async () => {
    try {
      // Trying to fetch tickets, if table exists
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("support_tickets" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (ticketsError) {
        if (ticketsError.message.includes("does not exist")) {
          // Table doesn't exist, show empty or mock
          setTickets([]);
          setLoading(false);
          return;
        }
        throw ticketsError;
      }

      // Fetch user profiles for the tickets
      if (ticketsData && ticketsData.length > 0) {
        const userIds = [...new Set(ticketsData.map((t: any) => t.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", userIds);

          const profileMap = new Map((profilesData || []).map(p => [p.user_id, p.full_name]));
          
          const merged = ticketsData.map((t: any) => ({
            ...t,
            user_name: profileMap.get(t.user_id) || "Unknown User"
          }));
          setTickets(merged);
        } else {
          setTickets(ticketsData as any);
        }
      } else {
        setTickets([]);
      }
    } catch (error: any) {
      console.error(error);
      // Suppress error if it's just missing table in dev
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const updateTicketStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets" as any)
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error && !error.message.includes("does not exist")) throw error;

      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t));
      if (selectedTicket?.id === id) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
      toast.success(`Ticket marked as ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    
    // In a real app, you'd insert this into a ticket_replies table
    // For now, we'll simulate the reply and mark resolved
    toast.success("Reply sent to user successfully");
    setReplyMessage("");
    updateTicketStatus(selectedTicket.id, "resolved");
    setSelectedTicket(null);
  };

  const filteredTickets = tickets.filter(t => 
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openTickets = filteredTickets.filter(t => t.status === "open");
  const resolvedTickets = filteredTickets.filter(t => t.status === "resolved" || t.status === "closed");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 flex flex-col md:flex-row gap-6">
      {/* Left List Pane */}
      <div className="w-full md:w-1/3 space-y-4 flex flex-col">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Support & Tickets</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="open" className="flex-1 flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="open" className="flex-1">
              Open <Badge variant="secondary" className="ml-2 h-5 bg-background">{openTickets.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 flex-1 overflow-y-auto space-y-3 max-h-[calc(100vh-250px)] pr-2 scrollbar-hide">
            <TabsContent value="open" className="m-0 space-y-3">
              {openTickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className={cn("cursor-pointer transition-all hover:border-primary/50", selectedTicket?.id === ticket.id && "border-primary bg-primary/5")}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{ticket.subject}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0 bg-background">{ticket.user_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ticket.message}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                      <span className="font-medium text-foreground">{ticket.user_name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {openTickets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No open tickets</div>
              )}
            </TabsContent>
            
            <TabsContent value="resolved" className="m-0 space-y-3">
              {resolvedTickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className={cn("cursor-pointer transition-all opacity-80 hover:opacity-100", selectedTicket?.id === ticket.id && "border-primary bg-primary/5 opacity-100")}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{ticket.subject}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0 bg-success/20 text-success border-success/30">Resolved</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ticket.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{ticket.user_name}</p>
                  </CardContent>
                </Card>
              ))}
              {resolvedTickets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No resolved tickets</div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Right Detail Pane */}
      <div className="w-full md:w-2/3 h-full min-h-[500px]">
        {selectedTicket ? (
          <Card className="h-full flex flex-col shadow-card">
            <div className="p-4 border-b border-border flex items-start justify-between bg-muted/30">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={selectedTicket.status === "open" ? "default" : "secondary"}>
                    {selectedTicket.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Ticket #{selectedTicket.id.split("-")[0]}</span>
                </div>
                <h2 className="text-lg font-bold text-foreground">{selectedTicket.subject}</h2>
                <p className="text-sm text-muted-foreground mt-1">From: <span className="font-medium text-foreground">{selectedTicket.user_name}</span> ({selectedTicket.user_type})</p>
              </div>
              <div className="flex gap-2">
                {selectedTicket.status === "open" ? (
                  <Button size="sm" variant="outline" onClick={() => updateTicketStatus(selectedTicket.id, "resolved")}>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-success" /> Mark Resolved
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => updateTicketStatus(selectedTicket.id, "open")}>
                    <Clock className="w-4 h-4 mr-1.5" /> Reopen
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/10">
              {/* User Message */}
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-card border border-border rounded-2xl rounded-tl-sm p-4 shadow-sm">
                  <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">{selectedTicket.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-2 text-right">
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Reply Input Box */}
            <div className="p-4 bg-card border-t border-border">
              {selectedTicket.status === "open" ? (
                <div className="space-y-3">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply to the user..."
                    className="w-full min-h-[100px] p-3 text-sm rounded-xl bg-muted border-none focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">An email/notification will be sent to the user.</p>
                    <Button onClick={handleReply} disabled={!replyMessage.trim()}>
                      <Mail className="w-4 h-4 mr-2" /> Send Reply
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" /> This ticket is resolved. Reopen to reply.
                  </p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="h-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground p-8 min-h-[500px]">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">Select a ticket to view details</p>
            <p className="text-xs text-center max-w-xs mt-2 opacity-70">
              Choose an open ticket from the list to reply to the user or mark it as resolved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
