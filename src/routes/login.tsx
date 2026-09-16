import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { signIn, user, isAdmin } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && isAdmin) nav({ to: "/admin" });
  }, [user, isAdmin, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, pw);
    setBusy(false);
    if (error) toast.error(error);
    else toast.success("welcome back");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-sm mx-auto w-full px-6 pt-24">
        <p className="font-mono text-xs text-muted-foreground mb-4">// admin</p>
        <h1 className="font-serif text-4xl tracking-tight mb-8">Sign in.</h1>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-1">email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b hairline outline-none py-1.5 text-sm focus:border-foreground transition-colors"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-1">password</label>
            <input
              type="password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full bg-transparent border-b hairline outline-none py-1.5 text-sm focus:border-foreground transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full font-mono text-xs uppercase tracking-wider py-2.5 border border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
          >
            {busy ? "signing in…" : "sign in"}
          </button>
        </form>
        <p className="font-mono text-[10px] text-muted-foreground mt-6 leading-relaxed">
          only sambhav can login,
          <br />
          <code className="text-foreground">until you know how to inject sql</code>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
