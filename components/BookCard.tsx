import Link from "next/link";
import { BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Book } from "@/lib/types";

export default function BookCard({ book }: { book: Book }) {
  const cover = book.cover_path
    ? supabase.storage.from("covers").getPublicUrl(book.cover_path).data.publicUrl
    : null;

  return (
    <Link href={`/books/${book.id}`} className="group">
      <article className="overflow-hidden rounded-3xl bg-white shadow-soft transition duration-200 group-hover:-translate-y-1">
        <div className="aspect-[3/4] overflow-hidden bg-mint">
          {cover ? (
            <img src={cover} alt={book.title_th} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="grid h-full place-items-center p-8 text-center text-forest/50">
              <div>
                <BookOpen className="mx-auto mb-3" size={42} />
                <span className="text-sm">KU Digital Library</span>
              </div>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="line-clamp-2 font-semibold leading-6">{book.title_th}</div>
          <div className="mt-1 line-clamp-1 text-sm text-black/50">{book.author || "ไม่ระบุผู้แต่ง"}</div>
          {book.category && <span className="mt-3 inline-block rounded-full bg-mint px-2.5 py-1 text-xs text-forest">{book.category}</span>}
        </div>
      </article>
    </Link>
  );
}
