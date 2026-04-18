import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: "customer" | "vendor" | "admin" | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"customer" | "vendor" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const roles = data?.map(r => r.role) || [];
    let primaryRole: "customer" | "vendor" | "admin" | null = null;
    
    // Cast safely — after SQL migration 'admin' is a valid enum value
    if (roles.includes("admin" as any)) primaryRole = "admin";
    else if (roles.includes("vendor")) primaryRole = "vendor";
    else if (roles.includes("customer")) primaryRole = "customer";

    setUserRole(primaryRole);
  };

  useEffect(() => {
    // 1. Listen to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout 0 to avoid Supabase deadlock on auth callback
          setTimeout(() => fetchUserRole(session.user.id), 0);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // 2. Get the existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Realtime: if user_roles row is inserted/updated (e.g. admin sets role),
  //    re-fetch immediately so the UI redirects without a page refresh.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-role-watch-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchUserRole(user.id)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
