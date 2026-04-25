import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesAdmin,
});

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_visible: boolean;
  sort_order: number;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function CategoriesAdmin() {
  const [items, setItems] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const name = (editing.name ?? "").trim();
    if (!name) return toast.error("Name is required");
    const payload = {
      name,
      slug: editing.slug?.trim() || slugify(name),
      description: editing.description ?? null,
      is_visible: editing.is_visible ?? true,
      sort_order: Number(editing.sort_order ?? 0),
    };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Category updated" : "Category added");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category? Products will become uncategorized.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Categories</h1>
          <p className="text-sm text-muted-foreground">
            New categories appear in the storefront navigation automatically.
          </p>
        </div>
        <button
          onClick={() => setEditing({ name: "", is_visible: true, sort_order: items.length })}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>

      <div className="overflow-hidden rounded-sm border bg-card">
        <table className="w-full">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Visible</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-sm">{c.sort_order}</td>
                <td className="px-4 py-3 text-sm">{c.is_visible ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(c)} className="rounded-sm border px-3 py-1 text-xs hover:bg-muted">
                    Edit
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="ml-2 inline-flex items-center gap-1 rounded-sm border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No categories yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
            className="w-full max-w-md rounded-sm bg-card p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{editing.id ? "Edit category" : "New category"}</h2>
              <button type="button" onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Name</label>
                <input
                  required
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full rounded-sm border bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Slug (optional)</label>
                <input
                  value={editing.slug ?? ""}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="auto from name"
                  className="w-full rounded-sm border bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Description</label>
                <textarea
                  rows={2}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-sm border bg-background px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Sort order</label>
                  <input
                    type="number"
                    value={editing.sort_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                    className="w-full rounded-sm border bg-background px-3 py-2"
                  />
                </div>
                <label className="mt-6 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_visible ?? true}
                    onChange={(e) => setEditing({ ...editing, is_visible: e.target.checked })}
                  />
                  Visible
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-sm border px-4 py-2 text-sm">
                Cancel
              </button>
              <button type="submit" className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
