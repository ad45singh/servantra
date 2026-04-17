import { useEffect, useState } from "react";
import { Loader2, Search, Star, MessageSquareQuote, CheckCircle2, EyeOff, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  customer_id: string;
  vendor_id: string;
  rating: number;
  review_text: string | null;
  photos: string[] | null;
  created_at: string;
  is_hidden?: boolean;
  customer_name?: string;
  vendor_name?: string;
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (reviewsError) {
        if (reviewsError.message.includes("does not exist")) {
          setReviews([]);
          setLoading(false);
          return;
        }
        throw reviewsError;
      }

      if (reviewsData && reviewsData.length > 0) {
        const userIds = [
          ...new Set([
            ...reviewsData.map((r: any) => r.customer_id),
            ...reviewsData.map((r: any) => r.vendor_id),
          ].filter(Boolean))
        ];

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", userIds);

          const profileMap = new Map((profilesData || []).map(p => [p.user_id, p.full_name]));

          const merged = reviewsData.map((r: any) => ({
            ...r,
            customer_name: profileMap.get(r.customer_id) || "Unknown Customer",
            vendor_name: profileMap.get(r.vendor_id) || "Unknown Vendor",
            // Fallback for hidden if column doesn't exist
            is_hidden: r.is_hidden || false,
          }));
          setReviews(merged);
        } else {
          setReviews(reviewsData.map((r: any) => ({ ...r, is_hidden: r.is_hidden || false })));
        }
      } else {
        setReviews([]);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const toggleVisibility = async (id: string, currentlyHidden: boolean) => {
    try {
      const { error } = await supabase
        .from("reviews" as any)
        .update({ is_hidden: !currentlyHidden })
        .eq("id", id);
      
      if (error && !error.message.includes("does not exist")) throw error;

      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_hidden: !currentlyHidden } : r));
      toast.success(!currentlyHidden ? "Review hidden from public" : "Review published publicly");
    } catch (error: any) {
      if (error.message.includes("does not exist")) {
         // Fallback if column not there
         setReviews(prev => prev.map(r => r.id === id ? { ...r, is_hidden: !currentlyHidden } : r));
         toast.success(!currentlyHidden ? "Review hidden from public" : "Review published publicly");
      } else {
        toast.error("Failed to update visibility");
      }
    }
  };

  const filteredReviews = reviews.filter(r => 
    (r.review_text?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (r.customer_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (r.vendor_name?.toLowerCase() || "").includes(search.toLowerCase())
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feedback & Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage ratings and feedback across the platform</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{reviews.filter(r => !r.is_hidden).length} Published</Badge>
          <Badge variant="outline">{reviews.filter(r => r.is_hidden).length} Hidden</Badge>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search reviews by content, customer, or vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReviews.map((review) => (
          <Card key={review.id} className={cn("transition-all", review.is_hidden && "opacity-75 bg-muted/30")}>
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-md">
                  <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                  <span className="text-sm font-bold text-secondary">{review.rating}.0</span>
                </div>
                {review.is_hidden ? (
                  <Badge variant="destructive" className="text-[10px]"><EyeOff className="w-3 h-3 mr-1"/> Hidden</Badge>
                ) : (
                  <Badge variant="default" className="text-[10px] bg-success/10 text-success hover:bg-success/20 border-0"><CheckCircle2 className="w-3 h-3 mr-1"/> Published</Badge>
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm text-foreground line-clamp-3 leading-relaxed mb-4">
                  "{review.review_text || "No written feedback provided."}"
                </p>
                
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {review.photos.map((photo, i) => (
                      <img key={i} src={photo} alt="" className="w-12 h-12 rounded-lg object-cover border border-border shrink-0" />
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3 mt-auto space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium text-foreground">{review.customer_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">To Vendor:</span>
                  <span className="font-medium text-foreground">{review.vendor_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>

                <div className="pt-2 mt-2 border-t border-border">
                  <Button 
                    variant={review.is_hidden ? "default" : "outline"}
                    size="sm" 
                    className="w-full"
                    onClick={() => toggleVisibility(review.id, !!review.is_hidden)}
                  >
                    {review.is_hidden ? (
                      <><Eye className="w-4 h-4 mr-2" /> Publish Review</>
                    ) : (
                      <><EyeOff className="w-4 h-4 mr-2" /> Hide Review</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredReviews.length === 0 && (
        <div className="text-center py-16 bg-card rounded-xl border border-border border-dashed">
          <MessageSquareQuote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No reviews found</p>
          <p className="text-xs text-muted-foreground mt-1">Customers haven't submitted any feedback yet.</p>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
