import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  username: string | null;
  email: string | null;
  class_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_online: boolean;
  last_seen: string;
  status: "pending" | "active" | "suspended";
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  const loadProfile = useCallback(async (u: User) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();

    if (!data) {
      const meta = (u.user_metadata ?? {}) as Record<string, string | undefined>;
      const { data: created } = await supabase
        .from("profiles")
        .insert({
          id: u.id,
          email: u.email ?? null,
          full_name: meta['full_name'] ?? (u.email ? u.email.split("@")[0]! : "New student"),
          username: meta['username'] ?? null,
          class_name: meta['class_name'] ?? null,
        })
        .select("*")
        .maybeSingle();
      setProfile((created as Profile | null) ?? null);
    } else {
      setProfile(data as Profile);
    }

    const { data: adminFlag } = await supabase.rpc("has_role", {
      _user_id: u.id,
      _role: "admin",
    });
    setIsAdmin(Boolean(adminFlag));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadProfile(user);
  }, [user, loadProfile]);

  // Presence: mark online while the tab is alive, offline when it closes.
  useEffect(() => {
    if (!user) return;
    const id = user.id;
    const mark = (online: boolean) =>
      supabase.from("profiles").update({ is_online: online, last_seen: new Date().toISOString() }).eq("id", id);

    void mark(true);
    const beat = setInterval(() => void mark(true), 45_000);
    const onHide = () => {
      if (document.visibilityState === "hidden") void mark(false);
      else void mark(true);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", () => void mark(false));

    return () => {
      clearInterval(beat);
      document.removeEventListener("visibilitychange", onHide);
      void mark(false);
    };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  const signOut = useCallback(async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("id", user.id);
    }
    await supabase.auth.signOut();
  }, [user]);

  const value = useMemo(
    () => ({ session, user, profile, isAdmin, loading, refreshProfile, signOut }),
    [session, user, profile, isAdmin, loading, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
