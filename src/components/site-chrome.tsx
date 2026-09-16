import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const { isAdmin, signOut } = useAuth();
  return (
    <header className="border-b hairline">
      <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <Link to="/" className="font-mono text-sm tracking-tight hover:opacity-70 transition-opacity">
          localhost<span className="text-muted-foreground">:8000</span>
        </Link>
        <hr className="hairline border-t sm:hidden" />
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }} className="hover:text-foreground transition-colors">
            writing
          </Link>
          <Link to="/about" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
            about
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">
                admin
              </Link>
              <button onClick={() => signOut()} className="hover:text-foreground transition-colors font-mono text-xs">
                [logout]
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t hairline mt-24">
      <div className="max-w-3xl mx-auto px-6 py-8 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>© {new Date().getFullYear()} sambhav saxena</span>
        <Link to="/login" className="hover:text-foreground transition-colors">
          ·
        </Link>
      </div>
    </footer>
  );
}
