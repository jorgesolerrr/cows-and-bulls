import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const { initialize, loading, session, user, profile } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return { loading, session, user, profile, isAuthenticated: !!session };
}
