import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Menu, X, ShieldCheck, LogIn, LogOut } from "lucide-react";

type Category = { id: string; name: string; slug: string };

export function StorefrontLayout({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("categories")
      .select("id,name,slug")
      .eq("is_visible", true)
      .order("sort_order")
      .then(({ data }) => setCategories(data ?? []));

    const channel = supabase
      .channel("categories-nav")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          supabase
            .from("categories")
            .select("id,name,slug")
            .eq("is_visible", true)
            .order("sort_order")
            .then(({ data }) => setCategories(data ?? []));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="storefront">
      <header className="sticky top-0 z-30 border-b border-ivory/10 bg-emerald-deep/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8 md:py-5">
          <Link to="/" className="font-serif text-xl tracking-wide md:text-2xl">
            <span className="text-ivory">Maison </span>
            <span className="gold-text">Émeraude</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              to="/"
              className="text-sm tracking-wider uppercase text-ivory/80 transition hover:text-gold"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: true }}
            >
              Home
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="text-sm tracking-wider uppercase text-ivory/80 transition hover:text-gold"
                activeProps={{ className: "text-gold" }}
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-sm border border-gold/60 px-3 py-2 text-xs uppercase tracking-wider text-gold transition hover:bg-gold hover:text-charcoal"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
            {user ? (
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-ivory/70 hover:text-gold"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-ivory/70 hover:text-gold"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            )}
          </div>

          <button
            className="md:hidden text-ivory"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-ivory/10 md:hidden">
            <nav className="flex flex-col px-6 py-4">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="py-2 text-sm uppercase tracking-wider text-ivory/80"
              >
                Home
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm uppercase tracking-wider text-ivory/80"
                >
                  {c.name}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-ivory/10 pt-3">
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="py-2 text-sm uppercase tracking-wider text-gold"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {user ? (
                  <button
                    onClick={async () => {
                      await signOut();
                      setOpen(false);
                    }}
                    className="py-2 text-left text-sm uppercase tracking-wider text-ivory/70"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="py-2 text-sm uppercase tracking-wider text-ivory/70"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-ivory/10 mt-24">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="font-serif text-2xl">
              <span className="text-ivory">Maison </span>
              <span className="gold-text">Émeraude</span>
            </div>
            <div className="hairline w-32" />
            <p className="max-w-md text-sm text-ivory/60">
              Each piece is hand-finished in our atelier. Order directly through WhatsApp
              — our concierge will respond personally.
            </p>
            <p className="text-xs uppercase tracking-widest text-ivory/40">
              © {new Date().getFullYear()} Maison Émeraude
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
