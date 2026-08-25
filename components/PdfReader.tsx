"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Minus, Plus, Maximize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfReader({ book }: { book: Book }) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(780);

  useEffect(() => {
    const onResize = () => setWidth(Math.min(window.innerWidth - 32, 780));
    onResize(); window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const saved = Number(localStorage.getItem(`ku-book-page-${book.id}`));
    if (saved > 0) setPage(saved);
  }, [book.id]);

  useEffect(() => { localStorage.setItem(`ku-book-page-${book.id}`, String(page)); }, [book.id, page]);

  const url = supabase.storage.from("pdfs").getPublicUrl(book.pdf_path).data.publicUrl;

  return <div className="reader-page min-h-[calc(100vh-73px)] bg-[#e9e9e5]">
    <div className="sticky top-[73px] z-30 flex flex-wrap items-center justify-center gap-2 border-b border-black/5 bg-white/90 p-3 backdrop-blur">
      <button disabled={page <= 1} onClick={() => setPage(p => p-1)} className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-30"><ChevronLeft/></button>
      <span className="min-w-24 text-center text-sm">{page} / {pages || "…"}</span>
      <button disabled={page >= pages} onClick={() => setPage(p => p+1)} className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-30"><ChevronRight/></button>
      <span className="mx-2 h-6 w-px bg-black/10"/>
      <button onClick={() => setScale(s => Math.max(.7, s-.1))} className="rounded-xl p-2 hover:bg-black/5"><Minus size={18}/></button>
      <span className="text-sm">{Math.round(scale*100)}%</span>
      <button onClick={() => setScale(s => Math.min(1.8, s+.1))} className="rounded-xl p-2 hover:bg-black/5"><Plus size={18}/></button>
      <button onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-xl p-2 hover:bg-black/5"><Maximize2 size={18}/></button>
    </div>
    <div className="flex justify-center p-4 sm:p-8">
      <div className="overflow-hidden rounded-xl bg-white shadow-soft">
        <Document file={url} onLoadSuccess={({ numPages }) => setPages(numPages)} loading={<div className="p-20 text-black/45">กำลังเปิดหนังสือ...</div>} error={<div className="p-20 text-red-600">ไม่สามารถเปิด PDF ได้</div>}>
          <Page pageNumber={page} width={width * scale} renderTextLayer={false} renderAnnotationLayer={false}/>
        </Document>
      </div>
    </div>
  </div>;
}
