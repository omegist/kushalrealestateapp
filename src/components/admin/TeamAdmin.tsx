import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, User } from "lucide-react";
import { contentWrite } from "@/lib/contentAdmin";
import { useAdminTeam } from "@/lib/adminData";
import { Modal, AdminField, adminInput, btnGold, btnGhost } from "./ui";
import { FileUpload } from "./FileUpload";
import { toast } from "sonner";
import type { TeamMember } from "@/lib/types";

const empty: Record<string, any> = {
  name: "", designation: "", experience: "", phone: "", whatsapp: "", email: "",
  photo_url: "", is_founder: false, sort_order: 0,
};

export function TeamAdmin() {
  const { data: team = [], isLoading } = useAdminTeam();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "team"] });
    qc.invalidateQueries({ queryKey: ["team"] });
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const openNew = () => { setEditing(null); setForm({ ...empty, sort_order: team.length }); setOpen(true); };
  const openEdit = (m: TeamMember) => { setEditing(m); setForm({ ...empty, ...m }); setOpen(true); };

  const save = async () => {
    if (!form.name?.trim()) return toast.error("Name is required");
    setSaving(true);
    const payload: any = {
      name: form.name.trim(), designation: form.designation || null, experience: form.experience || null,
      phone: form.phone || null, whatsapp: form.whatsapp || form.phone || null, email: form.email || null,
      photo_url: form.photo_url || null, is_founder: !!form.is_founder, sort_order: Number(form.sort_order) || 0,
    };
    try {
      await contentWrite("team_members", editing ? "update" : "insert", { values: payload, id: editing?.id });
      setOpen(false);
      toast.success(editing ? "Member updated" : "Member added");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m: TeamMember) => {
    if (!confirm(`Remove ${m.name}?`)) return;
    try {
      await contentWrite("team_members", "delete", { id: m.id });
      toast.success("Member removed");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-700 text-foreground">Team Members</h2>
          <p className="text-sm text-muted-foreground">{team.length} members</p>
        </div>
        <button onClick={openNew} className={btnGold}><Plus className="h-4 w-4" /> Add Member</button>
      </div>

      {isLoading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-card" />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-gold">
                {m.photo_url ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" /> : <User className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-700 text-foreground">{m.name} {m.is_founder && <span className="text-[10px] text-gold">★</span>}</p>
                <p className="truncate text-xs text-emerald">{m.designation}</p>
                <p className="truncate text-[11px] text-muted-foreground">{m.phone}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => openEdit(m)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(m)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Member" : "Add Member"}>
        <div className="space-y-3">
          <AdminField label="Name *"><input className={adminInput} value={form.name} onChange={set("name")} /></AdminField>
          <AdminField label="Designation"><input className={adminInput} value={form.designation} onChange={set("designation")} placeholder="Senior Executive" /></AdminField>
          <AdminField label="Experience"><input className={adminInput} value={form.experience} onChange={set("experience")} placeholder="5+ years" /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Phone"><input className={adminInput} value={form.phone} onChange={set("phone")} /></AdminField>
            <AdminField label="WhatsApp"><input className={adminInput} value={form.whatsapp} onChange={set("whatsapp")} /></AdminField>
          </div>
          <AdminField label="Email"><input className={adminInput} value={form.email} onChange={set("email")} /></AdminField>
          <AdminField label="Photo">
            <FileUpload folder="team" kind="image" value={form.photo_url} onChange={(url) => setForm((f) => ({ ...f, photo_url: url }))} />
          </AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Sort Order"><input type="number" className={adminInput} value={form.sort_order} onChange={set("sort_order")} /></AdminField>
            <label className="flex items-end gap-2 pb-2 text-sm text-foreground"><input type="checkbox" checked={form.is_founder} onChange={set("is_founder")} /> Founder</label>
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
