"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/lib/types";
import BookCard from "./BookCard";

export default function Library() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("books").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setBooks((data as Book[]) || []); setLoading(false); });
  }, []);

  const categories = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(books.map(b => b.category).filter(Boolean) as string[]))], [books]);

  const filtered = books.filter(b => {
    const q = query.toLowerCase();
    const hit = !q || [b.title_th, b.title_en, b.author, b.category].some(v => v?.toLowerCase().includes(q));
    return hit && (category === "ทั้งหมด" || b.category === category);
  });

  return (
    <main>
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-10 lg:px-8 lg:pt-16">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-sm text-forest">
            <Sparkles size={15} /> Modern digital library
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">อ่านหนังสือได้ทุกที่<br /><span className="text-forest">ใน KU Digital Library</span></h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-black/55 sm:text-lg">
            ค้นหาและเปิดอ่านหนังสือดิจิทัลได้ง่ายบนคอมพิวเตอร์ iPad และมือถือ
          </p>
        </div>

        <div className="mt-8 flex max-w-3xl items-center gap-3 rounded-2xl bg-white p-2 shadow-soft">
          <Search className="ml-3 text-black/35" size={21} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหาชื่อหนังสือ ผู้แต่ง หรือหมวดหมู่..." className="w-full bg-transparent px-1 py-3 outline-none" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <div className="mb-7 flex gap-2 overflow-x-auto pb-2">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${category === c ? "bg-forest text-white" : "bg-white text-black/55 hover:bg-mint"}`}>{c}</button>
          ))}
        </div>

        {loading ? <div className="py-20 text-center text-black/45">กำลังโหลดหนังสือ...</div> :
          filtered.length === 0 ? <div className="rounded-3xl bg-white p-12 text-center text-black/45">ยังไม่มีหนังสือที่ตรงกับการค้นหา</div> :
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">{filtered.map(b => <BookCard key={b.id} book={b} />)}</div>}
      </section>
    </main>
  );
}
