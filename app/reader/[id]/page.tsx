"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/lib/types";
import PdfReader from "@/components/PdfReader";

export default function Reader({ params }: { params: Promise<{ id: string }> }) {
  const [book, setBook] = useState<Book | null>(null);
  useEffect(() => { params.then(({ id }) => supabase.from("books").select("*").eq("id", id).single().then(({ data }) => setBook(data as Book))); }, [params]);
  if (!book) return <div className="p-20 text-center">กำลังโหลด...</div>;
  return <><div className="fixed left-3 top-3 z-50"><Link href={`/books/${book.id}`} className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm shadow"><ArrowLeft size={16}/> กลับ</Link></div><PdfReader book={book}/></>;
}
