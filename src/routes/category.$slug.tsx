import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront-layout";
import { ProductCard, type Product } from "@/components/product-card";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [category, setCategory] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    (async () => {
      const { data: cat } = await supabase
        .from("categories")
        .select("id,name,description,is_visible")
        .eq("slug", slug)
        .maybeSingle();
      if (!cat || !cat.is_visible) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCategory(cat);
      const { data: prods } = await supabase
        .from("products")
        .select("id,name,description,price,image_url,in_stock")
        .eq("category_id", cat.id)
        .eq("is_visible", true)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setProducts(prods ?? []);
      setLoading(false);
    })();
  }, [slug]);

  if (notFound) {
    return (
      <StorefrontLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="font-serif text-3xl text-ivory">Category not found</h1>
          <Link to="/" className="mt-6 inline-block text-gold underline-offset-4 hover:underline">
            Return home
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gold">Collection</p>
          <h1 className="mt-3 font-serif text-4xl text-ivory md:text-5xl">
            {category?.name ?? "—"}
          </h1>
          {category?.description && (
            <p className="mx-auto mt-4 max-w-xl text-ivory/60">{category.description}</p>
          )}
          <div className="hairline mx-auto mt-8 w-32" />
        </div>

        {loading ? (
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-sm bg-ivory/5" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="mt-12 text-center text-ivory/60">No pieces in this collection yet.</p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
