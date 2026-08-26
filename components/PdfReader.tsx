"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// react-pageflip มาพร้อม type ที่บังคับ props เกินจริง (ไม่มีค่า default ให้)
const FlipBook = HTMLFlipBook as any;

const SPREAD_MIN_WIDTH = 900;   // จอกว้างกว่านี้ = โหมดคู่, แคบกว่า = หน้าเดี่ยว
const PAGE_MAX_WIDTH = 460;     // ความกว้างสูงสุดต่อหนึ่งหน้า
const RENDER_WINDOW = 3;        // render จริงเฉพาะหน้าที่อยู่ใกล้หน้าปัจจุบัน กันหน่วง

export default function PdfReader({ book }: { book: Book }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0); // 0-based index
  const [windowWidth, setWindowWidth] = useState(1200);
  const [isSpread, setIsSpread] = useState(true);
  const [zoom, setZoom] = useState(1);
  const flipBookRef = useRef<any>(null);

  const url = useMemo(
    () => supabase.storage.from("pdfs").getPublicUrl(book.pdf_path).data.publicUrl,
    [book.pdf_path]
  );

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setWindowWidth(w);
      setIsSpread(w >= SPREAD_MIN_WIDTH);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ความกว้างของ "หนึ่งหน้า" เท่านั้น — ให้ library เป็นคนจับคู่แสดงเองตอน isSpread=true
  const pageWidth = isSpread
    ? Math.min((windowWidth - 64) / 2, PAGE_MAX_WIDTH)
    : Math.min(windowWidth - 40, PAGE_MAX_WIDTH);
  const pageHeight = Math.round(pageWidth * 1.41);

  useEffect(() => {
    if (numPages === 0) return;
    const saved = Number(localStorage.getItem(`ku-book-page-${book.id}`));
    const target = saved > 0 ? saved - 1 : 0;
    const t = setTimeout(() => flipBookRef.current?.pageFlip()?.turnToPage(target), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages, isSpread, book.id]);

  const goPrev = () => flipBookRef.current?.pageFlip()?.flipPrev();
  const goNext = () => flipBookRef.current?.pageFlip()?.flipNext();

  const onFlip = (e: { data: number }) => {
    setCurrentPage(e.data);
    localStorage.setItem(`ku-book-page-${book.id}`, String(e.data + 1));
  };

  return <div className="reader-page min-h-[calc(100vh-73px)] bg-[#e9e9e5]">
    <div className="sticky top-[73px] z-30 flex flex-wrap items-center justify-center gap-2 border-b border-black/5 bg-white/90 p-3 backdrop-blur">
      <button disabled={currentPage <= 0} onClick={goPrev} className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-30"><ChevronLeft/></button>
      <span className="min-w-24 text-center text-sm">{currentPage + 1} / {numPages || "…"}</span>
      <button disabled={currentPage >= numPages - 1} onClick={goNext} className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-30"><ChevronRight/></button>
      <span className="mx-2 h-6 w-px bg-black/10"/>
      <button onClick={() => setZoom(z => Math.max(.6, +(z - .1).toFixed(2)))} className="rounded-xl p-2 hover:bg-black/5"><Minus size={18}/></button>
      <span className="min-w-12 text-center text-sm">{Math.round(zoom * 100)}%</span>
      <button onClick={() => setZoom(z => Math.min(2, +(z + .1).toFixed(2)))} className="rounded-xl p-2 hover:bg-black/5"><Plus size={18}/></button>
      <span className="mx-2 h-6 w-px bg-black/10"/>
      <button onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-xl p-2 hover:bg-black/5"><Maximize2 size={18}/></button>
    </div>

    <div className="flex justify-center overflow-auto p-4 sm:p-8">
      <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 150ms ease-out" }}>
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="p-20 text-black/45">กำลังเปิดหนังสือ...</div>}
          error={<div className="p-20 text-red-600">ไม่สามารถเปิด PDF ได้</div>}
        >
          {numPages > 0 && (
            <FlipBook
              // เปลี่ยน key ตอนสลับโหมด บังคับให้ library reset ตัวเองใหม่สะอาดๆ กันอาการค้างโหมดเดิม
              key={`${isSpread ? "spread" : "single"}-${numPages}`}
              ref={flipBookRef}
              width={pageWidth}
              height={pageHeight}
              size="fixed"
              minWidth={200}
              maxWidth={700}
              minHeight={280}
              maxHeight={1000}
              showCover={true}
              onFlip={onFlip}
              className="shadow-soft"
              startPage={0}
              drawShadow={true}
              flippingTime={450}
              usePortrait={!isSpread}
              maxShadowOpacity={0.5}
              mobileScrollSupport={true}
              style={{}}
            >
              {Array.from({ length: numPages }).map((_, i) => {
                const pageNum = i + 1;
                const shouldRender = Math.abs(pageNum - (currentPage + 1)) <= RENDER_WINDOW;
                return (
                  <div key={pageNum} className="flex items-center justify-center bg-white">
                    {shouldRender ? (
                      <Page pageNumber={pageNum} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                    ) : (
                      <div style={{ width: pageWidth, height: pageHeight }} className="flex items-center justify-center text-xs text-black/20">
                        หน้า {pageNum}
                      </div>
                    )}
                  </div>
                );
              })}
            </FlipBook>
          )}
        </Document>
      </div>
    </div>
  </div>;
}