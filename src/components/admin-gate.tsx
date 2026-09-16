import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

export function AdminGate({ children }: { children: ReactNode }) {
  const { loading, user, isAdmin } = useAuth();
  if (loading) return <div className="p-8 font-mono text-sm text-muted-foreground">loading…</div>;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin)
    return (
      <div className="max-w-md mx-auto pt-24 px-6">
        <p className="font-mono text-sm">you're signed in but not an admin.</p>
      </div>
    );
  return <>{children}</>;
}
