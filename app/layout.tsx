import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "KU Digital Library",
  description: "Modern digital library for Kasetsart University",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}