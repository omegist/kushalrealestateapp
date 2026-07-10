import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminProperties, useAdminCategories } from "@/lib/adminData";
import { formatPrice } from "@/lib/brand";
import { Modal, AdminField, adminInput, btnGold, btnGhost } from "./ui";
import { FileUpload } from "./FileUpload";
import { toast } from "sonner";
import type { Property } from "@/lib/types";

type FormState = Record<string, any>;

const empty: FormState = {
  title: "",
  description: "",
  category_slug: "residential",
  property_type: "",
  location: "",
  city: "Thane",
  price_label: "",
  price_value: "",
  negotiable: true,
  bedrooms: "",
  bathrooms: "",
  builtup_area: "",
  carpet_area: "",
  floor_info: "",
  construction_age: "",
  amenities: "",
  features: "",
  contact_name: "Anil",
  contact_phone: "9029847968",
  contact_phone_alt: "9326313320",
  map_lat: "",
  map_lng: "",
  cover_image: "",
  video_url: "",
  featured: false,
  status: "available",
  images: [] as string[],
};

export function PropertiesAdmin() {
  const { data: properties = [], isLoading } = useAdminProperties();
  const { data: categories = [] } = useAdminCategories();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["properties"] });
    qc.invalidateQueries({ queryKey: ["property"] });
  };

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = async (p: Property) => {
    setEditing(p);
    const { data: imgs } = await supabase.from("property_images").select("image_url").eq("property_id", p.id).order("sort_order");
    setForm({
      ...empty,
      ...p,
      price_value: p.price_value ?? "",
      bathrooms: p.bathrooms ?? "",
      map_lat: p.map_lat ?? "",
      map_lng: p.map_lng ?? "",
      amenities: (p.amenities ?? []).join(", "),
      features: (p.features ?? []).join(", "),
      video_url: p.video_url ?? "",
      images: (imgs ?? []).map((i) => i.image_url),
    });
    setOpen(true);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const save = async () => {
    if (!form.title?.trim() || !form.location?.trim()) {
      toast.error("Title and location are required");
      return;
    }
    setSaving(true);
    // Compute this first: if no cover image was explicitly chosen, fall back
    // to the first gallery image. Previously cover_image was left null
    // whenever an admin only used "Gallery Images" and skipped "Cover Image"
    // — since property cards only ever render cover_image, those listings
    // showed up with a blank photo everywhere except the detail page.
    const imageUrls: string[] = (Array.isArray(form.images) ? form.images : []).filter(Boolean);
    const coverImage = form.cover_image || imageUrls[0] || null;

    const payload: any = {
      title: form.title.trim(),
      description: form.description || null,
      category_slug: form.category_slug,
      property_type: form.property_type || null,
      location: form.location.trim(),
      city: form.city || null,
      price_label: form.price_label || null,
      price_value: form.price_value === "" ? null : Number(form.price_value),
      negotiable: !!form.negotiable,
      bedrooms: form.bedrooms || null,
      bathrooms: form.bathrooms === "" ? null : Number(form.bathrooms),
      builtup_area: form.builtup_area || null,
      carpet_area: form.carpet_area || null,
      floor_info: form.floor_info || null,
      construction_age: form.construction_age || null,
      amenities: String(form.amenities || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      features: String(form.features || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      contact_name: form.contact_name || null,
      contact_phone: form.contact_phone || null,
      contact_phone_alt: form.contact_phone_alt || null,
      map_lat: form.map_lat === "" ? null : Number(form.map_lat),
      map_lng: form.map_lng === "" ? null : Number(form.map_lng),
      cover_image: coverImage,
      video_url: form.video_url?.trim() || null,
      featured: !!form.featured,
      status: form.status,
    };

    let propertyId = editing?.id;
    if (editing) {
      const { error } = await supabase.from("properties").update(payload).eq("id", editing.id);
      if (error) { setSaving(false); toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from("properties").insert(payload).select("id").single();
      if (error) { setSaving(false); toast.error(error.message); return; }
      propertyId = data.id;
    }

    // sync images
    if (propertyId) {
      await supabase.from("property_images").delete().eq("property_id", propertyId);
      if (imageUrls.length) {
        await supabase.from("property_images").insert(
          imageUrls.map((url, i) => ({ property_id: propertyId, image_url: url, sort_order: i })),
        );
      }
    }

    setSaving(false);
    setOpen(false);
    toast.success(editing ? "Property updated" : "Property added");
    refresh();
  };

  const remove = async (p: Property) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("properties").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Property deleted");
    refresh();
  };

  const toggleFeatured = async (p: Property) => {
    await supabase.from("properties").update({ featured: !p.featured }).eq("id", p.id);
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-700 text-foreground">Properties</h2>
          <p className="text-sm text-muted-foreground">{properties.length} listings</p>
        </div>
        <button onClick={openNew} className={btnGold}><Plus className="h-4 w-4" /> Add Property</button>
      </div>

      {isLoading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-card" />
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Category</th>
                <th className="hidden px-4 py-3 md:table-cell">Price</th>
                <th className="hidden px-4 py-3 sm:table-cell">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        {p.cover_image && <img src={p.cover_image} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-600 text-foreground">{p.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{p.category_slug}</td>
                  <td className="hidden px-4 py-3 text-foreground md:table-cell">{formatPrice(p)}</td>
                  <td className="hidden px-4 py-3 sm:table-cell"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-foreground">{p.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => toggleFeatured(p)} title="Toggle featured" className={`flex h-8 w-8 items-center justify-center rounded-lg border border-border ${p.featured ? "text-gold" : "text-muted-foreground"}`}>
                        <Star className="h-4 w-4" fill={p.featured ? "currentColor" : "none"} />
                      </button>
                      <button onClick={() => openEdit(p)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(p)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Property" : "Add Property"} wide>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><AdminField label="Title *"><input className={adminInput} value={form.title} onChange={set("title")} /></AdminField></div>
          <div className="sm:col-span-2"><AdminField label="Description"><textarea rows={3} className={adminInput} value={form.description} onChange={set("description")} /></AdminField></div>
          <AdminField label="Category"><select className={adminInput} value={form.category_slug} onChange={set("category_slug")}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></AdminField>
          <AdminField label="Property Type"><input className={adminInput} value={form.property_type} onChange={set("property_type")} placeholder="2 BHK Flat" /></AdminField>
          <AdminField label="Location *"><input className={adminInput} value={form.location} onChange={set("location")} /></AdminField>
          <AdminField label="City"><input className={adminInput} value={form.city} onChange={set("city")} /></AdminField>
          <AdminField label="Price Label"><input className={adminInput} value={form.price_label} onChange={set("price_label")} placeholder="₹1.45 Cr" /></AdminField>
          <AdminField label="Price Value (₹)"><input type="number" className={adminInput} value={form.price_value} onChange={set("price_value")} placeholder="14500000" /></AdminField>
          <AdminField label="Bedrooms"><input className={adminInput} value={form.bedrooms} onChange={set("bedrooms")} placeholder="2 BHK" /></AdminField>
          <AdminField label="Bathrooms"><input type="number" className={adminInput} value={form.bathrooms} onChange={set("bathrooms")} /></AdminField>
          <AdminField label="Built-up Area"><input className={adminInput} value={form.builtup_area} onChange={set("builtup_area")} placeholder="1000 sqft" /></AdminField>
          <AdminField label="Carpet Area"><input className={adminInput} value={form.carpet_area} onChange={set("carpet_area")} placeholder="652 sqft" /></AdminField>
          <AdminField label="Floor"><input className={adminInput} value={form.floor_info} onChange={set("floor_info")} placeholder="22 / 30" /></AdminField>
          <AdminField label="Construction Age"><input className={adminInput} value={form.construction_age} onChange={set("construction_age")} placeholder="3 years" /></AdminField>
          <div className="sm:col-span-2"><AdminField label="Amenities (comma separated)"><textarea rows={2} className={adminInput} value={form.amenities} onChange={set("amenities")} placeholder="Security, Lift Backup, Gym, Swimming Pool" /></AdminField></div>
          <div className="sm:col-span-2"><AdminField label="Features (comma separated)"><textarea rows={2} className={adminInput} value={form.features} onChange={set("features")} placeholder="Prime Location, Clear Title" /></AdminField></div>
          <AdminField label="Contact Name"><input className={adminInput} value={form.contact_name} onChange={set("contact_name")} /></AdminField>
          <AdminField label="Contact Phone"><input className={adminInput} value={form.contact_phone} onChange={set("contact_phone")} /></AdminField>
          <AdminField label="Alt Phone"><input className={adminInput} value={form.contact_phone_alt} onChange={set("contact_phone_alt")} /></AdminField>
          <AdminField label="Status"><select className={adminInput} value={form.status} onChange={set("status")}><option value="available">Available</option><option value="sold">Sold</option><option value="hold">On Hold</option></select></AdminField>
          <AdminField label="Map Latitude"><input className={adminInput} value={form.map_lat} onChange={set("map_lat")} placeholder="19.21" /></AdminField>
          <AdminField label="Map Longitude"><input className={adminInput} value={form.map_lng} onChange={set("map_lng")} placeholder="72.97" /></AdminField>
          <div className="sm:col-span-2"><AdminField label="Cover Image">
            <FileUpload folder="properties" kind="image" value={form.cover_image} onChange={(url) => setForm((f) => ({ ...f, cover_image: url }))} />
          </AdminField></div>
          <div className="sm:col-span-2"><AdminField label="Gallery Images">
            <FileUpload multiple folder="properties" kind="image" value={form.images} onChange={(urls) => setForm((f) => ({ ...f, images: urls }))} />
          </AdminField></div>
          <div className="sm:col-span-2"><AdminField label="Property Video (optional)">
            <VideoField value={form.video_url} onChange={(v) => setForm((f) => ({ ...f, video_url: v }))} />
          </AdminField></div>
          <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.negotiable} onChange={set("negotiable")} /> Negotiable</label>
          <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.featured} onChange={set("featured")} /> Featured on homepage</label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className={btnGhost}>Cancel</button>
          <button onClick={save} disabled={saving} className={btnGold}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
        </div>
      </Modal>
    </div>
  );
}

/** Property video: paste a YouTube/Vimeo link OR upload a video file to R2. */
function VideoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const looksUploaded = !!value && !/(youtube\.com|youtu\.be|vimeo\.com)/i.test(value);
  const [mode, setMode] = useState<"link" | "upload">(looksUploaded ? "upload" : "link");

  const tab = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-600 transition ${active ? "bg-gradient-gold text-primary-foreground shadow-gold" : "border border-border bg-card text-muted-foreground"}`;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("link")} className={tab(mode === "link")}>Paste YouTube link</button>
        <button type="button" onClick={() => setMode("upload")} className={tab(mode === "upload")}>Upload video file</button>
      </div>
      {mode === "link" ? (
        <input
          className={adminInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      ) : (
        <FileUpload folder="videos" kind="video" value={value} onChange={onChange} />
      )}
      {value && (
        <button type="button" onClick={() => onChange("")} className="text-xs font-600 text-destructive">
          Clear video
        </button>
      )}
    </div>
  );
}