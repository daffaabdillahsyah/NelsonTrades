# NST Bootcamp — Trading Journal

Platform trading journal berbasis web untuk mencatat, menganalisis, dan memantau performa trading.

**Tech stack:** Next.js 16 · Prisma · SQLite · NextAuth · Tailwind CSS

---

## Fitur Utama

- **Dashboard** — ringkasan performa: winrate, net P&L, R:R ratio, preview funded accounts
- **Journal** — catat setiap trade (pair, arah, entry/exit, SL/TP, P&L, foto setup)
- **Kalender Trading** — visualisasi hari profit/loss per bulan
- **Funded Accounts** — pantau akun prop-firm (max drawdown, daily drawdown, profit target)
- **Learn** — video pembelajaran berdasarkan kategori (dikelola oleh admin)
- **Admin Panel** — kelola user, kategori, video, dan lihat statistik platform

---

## Prasyarat (sebelum mulai)

Pastikan sudah terinstall di komputer kamu:

| Software | Versi minimal | Cara cek |
|---|---|---|
| **Node.js** | 18.x atau lebih baru | `node -v` |
| **npm** | sudah ikut bareng Node.js | `npm -v` |
| **Git** | bebas | `git --version` |

> Belum punya Node.js? Download di [nodejs.org](https://nodejs.org) — pilih versi **LTS**.

---

## Setup Awal (clone pertama kali)

Ikuti langkah ini **berurutan** — jangan skip.

### 1. Clone repo

```bash
git clone <URL_REPO_INI>
cd nst-bootcamp
```

### 2. Install dependencies

```bash
npm install
```

Ini akan menginstall semua package yang dibutuhkan (Next.js, Prisma, NextAuth, dll). Prosesnya 1-3 menit.

### 3. Buat file `.env.local`

Buat file baru bernama `.env.local` di folder root project (sejajar dengan `package.json`), lalu isi dengan:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-ganti-ini-terserah"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="dev-secret-ganti-ini-terserah"
```

> **Penting:** `NEXTAUTH_SECRET` dan `AUTH_SECRET` harus sama persis. Nilai bebas, tapi jangan dikosongkan.
> File `.env.local` tidak boleh di-commit ke Git (sudah ada di `.gitignore`).

### 4. Buat database & jalankan migration

```bash
npx prisma migrate dev
```

Perintah ini membuat file database `dev.db` dan membuat semua tabel yang dibutuhkan.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

> **Kenapa harus manual?** Project ini pakai konfigurasi Prisma khusus (`prisma.config.ts`) yang membuat `migrate dev` tidak otomatis generate client. Kalau skip langkah ini, app akan error saat dijalankan.

### 6. Isi data awal (user, kategori, video sample)

```bash
npx prisma db seed
```

Ini membuat:
- Akun **admin**: username `admin`, password `admin123`
- Akun **user biasa**: username `user1`, password `user123`
- 5 kategori, masing-masing 2 subkategori, 1 video per subkategori

### 7. Jalankan app

```bash
npm run dev
```

Buka browser dan akses: **http://localhost:3000**

---

## Login

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| User biasa | `user1` | `user123` |

Admin bisa akses **Admin Panel** (ada di sidebar setelah login). User biasa hanya bisa akses dashboard, journal, learn, dan accounts.

---

## Update Setelah `git pull`

Setiap kali ada update dari GitHub, jalankan ini:

```bash
git pull
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

> `npx prisma generate` wajib dijalankan setiap kali ada migration baru, karena project ini tidak melakukannya secara otomatis.

---

## Troubleshooting

### Error: `prisma.fundedAccount is not a function` atau property undefined

**Penyebab:** Prisma Client belum di-generate setelah migration terbaru.

**Solusi:**
```bash
npx prisma generate
```
Lalu restart dev server (stop dengan `Ctrl+C`, lalu `npm run dev` lagi).

---

### Error: `Cannot find module '@prisma/client'`

**Penyebab:** `npm install` belum dijalankan, atau `node_modules` korup.

**Solusi:**
```bash
npm install
npx prisma generate
```

---

### Error: `Invalid `prisma.xxx.findMany()` invocation` — kolom tidak ditemukan

**Penyebab:** Ada migration baru tapi database lokal belum di-update.

**Solusi:**
```bash
npx prisma migrate dev
npx prisma generate
```
Lalu restart dev server.

---

### Halaman redirect ke login terus padahal sudah login

**Penyebab:** `.env.local` belum dibuat atau `NEXTAUTH_SECRET` kosong.

**Solusi:** Pastikan file `.env.local` ada dan isinya benar (lihat langkah 3).

---

### Database mau di-reset dari awal (data hilang semua)

```bash
npx prisma migrate reset
```

Perintah ini menghapus semua data, ulang migration dari awal, lalu jalankan seed otomatis. Cocok kalau database sudah kacau.

---

## Perintah Prisma yang Berguna

| Perintah | Kegunaan |
|---|---|
| `npx prisma migrate dev` | Apply migration baru, update struktur database |
| `npx prisma generate` | Regenerate Prisma Client dari schema terbaru |
| `npx prisma db seed` | Jalankan seed script (isi data awal) |
| `npx prisma migrate reset` | Reset database + re-apply semua migration + seed |
| `npx prisma studio` | Buka UI untuk lihat/edit data database di browser |

---

## Struktur Folder (ringkas)

```
nst-bootcamp/
├── app/
│   ├── (auth)/login/       # Halaman login
│   ├── (user)/             # Halaman user (dashboard, journal, learn, accounts)
│   ├── admin/              # Halaman admin panel
│   └── api/                # API routes (REST endpoints)
├── components/             # Komponen React yang dipakai di banyak tempat
├── lib/                    # Prisma client, auth config
├── prisma/
│   ├── schema.prisma       # Definisi model database
│   ├── migrations/         # File migration (jangan diedit manual)
│   └── seed.js             # Script isi data awal
├── public/uploads/         # File upload (foto trade)
├── .env.local              # Environment variables (JANGAN di-commit)
└── proxy.js                # Route protection (mirip middleware)
```
