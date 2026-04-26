import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="storefront flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl gold-text">404</h1>
        <h2 className="mt-4 font-serif text-2xl text-ivory">Page not found</h2>
        <p className="mt-2 text-sm text-ivory/60">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-sm border border-gold bg-gold px-6 py-3 text-sm font-medium tracking-wide uppercase text-charcoal transition-colors hover:bg-gold-soft"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Maison Émeraude — Fine Jewelry & Accessories" },
      {
        name: "description",
        content:
          "A curated atelier of fine jewelry. Order any piece directly via WhatsApp.",
      },
      { name: "author", content: "Maison Émeraude" },
      { property: "og:title", content: "Maison Émeraude — Fine Jewelry" },
      { property: "og:description", content: "Curated fine jewelry, ordered directly on WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  try {
    return (
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    );
  } catch (err) {
    console.error("Root component error:", err);
    return (
      <div className="storefront flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl gold-text">Welcome</h1>
          <p className="mt-4 text-ivory/80">The site is loading. Please refresh if it doesn't load in a moment.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center justify-center rounded-sm bg-gold px-6 py-3 text-sm font-medium text-charcoal hover:bg-gold-soft"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}
