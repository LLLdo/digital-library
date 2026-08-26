"use client";

import { useEffect, useState } from "react";
import { LogIn, Upload, Trash2, LogOut, Pencil, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Book } from "@/lib/types";

const CATEGORIES = [
  "การศึกษา",
  "เกษตร",
  "เทคโนโลยี",
  "วิทยาศาสตร์",
  "ธุรกิจและเศรษฐศาสตร์",
  "ศิลปะและวัฒนธรรม",
  "สุขภาพ",
  "อื่นๆ",
];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase.from("books").select("*").order("created_at", { ascending: false });
      setBooks((data as Book[]) || []);
    }
  };
  useEffect(() => { load(); }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message); else await load();
  }

  function startEdit(book: Book) {
    setEditingBook(book);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingBook(null);
    setMessage("");
  }

  async function saveBook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const pdf = form.get("pdf") as File;
    const cover = form.get("cover") as File;

    const fields = {
      title_th: form.get("title_th") as string,
      title_en: (form.get("title_en") as string) || null,
      author: (form.get("author") as string) || null,
      category: (form.get("category") as string) || null,
      description: (form.get("description") as string) || null,
      published_year: form.get("published_year") ? Number(form.get("published_year")) : null,
    };

    if (editingBook) {
      // --- โหมดแก้ไข ---
      setMessage("กำลังบันทึก...");
      let pdf_path = editingBook.pdf_path;
      let cover_path = editingBook.cover_path;

      if (pdf && pdf.size) {
        const safe = `${Date.now()}-${pdf.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const { error: pe } = await supabase.storage.from("pdfs").upload(safe, pdf);
        if (pe) return setMessage(pe.message);
        await supabase.storage.from("pdfs").remove([editingBook.pdf_path]);
        pdf_path = safe;
      }
      if (cover && cover.size) {
        const safe = `${Date.now()}-${cover.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const { error: ce } = await supabase.storage.from("covers").upload(safe, cover);
        if (ce) return setMessage(ce.message);
        if (editingBook.cover_path) await supabase.storage.from("covers").remove([editingBook.cover_path]);
        cover_path = safe;
      }

      const { error } = await supabase.from("books").update({ ...fields, pdf_path, cover_path }).eq("id", editingBook.id);
      if (error) setMessage(error.message);
      else {
        setMessage("บันทึกการแก้ไขสำเร็จ");
        setEditingBook(null);
        e.currentTarget.reset();
        await load();
      }
    } else {
      // --- โหมดเพิ่มใหม่ ---
      setMessage("กำลังอัปโหลด...");
      if (!pdf || pdf.type !== "application/pdf") return setMessage("กรุณาเลือกไฟล์ PDF");
      const safe = `${Date.now()}-${pdf.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error: pe } = await supabase.storage.from("pdfs").upload(safe, pdf);
      if (pe) return setMessage(pe.message);
      let coverPath: string | null = null;
      if (cover && cover.size) {
        coverPath = `${Date.now()}-${cover.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const { error: ce } = await supabase.storage.from("covers").upload(coverPath, cover);
        if (ce) return setMessage(ce.message);
      }
      const { error } = await supabase.from("books").insert({ ...fields, pdf_path: safe, cover_path: coverPath });
      if (error) setMessage(error.message);
      else {
        setMessage("เพิ่มหนังสือสำเร็จ");
        e.currentTarget.reset();
        await load();
      }
    }
  }

  async function removeBook(book: Book) {
    if (!confirm(`ลบ "${book.title_th}" ?`)) return;
    await supabase.from("books").delete().eq("id", book.id);
    await supabase.storage.from("pdfs").remove([book.pdf_path]);
    if (book.cover_path) await supabase.storage.from("covers").remove([book.cover_path]);
    if (editingBook?.id === book.id) setEditingBook(null);
    await load();
  }

  if (!user) return <main className="mx-auto max-w-md px-5 py-20">
    <div className="rounded-3xl bg-white p-7 shadow-soft">
      <h1 className="text-2xl font-bold">Admin Login</h1><p className="mt-2 text-sm text-black/50">สำหรับผู้ดูแลระบบเท่านั้น</p>
      <form onSubmit={login} className="mt-7 space-y-4">
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="อีเมล" className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-forest"/>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="รหัสผ่าน" className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-forest"/>
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest px-4 py-3 font-semibold text-white"><LogIn size={18}/> เข้าสู่ระบบ</button>
      </form>
      {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
    </div>
  </main>;

  return <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
    <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">จัดการหนังสือ</h1><p className="mt-1 text-black/50">KU Digital Library</p></div><button onClick={()=>supabase.auth.signOut().then(load)} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow"><LogOut size={16}/> ออกจากระบบ</button></div>

    <form key={editingBook?.id ?? "new"} onSubmit={saveBook} className="mt-8 grid gap-4 rounded-3xl bg-white p-6 shadow-soft md:grid-cols-2">
      <div className="flex items-center justify-between md:col-span-2">
        <h2 className="text-xl font-bold">{editingBook ? `แก้ไขหนังสือ: ${editingBook.title_th}` : "เพิ่มหนังสือ"}</h2>
        {editingBook && (
          <button type="button" onClick={cancelEdit} className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm text-black/50 hover:bg-black/5">
            <X size={16}/> ยกเลิกการแก้ไข
          </button>
        )}
      </div>

      <input name="title_th" required defaultValue={editingBook?.title_th ?? ""} placeholder="ชื่อหนังสือภาษาไทย *" className="rounded-xl border border-black/10 px-4 py-3"/>
      <input name="title_en" defaultValue={editingBook?.title_en ?? ""} placeholder="English title" className="rounded-xl border border-black/10 px-4 py-3"/>
      <input name="author" defaultValue={editingBook?.author ?? ""} placeholder="ผู้แต่ง" className="rounded-xl border border-black/10 px-4 py-3"/>

      <select name="category" defaultValue={editingBook?.category ?? ""} className="rounded-xl border border-black/10 px-4 py-3 text-black/80">
        <option value="">เลือกหมวดหมู่</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <input name="published_year" type="number" defaultValue={editingBook?.published_year ?? ""} placeholder="ปีที่เผยแพร่" className="rounded-xl border border-black/10 px-4 py-3"/>

      <label className="rounded-xl border border-dashed border-black/20 p-3 text-sm">
        <span className="mb-2 block font-medium">PDF {editingBook ? "(เลือกไฟล์ใหม่ถ้าต้องการเปลี่ยน)" : "*"}</span>
        <input name="pdf" type="file" accept="application/pdf" required={!editingBook}/>
      </label>
      <label className="rounded-xl border border-dashed border-black/20 p-3 text-sm">
        <span className="mb-2 block font-medium">รูปปก (ไม่บังคับ — เลือกไฟล์ใหม่ถ้าต้องการเปลี่ยน)</span>
        <input name="cover" type="file" accept="image/*"/>
      </label>

      <textarea name="description" defaultValue={editingBook?.description ?? ""} placeholder="คำอธิบายหนังสือ" rows={4} className="md:col-span-2 rounded-xl border border-black/10 px-4 py-3"/>

      <button className="md:col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-forest px-5 py-3 font-semibold text-white">
        <Upload size={18}/> {editingBook ? "บันทึกการแก้ไข" : "อัปโหลดหนังสือ"}
      </button>
      {message && <p className="md:col-span-2 text-sm text-black/60">{message}</p>}
    </form>

    <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="border-b border-black/5 p-5 font-bold">หนังสือทั้งหมด ({books.length})</div>
      {books.map(b=>
        <div key={b.id} className={`flex items-center justify-between gap-4 border-b border-black/5 p-5 last:border-0 ${editingBook?.id === b.id ? "bg-mint/40" : ""}`}>
          <div><div className="font-semibold">{b.title_th}</div><div className="text-sm text-black/45">{b.category || "ไม่ระบุหมวดหมู่"}</div></div>
          <div className="flex items-center gap-1">
            <button onClick={()=>startEdit(b)} className="rounded-xl p-2 text-forest hover:bg-mint"><Pencil size={18}/></button>
            <button onClick={()=>removeBook(b)} className="rounded-xl p-2 text-red-500 hover:bg-red-50"><Trash2 size={18}/></button>
          </div>
        </div>
      )}
    </div>
  </main>;
}