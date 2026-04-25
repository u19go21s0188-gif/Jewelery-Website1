import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, X, Upload, Star } from "lucide-react";

export const Route = createFileRoute("/admin/products")({
  component: ProductsAdmin,
});

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  status: string;
  is_visible: boolean;
  in_stock: boolean;
};
type ProductImage = { id: string; product_id: string; image_url: string; sort_order: number };

function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [editingImages, setEditingImages] = useState<ProductImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name").order("sort_order"),
    ]);
    setProducts(p ?? []);
    setCategories(c ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openEditor = async (p: Partial<Product> | null) => {
    setEditing(p);
    setPendingFiles([]);
    setEditingImages([]);
    if (p?.id) {
      const { data } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", p.id)
        .order("sort_order");
      setEditingImages(data ?? []);
    }
  };

  const closeEditor = () => {
    setEditing(null);
    setPendingFiles([]);
    setEditingImages([]);
  };

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      toast.error(`"${tooBig.name}" is over 5MB`);
      return;
    }
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = async (img: ProductImage) => {
    if (!confirm("Remove this image?")) return;
    const { error } = await supabase.from("product_images").delete().eq("id", img.id);
    if (error) return toast.error(error.message);
    // best-effort delete the file too (path is after the bucket prefix)
    const marker = "/product-images/";
    const idx = img.image_url.indexOf(marker);
    if (idx >= 0) {
      const path = img.image_url.slice(idx + marker.length);
      await supabase.storage.from("product-images").remove([path]);
    }
    setEditingImages((prev) => prev.filter((i) => i.id !== img.id));
    toast.success("Image removed");
  };

  const setAsCover = async (url: string) => {
    if (!editing?.id) return;
    const { error } = await supabase
      .from("products")
      .update({ image_url: url })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    setEditing({ ...editing, image_url: url });
    toast.success("Cover image updated");
    load();
  };

  const uploadFiles = async (productId: string, files: File[]) => {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${productId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(pub.publicUrl);
    }
    return urls;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setUploading(true);
    try {
      const payload = {
        name: editing.name ?? "",
        description: editing.description ?? null,
        price: Number(editing.price ?? 0),
        image_url: editing.image_url ?? null,
        category_id: editing.category_id ?? null,
        status: editing.status ?? "active",
        is_visible: editing.is_visible ?? true,
        in_stock: editing.in_stock ?? true,
      };

      let productId = editing.id;
      if (productId) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      // Upload pending files
      if (pendingFiles.length > 0 && productId) {
        const urls = await uploadFiles(productId, pendingFiles);
        const baseOrder = editingImages.length;
        const rows = urls.map((url, i) => ({
          product_id: productId!,
          image_url: url,
          sort_order: baseOrder + i,
        }));
        const { error: insErr } = await supabase.from("product_images").insert(rows);
        if (insErr) throw insErr;

        // If product has no cover yet, set the first uploaded one
        if (!payload.image_url && urls[0]) {
          await supabase.from("products").update({ image_url: urls[0] }).eq("id", productId);
        }
      }

      toast.success(editing.id ? "Product updated" : "Product added");
      closeEditor();
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleVisible = async (p: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_visible: !p.is_visible })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your jewelry catalog.</p>
        </div>
        <button
          onClick={() =>
            openEditor({ name: "", price: 0, status: "active", is_visible: true, in_stock: true })
          }
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-sm border bg-card">
              <div className="aspect-square overflow-hidden bg-muted">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-lg">{p.name}</h3>
                  <span className="font-serif text-primary">₹{Number(p.price).toFixed(2)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.is_visible ? "Visible" : "Hidden"} · {p.status}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openEditor(p)}
                    className="rounded-sm border px-3 py-1 text-xs hover:bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleVisible(p)}
                    className="inline-flex items-center gap-1 rounded-sm border px-3 py-1 text-xs hover:bg-muted"
                  >
                    {p.is_visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {p.is_visible ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="inline-flex items-center gap-1 rounded-sm border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full rounded-sm border border-dashed p-12 text-center text-muted-foreground">
              No products yet. Click "New product" to add one.
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeEditor}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-sm bg-card p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{editing.id ? "Edit product" : "New product"}</h2>
              <button type="button" onClick={closeEditor}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Name">
                <input
                  required
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full rounded-sm border bg-background px-3 py-2"
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={3}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-sm border bg-background px-3 py-2"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (INR)">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editing.price ?? 0}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                    className="w-full rounded-sm border bg-background px-3 py-2"
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={editing.category_id ?? ""}
                    onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                    className="w-full rounded-sm border bg-background px-3 py-2"
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Images section */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
                  Product images
                </label>

                {(editingImages.length > 0 || pendingFiles.length > 0) && (
                  <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {editingImages.map((img) => {
                      const isCover = editing.image_url === img.image_url;
                      return (
                        <div key={img.id} className="group relative aspect-square overflow-hidden rounded-sm border">
                          <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                          {isCover && (
                            <span className="absolute left-1 top-1 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                              Cover
                            </span>
                          )}
                          <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1 opacity-0 transition group-hover:opacity-100">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => setAsCover(img.image_url)}
                                title="Set as cover"
                                className="rounded-sm p-1 text-white hover:bg-white/20"
                              >
                                <Star className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeExistingImage(img)}
                              title="Remove"
                              className="ml-auto rounded-sm p-1 text-white hover:bg-white/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {pendingFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square overflow-hidden rounded-sm border border-dashed">
                        <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover opacity-80" />
                        <span className="absolute left-1 top-1 rounded-sm bg-muted px-1.5 py-0.5 text-[10px]">
                          New
                        </span>
                        <button
                          type="button"
                          onClick={() => removePendingFile(idx)}
                          className="absolute right-1 top-1 rounded-sm bg-black/60 p-1 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed bg-background px-3 py-4 text-sm text-muted-foreground hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  Upload images (you can pick multiple)
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onPickFiles}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Or paste an image URL below. Max 5MB per file.
                </p>
              </div>

              <Field label="Cover image URL (optional)">
                <input
                  type="url"
                  value={editing.image_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-sm border bg-background px-3 py-2"
                />
              </Field>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_visible ?? true}
                    onChange={(e) => setEditing({ ...editing, is_visible: e.target.checked })}
                  />
                  Visible to shoppers
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.in_stock ?? true}
                    onChange={(e) => setEditing({ ...editing, in_stock: e.target.checked })}
                  />
                  In stock
                </label>
              </div>
              <Field label="Status">
                <select
                  value={editing.status ?? "active"}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  className="w-full rounded-sm border bg-background px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-sm border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {uploading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
