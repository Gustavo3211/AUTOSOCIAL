import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/supabase";
import { Session } from "@supabase/supabase-js";

interface UserProfile {
  id: number;
  username: string;
  Email: string;
  avatar_url?: string;
  bio?: string;
  is_premium?: boolean;
}

interface UserContextType {
  session: Session | null;
  currentUserProfile: UserProfile | null;
  isAuthLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const fetchUserProfile = async (email: string) => {
    const { data } = await supabase
      .from("User")
      .select("id, username, Email, avatar_url, bio, is_premium")
      .ilike("Email", email)
      .single();
    return data as UserProfile | null;
  };

  const refreshProfile = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user?.email) {
      const profile = await fetchUserProfile(currentSession.user.email);
      setCurrentUserProfile(profile);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user?.email) {
        const profile = await fetchUserProfile(initialSession.user.email);
        setCurrentUserProfile(profile);
      }
      setIsAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.email) {
        const profile = await fetchUserProfile(newSession.user.email);
        setCurrentUserProfile(profile);
      } else {
        setCurrentUserProfile(null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ session, currentUserProfile, isAuthLoading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
