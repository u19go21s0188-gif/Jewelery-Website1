import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck, Package, FolderOpen, Home, ShoppingCart, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-2xl">Admin access required</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Your account ({user.email}) does not have admin privileges. The site owner
          can grant you the <code className="rounded bg-muted px-1 py-0.5">admin</code> role
          in the user_roles table.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm text-primary-foreground"
        >
          <Home className="h-4 w-4" /> Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex overflow-y-auto">
        <div className="border-b px-6 py-5 flex-shrink-0">
          <Link to="/" className="font-serif text-xl">
            Maison <span className="text-accent">Émeraude</span>
          </Link>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            Admin Console
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <NavItem to="/admin/dashboard" icon={<BarChart3 className="h-4 w-4" />}>
            Dashboard
          </NavItem>
          <NavItem to="/admin/orders" icon={<ShoppingCart className="h-4 w-4" />}>
            Orders
          </NavItem>
          <NavItem to="/admin/products" icon={<Package className="h-4 w-4" />}>
            Products
          </NavItem>
          <NavItem to="/admin/categories" icon={<FolderOpen className="h-4 w-4" />}>
            Categories
          </NavItem>
        </nav>
        <div className="border-t p-3 flex-shrink-0">
          <p className="px-3 py-1 text-xs text-muted-foreground">{user.email}</p>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="mt-1 w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b bg-card px-6 py-4 md:hidden flex-shrink-0">
          <Link to="/" className="font-serif text-lg">Maison Émeraude</Link>
          <Link to="/" className="text-sm text-muted-foreground">Store</Link>
        </header>
        <div className="md:hidden border-b bg-card px-3 py-2 flex gap-1 overflow-x-auto flex-shrink-0">
          <NavItem to="/admin/dashboard" icon={<BarChart3 className="h-4 w-4" />}>Dashboard</NavItem>
          <NavItem to="/admin/orders" icon={<ShoppingCart className="h-4 w-4" />}>Orders</NavItem>
          <NavItem to="/admin/products" icon={<Package className="h-4 w-4" />}>Products</NavItem>
          <NavItem to="/admin/categories" icon={<FolderOpen className="h-4 w-4" />}>Categories</NavItem>
        </div>
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  children,
  icon,
  exact,
}: {
  to: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: "bg-primary text-primary-foreground" }}
      className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition hover:bg-muted"
    >
      {icon}
      {children}
    </Link>
  );
}
