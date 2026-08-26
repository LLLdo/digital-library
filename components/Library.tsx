"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/lib/types";
import BookCard from "./BookCard";

// ปรับ 3 ค่านี้ได้ถ้าการ์ดหนังสือสูง/เตี้ยกว่านี้
const SHELF_H = 280;        // ความสูงโซนหนังสือแต่ละชั้น (px)
const PLANK_THICKNESS = 22; // ความหนาของแผ่นไม้ชั้น (px)
const SHELF_GAP = 60;       // ระยะห่างรวม (โซนหนังสือถัดไป) ระหว่างชั้น (px)

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

  const period = SHELF_H + SHELF_GAP;
  const plankStart = SHELF_H;
  const plankEnd = SHELF_H + PLANK_THICKNESS;

  const shelfBackground = {
    backgroundImage: `repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent ${plankStart}px,
      rgba(0,0,0,0.10) ${plankStart}px,
      rgba(0,0,0,0.10) ${plankStart + 3}px,
      #f1ddb8 ${plankStart + 3}px,
      #f1ddb8 ${plankStart + 6}px,
      #c9975f ${plankStart + 6}px,
      #b98552 ${plankStart + 10}px,
      #c9975f ${plankStart + 14}px,
      #b17c49 ${plankStart + 18}px,
      #8a6239 ${plankEnd - 3}px,
      #8a6239 ${plankEnd}px,
      rgba(0,0,0,0.28) ${plankEnd}px,
      rgba(0,0,0,0.10) ${plankEnd + 8}px,
      transparent ${plankEnd + 18}px,
      transparent ${period}px
    )`,
    backgroundSize: `100% ${period}px`,
    backgroundRepeat: "repeat-y" as const,
  };

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
          <div
            style={{ ...shelfBackground, paddingBottom: `${PLANK_THICKNESS + 20}px` }}
            className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6"
          >
            {filtered.map(b => (
              <div key={b.id} className="flex items-end justify-center pb-1 transition-transform duration-200 hover:-translate-y-1">
                <BookCard book={b} />
              </div>
            ))}
          </div>
        }
      </section>
    </main>
  );
}