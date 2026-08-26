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

const SPREAD_MIN_WIDTH = 900;     // จอกว้างกว่านี้ = โหมดคู่, แคบกว่า = หน้าเดี่ยว
const PAGE_MAX_WIDTH = 460;       // ความกว้างสูงสุดต่อหนึ่งหน้า
const RENDER_WINDOW_PAGES = 4;    // render จริงเฉพาะหน้า pdf ที่อยู่ใกล้หน้าปัจจุบัน กันหน่วง

// จับคู่เลขหน้า pdf เอง: หน้าปก (1) อยู่เดี่ยว จากนั้นจับคู่ 2-3, 4-5, ... (เฉพาะตอนโหมดคู่)
function buildGroups(totalPages: number, spread: boolean): number[][] {
  if (totalPages <= 0) return [];
  if (!spread) return Array.from({ length: totalPages }, (_, i) => [i + 1]);
  const groups: number[][] = [[1]];
  for (let p = 2; p <= totalPages; p += 2) {
    groups.push(p + 1 <= totalPages ? [p, p + 1] : [p]);
  }
  return groups;
}

export default function PdfReader({ book }: { book: Book }) {
  const [numPages, setNumPages] = useState(0);
  const [currentGroup, setCurrentGroup] = useState(0);
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

  const groups = useMemo(() => buildGroups(numPages, isSpread), [numPages, isSpread]);

  const singlePageWidth = isSpread
    ? Math.min((windowWidth - 64) / 2, PAGE_MAX_WIDTH)
    : Math.min(windowWidth - 40, PAGE_MAX_WIDTH);
  const singlePageHeight = Math.round(singlePageWidth * 1.41);
  const unitWidth = isSpread ? singlePageWidth * 2 : singlePageWidth;

  // กลับไปหน้าที่ค้างไว้ — เก็บเป็นเลขหน้า pdf จริง (ไม่ใช่ index กลุ่ม เพราะกลุ่มเปลี่ยนไปตามโหมดจอ)
  useEffect(() => {
    if (groups.length === 0) return;
    const saved = Number(localStorage.getItem(`ku-book-page-${book.id}`));
    const targetGroupIndex = saved > 0 ? Math.max(0, groups.findIndex(g => g.includes(saved))) : 0;
    const t = setTimeout(() => flipBookRef.current?.pageFlip()?.turnToPage(targetGroupIndex), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length, isSpread, book.id]);

  const goPrev = () => flipBookRef.current?.pageFlip()?.flipPrev();
  const goNext = () => flipBookRef.current?.pageFlip()?.flipNext();

  const onFlip = (e: { data: number }) => {
    setCurrentGroup(e.data);
    const firstPageOfGroup = groups[e.data]?.[0];
    if (firstPageOfGroup) localStorage.setItem(`ku-book-page-${book.id}`, String(firstPageOfGroup));
  };

  return <div className="reader-page min-h-[calc(100vh-73px)] bg-[#e9e9e5]">
    <div className="sticky top-[73px] z-30 flex flex-wrap items-center justify-center gap-2 border-b border-black/5 bg-white/90 p-3 backdrop-blur">
      <button disabled={currentGroup <= 0} onClick={goPrev} className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-30"><ChevronLeft/></button>
      <span className="min-w-24 text-center text-sm">
        {groups[currentGroup]?.join("-") ?? "…"} / {numPages || "…"}
      </span>
      <button disabled={currentGroup >= groups.length - 1} onClick={goNext} className="rounded-xl p-2 hover:bg-black/5 disabled:opacity-30"><ChevronRight/></button>
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
          {groups.length > 0 && (
            <FlipBook
              key={`${isSpread ? "spread" : "single"}-${numPages}`}
              ref={flipBookRef}
              width={unitWidth}
              height={singlePageHeight}
              size="fixed"
              minWidth={200}
              maxWidth={1400}
              minHeight={280}
              maxHeight={1600}
              showCover={true}
              onFlip={onFlip}
              className="shadow-soft"
              startPage={0}
              drawShadow={true}
              flippingTime={450}
              usePortrait={false}
              maxShadowOpacity={0.5}
              mobileScrollSupport={true}
              style={{}}
            >
              {groups.map((groupPages, gi) => {
                const nearest = groupPages[0];
                const shouldRender = Math.abs(nearest - (groups[currentGroup]?.[0] ?? 1)) <= RENDER_WINDOW_PAGES;
                return (
                  <div key={gi} className="flex items-stretch justify-center bg-white">
                    {groupPages.map(pn => (
                      shouldRender ? (
                        <Page key={pn} pageNumber={pn} width={singlePageWidth} renderTextLayer={false} renderAnnotationLayer={false}/>
                      ) : (
                        <div key={pn} style={{ width: singlePageWidth, height: singlePageHeight }} className="flex items-center justify-center text-xs text-black/20">
                          หน้า {pn}
                        </div>
                      )
                    ))}
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