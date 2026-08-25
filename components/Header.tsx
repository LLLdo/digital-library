import Link from "next/link";
import { BookOpen, ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-forest text-white shadow-soft">
            <BookOpen size={21} />
          </span>

          <div>
            <div className="font-bold tracking-tight">
              KU Digital Library
            </div>

            <div className="text-xs text-black/45">
              Kasetsart University
            </div>
          </div>
        </Link>

        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-black/60 hover:bg-white"
        >
          <ShieldCheck size={17} />
          Admin
        </Link>

      </div>
    </header>
  );
}