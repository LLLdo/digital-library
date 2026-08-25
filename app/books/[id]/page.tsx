"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/lib/types";

export default function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    params.then(({ id }) => supabase.from("books").select("*").eq("id", id).single().then(({ data }) => setBook(data as Book)));
  }, [params]);

  if (!book) return <main className="mx-auto max-w-5xl px-5 py-20 text-center">กำลังโหลด...</main>;

  const cover = book.cover_path ? supabase.storage.from("covers").getPublicUrl(book.cover_path).data.publicUrl : null;

  return <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-16">
    <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-black/50 hover:text-forest"><ArrowLeft size={17}/> กลับไปคลังหนังสือ</Link>
    <div className="grid gap-8 md:grid-cols-[260px_1fr]">
      <div className="overflow-hidden rounded-3xl bg-mint shadow-soft aspect-[3/4]">
        {cover ? <img src={cover} alt={book.title_th} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center"><BookOpen size={55} className="text-forest/40"/></div>}
      </div>
      <div>
        <span className="rounded-full bg-mint px-3 py-1 text-sm text-forest">{book.category || "E-Book"}</span>
        <h1 className="mt-5 text-3xl font-bold sm:text-4xl">{book.title_th}</h1>
        {book.title_en && <p className="mt-2 text-lg text-black/45">{book.title_en}</p>}
        <p className="mt-5 text-black/60">ผู้แต่ง: {book.author || "ไม่ระบุ"}</p>
        {book.published_year && <p className="mt-1 text-sm text-black/45">ปีที่เผยแพร่: {book.published_year}</p>}
        {book.description && <p className="mt-8 whitespace-pre-line leading-8 text-black/65">{book.description}</p>}
        <Link href={`/reader/${book.id}`} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-forest px-6 py-3.5 font-semibold text-white shadow-soft hover:opacity-90"><BookOpen size={19}/> เปิดอ่านหนังสือ</Link>
      </div>
    </div>
  </main>;
}
