import { OrderForm } from "@/components/order-form";
import { MessageCircle } from "lucide-react";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  in_stock: boolean;
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-sm bg-ivory/5">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="product-card-img h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ivory/30">
            No image
          </div>
        )}
        {!product.in_stock && (
          <span className="absolute left-3 top-3 rounded-sm bg-charcoal/80 px-2 py-1 text-[10px] uppercase tracking-widest text-ivory">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <h3 className="font-serif text-lg text-ivory">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-ivory/60">{product.description}</p>
        )}
        <div className="mt-3 flex items-baseline justify-between">
          <span className="gold-text font-serif text-xl">
            ₹{product.price.toFixed(2)}
          </span>
        </div>

        <OrderForm product={{ id: product.id, name: product.name, price: product.price }}>
          <button className="mt-4 inline-flex items-center justify-center gap-2 rounded-sm bg-gold px-5 py-3 text-xs font-medium uppercase tracking-widest text-charcoal transition-colors hover:bg-gold-soft">
            <MessageCircle className="h-4 w-4" />
            Order on WhatsApp
          </button>
        </OrderForm>
      </div>
    </article>
  );
}
