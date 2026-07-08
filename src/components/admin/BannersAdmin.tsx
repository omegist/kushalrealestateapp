import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { contentWrite } from "@/lib/contentAdmin";
import { useAdminBanners } from "@/lib/adminData";
import { Modal, AdminField, adminInput, btnGold, btnGhost } from "./ui";
import { FileUpload } from "./FileUpload";
import { toast } from "sonner";
import type { Banner } from "@/lib/types";

const empty: Record<string, any> = {
  title: "", subtitle: "", image_url: "", cta_label: "", link_to: "", sort_order: 0, enabled: true,
};

export function BannersAdmin() {
  const { data: banners = [], isLoading } = useAdminBanners();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const openNew = () => { setEditing(null); setForm({ ...empty, sort_order: banners.length }); setOpen(true); };
  const openEdit = (b: Banner) => { setEditing(b); setForm({ ...empty, ...b }); setOpen(true); };

  const save = async () => {
    if (!form.image_url?.trim()) return toast.error("Please upload a banner image");
    setSaving(true);
    const payload: any = {
      title: form.title || null, subtitle: form.subtitle || null, image_url: form.image_url.trim(),
      cta_label: form.cta_label || null, link_to: form.link_to || null,
      sort_order: Number(form.sort_order) || 0, enabled: !!form.enabled,
    };
    try {
      await contentWrite("banners", editing ? "update" : "insert", { values: payload, id: editing?.id });
      setOpen(false);
      toast.success(editing ? "Banner updated" : "Banner added");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (b: Banner) => {
    try {
      await contentWrite("banners", "update", { values: { enabled: !b.enabled }, id: b.id });
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const remove = async (b: Banner) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await contentWrite("banners", "delete", { id: b.id });
      toast.success("Banner deleted");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-700 text-foreground">Banners</h2>
          <p className="text-sm text-muted-foreground">Homepage hero slider</p>
        </div>
        <button onClick={openNew} className={btnGold}><Plus className="h-4 w-4" /> Add Banner</button>
      </div>

      {isLoading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-card" />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {banners.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="relative h-32 bg-secondary">
                {b.image_url && <img src={b.image_url} alt={b.title ?? ""} className="h-full w-full object-cover" />}
                {!b.enabled && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-600 text-white">Disabled</div>}
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate font-700 text-foreground">{b.title || "Untitled"}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.subtitle}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => toggle(b)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground">{b.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                  <button onClick={() => openEdit(b)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(b)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Banner" : "Add Banner"}>
        <div className="space-y-3">
          <AdminField label="Banner Image *">
            <FileUpload folder="banners" kind="image" value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} />
          </AdminField>
          <AdminField label="Title"><input className={adminInput} value={form.title} onChange={set("title")} placeholder="Luxury 2 BHK Apartments in Thane" /></AdminField>
          <AdminField label="Subtitle"><input className={adminInput} value={form.subtitle} onChange={set("subtitle")} /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="CTA Label"><input className={adminInput} value={form.cta_label} onChange={set("cta_label")} placeholder="Explore" /></AdminField>
            <AdminField label="Link To"><input className={adminInput} value={form.link_to} onChange={set("link_to")} placeholder="/properties" /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Sort Order"><input type="number" className={adminInput} value={form.sort_order} onChange={set("sort_order")} /></AdminField>
            <label className="flex items-end gap-2 pb-2 text-sm text-foreground"><input type="checkbox" checked={form.enabled} onChange={set("enabled")} /> Enabled</label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className={btnGhost}>Cancel</button>
          <button onClick={save} disabled={saving} className={btnGold}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
        </div>
      </Modal>
    </div>
  );
}
