"use client";

import { useEffect, useState, MouseEvent } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Minus, Plus, Maximize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const SPREAD_MIN_WIDTH = 900; // ต่ำกว่านี้จะ fallback เป็นหน้าเดี่ยว
const FLIP_MS = 220;

export default function PdfReader({ book }: { book: Book }) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1); // หน้าซ้ายของคู่ที่กำลังแสดง (หรือหน้าเดี่ยวถ้าจอแคบ)
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(780);
  const [isSpread, setIsSpread] = useState(true);
  const [flip, setFlip] = useState<"next" | "prev" | null>(null);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setContainerWidth(Math.min(w - 32, 1400));
      setIsSpread(w >= SPREAD_MIN_WIDTH);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const saved = Number(localStorage.getItem(`ku-book-page-${book.id}`));
    if (saved > 0) setPage(saved);
  }, [book.id]);

  useEffect(() => { localStorage.setItem(`ku-book-page-${book.id}`, String(page)); }, [book.id, page]);

  const url = supabase.storage.from("pdfs").getPublicUrl(book.pdf_path).data.publicUrl;

  // หน้าปก (หน้า 1) โชว์เดี่ยวเสมอ จากนั้นจับคู่ 2-3, 4-5, ...
  const isCoverPage = page === 1;
  const showTwoPages = isSpread && !isCoverPage && page < pages;
  const rightPage = showTwoPages ? page + 1 : null;

  const pageWidth = showTwoPages
    ? (containerWidth * scale) / 2 - 8
    : containerWidth * scale;

  const canGoPrev = page > 1;
  const canGoNext = page < pages;

  const goPrev = () => {
    if (!canGoPrev || flip) return;
    setFlip("prev");
    setTimeout(() => {
      if (!isSpread) setPage(p => p - 1);
      else if (page === 2) setPage(1);
      else setPage(p => Math.max(1, p - 2));
      setFlip(null);
    }, FLIP_MS);
  };

  const goNext = () => {
    if (!canGoNext || flip) return;
    setFlip("next");
    setTimeout(() => {
      if (!isSpread) setPage(p => p + 1);
      else if (page === 1) setPage(2);
      else setPage(p => Math.min(pages, p + 2));
      setFlip(null);
    }, FLIP_MS);
  };

  const onBookClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) goPrev(); else goNext();
  };

  return <div className="reader-page min-h-[calc(100vh-73px)] bg-[#e9e9e5]">
    <div className="sticky top-[73px] z-30 flex flex-wrap items-center justify-center gap-2 border-b border-black/5 bg-white/90 p-3 backdrop-blur">
      <button disabled={!canGoPrev} onClick={goPrev} className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-30"><ChevronLeft/></button>
      <span className="min-w-24 text-center text-sm">
        {rightPage ? `${page}-${rightPage}` : page} / {pages || "…"}
      </span>
      <button disabled={!canGoNext} onClick={goNext} className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-30"><ChevronRight/></button>
      <span className="mx-2 h-6 w-px bg-black/10"/>
      <button onClick={() => setScale(s => Math.max(.7, s-.1))} className="rounded-xl p-2 hover:bg-black/5"><Minus size={18}/></button>
      <span className="text-sm">{Math.round(scale*100)}%</span>
      <button onClick={() => setScale(s => Math.min(1.8, s+.1))} className="rounded-xl p-2 hover:bg-black/5"><Plus size={18}/></button>
      <button onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-xl p-2 hover:bg-black/5"><Maximize2 size={18}/></button>
    </div>
    <div className="flex justify-center p-4 sm:p-8">
      <div
        onClick={onBookClick}
        className={`flex cursor-pointer select-none items-stretch overflow-hidden rounded-xl bg-white shadow-soft transition-all duration-200 ease-out ${
          flip === "next" ? "origin-left [transform:perspective(1600px)_rotateY(-8deg)_scale(.98)] opacity-60" : ""
        } ${
          flip === "prev" ? "origin-right [transform:perspective(1600px)_rotateY(8deg)_scale(.98)] opacity-60" : ""
        }`}
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setPages(numPages)}
          loading={<div className="p-20 text-black/45">กำลังเปิดหนังสือ...</div>}
          error={<div className="p-20 text-red-600">ไม่สามารถเปิด PDF ได้</div>}
          className="flex items-stretch"
        >
          <Page pageNumber={page} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false}/>
          {rightPage && (
            <>
              <div className="w-px shrink-0 bg-black/10" />
              <Page pageNumber={rightPage} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false}/>
            </>
          )}
        </Document>
      </div>
    </div>
    <p className="pb-4 text-center text-xs text-black/35">คลิกซีกซ้ายของหนังสือเพื่อย้อนหน้า คลิกซีกขวาเพื่อไปหน้าถัดไป</p>
  </div>;
}