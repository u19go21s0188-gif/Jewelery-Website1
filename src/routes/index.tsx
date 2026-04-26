


import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront-layout";
import { ProductCard, type Product } from "@/components/product-card";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const { data, error: err } = await supabase
          .from("products")
          .select("id,name,description,price,image_url,in_stock")
          .eq("is_visible", true)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(8);
        
        if (err) {
          console.error("Supabase error:", err);
          setError(err.message);
          setProducts([]);
        } else {
          setProducts(data ?? []);
        }
        setLoading(false);
      } catch (e) {
        console.error("Load error:", e);
        setError(e instanceof Error ? e.message : "Failed to load products");
        setLoading(false);
      }
    };
    
    load();
    
    try {
      const ch = supabase
        .channel("home-products")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          load,
        )
        .subscribe();
      return () => {
        supabase.removeChannel(ch);
      };
    } catch (e) {
      console.error("Channel subscribe error:", e);
    }
  }, []);  return (
    <StorefrontLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid items-center gap-12 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-8 md:py-24 max-w-7xl mx-auto">
          <div className="order-2 md:order-1">
            <p className="text-xs uppercase tracking-[0.4em] text-gold">
              Atelier Collection
            </p>
            <h1 className="mt-5 font-serif text-4xl leading-[1.05] text-ivory md:text-6xl">
              Heirloom jewelry,
              <br />
              <span className="gold-text">crafted to be cherished.</span>
            </h1>
            <p className="mt-6 max-w-md text-base text-ivory/70">
              A curated selection of fine pieces — emeralds, diamonds, and 18k gold.
              Place your order directly through WhatsApp and our concierge will
              respond personally.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#collection"
                className="inline-flex items-center justify-center rounded-sm bg-gold px-7 py-3 text-xs font-medium uppercase tracking-widest text-charcoal transition hover:bg-gold-soft"
              >
                Explore Collection
              </a>
              <a
                href="#collection"
                className="text-xs uppercase tracking-widest text-ivory/70 underline-offset-4 hover:text-gold hover:underline"
              >
                Shop by category
              </a>
            </div>
          </div>

          <div className="relative order-1 md:order-2">
            <div className="absolute -inset-6 rounded-sm bg-gold/10 blur-2xl" />
            <img
              src={heroImg}
              alt="Emerald and gold pendant necklace"
              width={1600}
              height={1200}
              className="relative aspect-[4/3] w-full rounded-sm object-cover shadow-[var(--shadow-luxe)]"
            />
          </div>
        </div>
      </section>

      <div className="hairline mx-auto w-32" />

      {/* Featured collection */}
      <section id="collection" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gold">Featured</p>
          <h2 className="mt-3 font-serif text-3xl text-ivory md:text-4xl">
            New arrivals
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-sm bg-ivory/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-sm border border-gold/20 bg-gold/5 p-6 text-center">
            <p className="text-sm text-ivory/80">
              We're updating our collection. Please check back in a moment.
            </p>
            {import.meta.env.DEV && (
              <p className="mt-2 text-xs text-ivory/50 font-mono">{error}</p>
            )}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-ivory/60">
            No products yet. The atelier is restocking — please check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
