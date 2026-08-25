# KU Digital Library

เว็บ E-Book แบบ Modern Responsive สำหรับ Desktop / iPad / Mobile

## เทคโนโลยี
- Next.js
- Tailwind CSS
- Supabase Database + Storage
- react-pdf

## 1. ติดตั้ง Node.js
ติดตั้ง Node.js LTS จาก https://nodejs.org/

ตรวจสอบ:
```bash
node -v
npm -v
```

## 2. ติดตั้งโปรเจกต์
แตก ZIP แล้วเปิด Terminal ในโฟลเดอร์โปรเจกต์:

```bash
npm install
```

## 3. สร้าง Supabase
สร้าง Project ใหม่ที่ https://supabase.com/

ไปที่ SQL Editor แล้วนำไฟล์ `supabase/schema.sql` ไปวางและกด Run

จาก Authentication > Users สร้างผู้ใช้ Admin ด้วยอีเมลและรหัสผ่าน

## 4. ตั้งค่า Environment
คัดลอก `.env.local.example` เป็น `.env.local`

ใส่ค่า:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

ค่าอยู่ที่ Supabase > Project Settings > API

## 5. เปิดเว็บ
```bash
npm run dev
```

เปิด http://localhost:3000

หน้า Admin:
http://localhost:3000/admin

## 6. Deploy GitHub + Vercel
สร้าง repository ใหม่บน GitHub แล้ว:

```bash
git init
git add .
git commit -m "Initial KU Digital Library"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ku-digital-library.git
git push -u origin main
```

จากนั้นนำ repository ไป Import ใน Vercel

ตั้ง Environment Variables ใน Vercel เหมือน `.env.local`

## หมายเหตุสำคัญ
Starter นี้ถือว่า "ผู้ใช้ที่ login Supabase ได้ = Admin" เพื่อให้ติดตั้งง่ายที่สุด
ก่อนเปิดใช้งานจริงกับองค์กร ควรเพิ่มระบบตรวจ role/admin โดยเฉพาะ
และควรตรวจสิทธิ์/ลิขสิทธิ์ของ PDF ก่อนเผยแพร่สู่สาธารณะ
