export type Book = {
  id: string;
  title_th: string;
  title_en: string | null;
  author: string | null;
  category: string | null;
  description: string | null;
  cover_path: string | null;
  pdf_path: string;
  published_year: number | null;
  created_at: string;
};
