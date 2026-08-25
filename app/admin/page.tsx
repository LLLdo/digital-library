"use client";

import { useEffect, useState } from "react";
import { LogIn, Upload, Trash2, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Book } from "@/lib/types";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

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

  async function addBook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage("กำลังอัปโหลด...");
    const form = new FormData(e.currentTarget);
    const pdf = form.get("pdf") as File;
    const cover = form.get("cover") as File;
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
    const { error } = await supabase.from("books").insert({
      title_th: form.get("title_th"), title_en: form.get("title_en") || null,
      author: form.get("author") || null, category: form.get("category") || null,
      description: form.get("description") || null,
      published_year: form.get("published_year") ? Number(form.get("published_year")) : null,
      pdf_path: safe, cover_path: coverPath
    });
    if (error) setMessage(error.message); else { setMessage("เพิ่มหนังสือสำเร็จ"); e.currentTarget.reset(); await load(); }
  }

  async function removeBook(book: Book) {
    if (!confirm(`ลบ "${book.title_th}" ?`)) return;
    await supabase.from("books").delete().eq("id", book.id);
    await supabase.storage.from("pdfs").remove([book.pdf_path]);
    if (book.cover_path) await supabase.storage.from("covers").remove([book.cover_path]);
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
    <form onSubmit={addBook} className="mt-8 grid gap-4 rounded-3xl bg-white p-6 shadow-soft md:grid-cols-2">
      <h2 className="md:col-span-2 text-xl font-bold">เพิ่มหนังสือ</h2>
      <input name="title_th" required placeholder="ชื่อหนังสือภาษาไทย *" className="rounded-xl border border-black/10 px-4 py-3"/>
      <input name="title_en" placeholder="English title" className="rounded-xl border border-black/10 px-4 py-3"/>
      <input name="author" placeholder="ผู้แต่ง" className="rounded-xl border border-black/10 px-4 py-3"/>
      <input name="category" placeholder="หมวดหมู่ เช่น การเกษตร / วิจัย" className="rounded-xl border border-black/10 px-4 py-3"/>
      <input name="published_year" type="number" placeholder="ปีที่เผยแพร่" className="rounded-xl border border-black/10 px-4 py-3"/>
      <label className="rounded-xl border border-dashed border-black/20 p-3 text-sm"><span className="block mb-2 font-medium">PDF *</span><input name="pdf" type="file" accept="application/pdf" required/></label>
      <label className="rounded-xl border border-dashed border-black/20 p-3 text-sm"><span className="block mb-2 font-medium">รูปปก (ไม่บังคับ)</span><input name="cover" type="file" accept="image/*"/></label>
      <textarea name="description" placeholder="คำอธิบายหนังสือ" rows={4} className="md:col-span-2 rounded-xl border border-black/10 px-4 py-3"/>
      <button className="md:col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-forest px-5 py-3 font-semibold text-white"><Upload size={18}/> อัปโหลดหนังสือ</button>
      {message && <p className="md:col-span-2 text-sm text-black/60">{message}</p>}
    </form>
    <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="border-b border-black/5 p-5 font-bold">หนังสือทั้งหมด ({books.length})</div>
      {books.map(b=><div key={b.id} className="flex items-center justify-between gap-4 border-b border-black/5 p-5 last:border-0"><div><div className="font-semibold">{b.title_th}</div><div className="text-sm text-black/45">{b.category || "ไม่ระบุหมวดหมู่"}</div></div><button onClick={()=>removeBook(b)} className="rounded-xl p-2 text-red-500 hover:bg-red-50"><Trash2 size={18}/></button></div>)}
    </div>
  </main>;
}
