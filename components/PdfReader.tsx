"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
// @ts-ignore - react-pageflip ไม่มี type ที่สมบูรณ์แบบในบางเวอร์ชัน
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PAGE_MAX_WIDTH = 460;   // ความกว้างสูงสุดของหนึ่งหน้า (px)
const RENDER_WINDOW = 2;      // render จริงเฉพาะหน้าที่อยู่ใกล้หน้าปัจจุบัน ที่เหลือเป็น placeholder (กันหน่วง)

export default function PdfReader({ book }: { book: Book }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0); // 0-based index จาก react-pageflip
  const [pageWidth, setPageWidth] = useState(380);
  const flipBookRef = useRef<any>(null);

  const url = useMemo(
    () => supabase.storage.from("pdfs").getPublicUrl(book.pdf_path).data.publicUrl,
    [book.pdf_path]
  );

  useEffect(() => {
    const onResize = () => setPageWidth(Math.min(window.innerWidth - 48, PAGE_MAX_WIDTH));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (numPages > 0) {
      const saved = Number(localStorage.getItem(`ku-book-page-${book.id}`));
      if (saved > 0) {
        setTimeout(() => flipBookRef.current?.pageFlip()?.turnToPage(saved), 50);
      }
    }
  }, [book.id, numPages]);

  const goPrev = () => flipBookRef.current?.pageFlip()?.flipPrev();
  const goNext = () => flipBookRef.current?.pageFlip()?.flipNext();

  const onFlip = (e: { data: number }) => {
    setCurrentPage(e.data);
    localStorage.setItem(`ku-book-page-${book.id}`, String(e.data));
  };

  const pageHeight = Math.round(pageWidth * 1.41);

  return <div className="reader-page min-h-[calc(100vh-73px)] bg-[#e9e9e5]">
    <div className="sticky top-[73px] z-30 flex flex-wrap items-center justify-center gap-2 border-b border-black/5 bg-white/90 p-3 backdrop-blur">
      <button disabled={currentPage <= 0} onClick={goPrev} className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-30"><ChevronLeft/></button>
      <span className="min-w-24 text-center text-sm">{currentPage + 1} / {numPages || "…"}</span>
      <button disabled={currentPage >= numPages - 1} onClick={goNext} className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-30"><ChevronRight/></button>
      <span className="mx-2 h-6 w-px bg-black/10"/>
      <button onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-xl p-2 hover:bg-black/5"><Maximize2 size={18}/></button>
    </div>

    <div className="flex justify-center p-4 sm:p-8">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<div className="p-20 text-black/45">กำลังเปิดหนังสือ...</div>}
        error={<div className="p-20 text-red-600">ไม่สามารถเปิด PDF ได้</div>}
      >
        {numPages > 0 && (
          <HTMLFlipBook
            ref={flipBookRef}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            minWidth={200}
            maxWidth={600}
            minHeight={280}
            maxHeight={900}
            showCover={true}
            onFlip={onFlip}
            className="shadow-soft"
            startPage={0}
            drawShadow={true}
            flippingTime={550}
            usePortrait={false}
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
          </HTMLFlipBook>
        )}
      </Document>
    </div>
  </div>;
}