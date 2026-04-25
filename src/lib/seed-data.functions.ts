import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Seed initial data (categories and sample products)
 * This is useful for local development and testing
 */
export const seedDatabase = createServerFn({ method: "POST" }).handler(async () => {
  try {
    // Seed categories
    const categories = [
      { name: "Necklaces", slug: "necklaces", description: "Elegant necklaces and pendants", sort_order: 1 },
      { name: "Earrings", slug: "earrings", description: "Exquisite earrings and studs", sort_order: 2 },
      { name: "Rings", slug: "rings", description: "Fine rings and statement pieces", sort_order: 3 },
      { name: "Bracelets", slug: "bracelets", description: "Beautiful bracelets and bangles", sort_order: 4 },
    ];

    const { data: catData, error: catErr } = await supabaseAdmin
      .from("categories")
      .upsert(categories, { onConflict: "slug" })
      .select("id,name");

    if (catErr) {
      return { success: false, error: `Categories error: ${catErr.message}` };
    }

    // Seed sample products
    const categoryMap = Object.fromEntries(catData?.map(c => [c.name, c.id]) || []);
    
    const products = [
      {
        name: "Emerald Pendant Necklace",
        description: "A stunning emerald pendant on a delicate gold chain",
        price: 2500,
        category_id: categoryMap["Necklaces"],
        image_url: null,
        status: "active",
        is_visible: true,
        in_stock: true,
      },
      {
        name: "Diamond Stud Earrings",
        description: "Classic diamond studs in 18k gold",
        price: 1800,
        category_id: categoryMap["Earrings"],
        image_url: null,
        status: "active",
        is_visible: true,
        in_stock: true,
      },
      {
        name: "Sapphire Ring",
        description: "Elegant sapphire ring with diamond accents",
        price: 3200,
        category_id: categoryMap["Rings"],
        image_url: null,
        status: "active",
        is_visible: true,
        in_stock: true,
      },
      {
        name: "Gold Bangle Bracelet",
        description: "Classic gold bangle with intricate detailing",
        price: 1200,
        category_id: categoryMap["Bracelets"],
        image_url: null,
        status: "active",
        is_visible: true,
        in_stock: true,
      },
    ];

    const { error: prodErr } = await supabaseAdmin
      .from("products")
      .insert(products);

    if (prodErr) {
      return { success: false, error: `Products error: ${prodErr.message}` };
    }

    return { success: true, message: "Database seeded successfully" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
});
