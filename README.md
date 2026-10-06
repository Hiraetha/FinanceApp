# 💸 My Finance — Smart Fintech & AI Predictive Cash Flow App

[![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React Native](https://img.shields.io/badge/Mobile-React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Platform-Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-NativeWind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://www.nativewind.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**My Finance** adalah aplikasi manajemen finansial modern berbasis *Full-Stack* (Mobile + Backend API) yang dilengkapi dengan antarmuka bertema **Dark Fintech** serta **AI Predictive Engine** untuk membantu pengguna mengontrol arus kas, menyimulasikan kelayakan belanja (*Can I Buy It?*), melacak target tabungan (*Savings Goals*), dan menganalisis kesehatan keuangan secara *real-time*.

---

## 📱 Fitur Utama Aplikasi

### 1. 🏠 Dashboard Keuangan Real-Time
- **Total Saldo & Ringkasan Bulanan**: Pantau akumulasi dana, total uang masuk, dan uang keluar secara akurat.
- **Kartu Saldo Dinamis**: Desain *ambient geometric rings* dengan fitur sembunyikan/tampilkan nominal saldo (*Privacy Eye Toggle*).
- **Financial Health Score**: Skor kesehatan finansial terotomasi (0 - 100) berdasarkan rasio tabungan, disiplin anggaran, dan cadangan dana darurat (*Runway Days*).

### 2. 💳 Manajemen Arus Kas & Transaksi
- **Pencatatan Cepat**: Input transaksi pemasukan (*Income*) dan pengeluaran (*Expense*) lengkap dengan kategori, nominal, dan catatan.
- **Pencarian & Filter**: Filter berdasarkan jenis transaksi (*Semua, Pemasukan, Pengeluaran*) dan fitur pencarian teks instan.
- **Ringkasan Arus Kas**: Tampilan visual proporsional *Uang Masuk* vs *Uang Keluar* (*Dual Bar Track*).
- **Hapus & Edit Transaksi**: Konfirmasi hapus transaksi dengan custom dialog modal bertema gelap.

### 3. 🤖 Simulator Prediktif AI ("Can I Buy It?")
- **Uji Kelayakan Belanja**: Masukkan nama barang dan estimasi harga sebelum memutuskan *checkout*.
- **Kalkulasi Akurat Saldo Setelah Beli**: Menampilkan estimasi sisa saldo dan mendeteksi potensi defisit (minus kas) jika dana tidak mencukupi atau saldo Rp 0.
- **Perhitungan Runway Kas**: Memprediksi berapa hari cadangan kas Anda mampu bertahan setelah melakukan pembelian barang tersebut.
- **Rekomendasi Cerdas**: Rekomendasi status (*AMAN DIBELI*, *PERTIMBANGKAN*, atau *TIDAK DISARANKAN*) beserta saran jeda waktu menabung (*Delay Days*).

### 4. 🎯 Target Tabungan (Savings Goals)
- **Target Impian Finansial**: Buat target tabungan dengan target nominal dan setoran awal.
- **Tambah Setoran Fleksibel**: Setor tabungan berkala dengan *quick chip presets* (+Rp 500k, +Rp 1M, +Rp 2M).
- **Hapus Target**: Dukungan hapus target tabungan langsung dari kartu atau layar detail dengan modal konfirmasi aman.
- **Indikator Progres**: Progress bar dinamis, sisa dana yang harus dikumpulkan, serta metrik *On Track*.

### 5. 📊 Analitik & Laporan Keuangan Bulanan
- **Navigasi Pemilihan Bulan Interaktif**: Cek laporan keuangan historis bulan sebelumnya maupun bulan berikutnya dengan tombol panah kiri-kanan.
- **Proporsi Kategori**: Analisis visual persentase pengeluaran per kategori secara transparan.
- **Smart AI Insight**: Ringkasan performa finansial otomatis (status surplus, defisit, atau seimbang) sesuai data bulan yang dipilih.
- **Tanpa Data Palsu**: Nilai default bersih Rp 0 untuk pengguna baru atau bulan tanpa transaksi.

### 6. ✨ UI/UX Premium Dark Fintech
- **Custom Alert Dialog**: Dialog sistem bawaan OS digantikan dengan custom modal dark theme (`#171c2a`, border `#262a3a`, aksen pendar neon green `#10e57a`).
- **Responsive Layout**: Dukungan penuh Android & iOS via Expo Go.

---

## 🛠️ Arsitektur & Teknologi

| Komponen | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Mobile App** | React Native (Expo) | Framework cross-platform iOS & Android dengan TypeScript |
| **Styling** | NativeWind (Tailwind CSS) | Utility-first styling yang disesuaikan untuk React Native |
| **State Store** | Zustand | State management ringan dan reaktif (`authStore`, `financeStore`, `alertStore`) |
| **Backend API** | NestJS | Framework arsitektur modular TypeScript berbasis Node.js |
| **Database** | PostgreSQL | Database relasional untuk penyimpanan data transaksi dan pengguna |
| **ORM** | Prisma | Modern ORM dengan type-safety schema dan auto-migration |
| **Autentikasi** | JWT (JSON Web Tokens) | Stateless authentication dengan Access Token & Refresh Token |
| **API Docs** | Swagger / OpenAPI | Dokumentasi interaktif endpoint RESTful API |

---

## 📂 Struktur Direktori Proyek

```plaintext
financeApp/
├── backend/                  # RESTful API Backend (NestJS)
│   ├── prisma/               # Schema database Prisma & script seeding
│   ├── src/
│   │   ├── auth/             # Modul Register, Login, JWT Strategy
│   │   ├── transactions/     # Modul Transaksi & Riwayat Mutasi
│   │   ├── categories/       # Modul Kategori Transaksi
│   │   ├── budgets/          # Modul Anggaran Bulanan
│   │   ├── savings-goals/    # Modul Target Tabungan & Setoran
│   │   ├── predictions/      # Modul AI Simulator & Analisis Runway
│   │   ├── reports/          # Modul Laporan Bulanan & Analisis Kategori
│   │   └── dashboard/        # Modul Aggregasi Dashboard & Financial Health
│   └── package.json
│
├── mobile/                   # Aplikasi Mobile (React Native Expo)
│   ├── src/
│   │   ├── components/       # Komponen Reusable (BottomNav, CustomAlert)
│   │   ├── screens/          # Halaman UI (Home, Transaksi, Add, Reports, Simulator, Goals)
│   │   ├── services/         # Konfigurasi Axios & Secure Storage
│   │   ├── stores/           # Zustand State Management Stores
│   │   └── types/            # Definisi Interface TypeScript
│   ├── assets/               # Ikon, logo aplikasi, dan splash screen
│   └── package.json
│
├── .gitignore                # Aturan ignore Git (keamanan env & build artifacts)
└── README.md                 # Dokumentasi proyek
```

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Prasyarat Sistem
- **Node.js**: Versi `18.x` atau lebih baru
- **npm** atau **yarn**
- **PostgreSQL**: Database server lokal atau cloud (misal: Supabase, Neon, atau Docker)
- **Expo Go App**: Terpasang di smartphone fisik Anda (tersedia di Google Play Store & Apple App Store) atau emulator Android Studio

---

### 2. Konfigurasi Backend (NestJS)

1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Buat file `.env` di dalam folder `backend/`:
   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/finance_db?schema=public"
   JWT_SECRET="super-secret-jwt-key"
   JWT_EXPIRES_IN="1d"
   JWT_REFRESH_SECRET="super-secret-refresh-key"
   JWT_REFRESH_EXPIRES_IN="7d"
   PORT=3000
   ```

4. Jalankan migrasi database dan generate Prisma client:
   ```bash
   npx prisma migrate dev --name init
   ```

5. *(Opsional)* Isi database dengan data awal default (kategori, demo user):
   ```bash
   npm run prisma:seed
   ```

6. Jalankan server backend dalam mode pengembangan:
   ```bash
   npm run start:dev
   ```
   Server backend akan aktif di: `http://localhost:3000`  
   Dokumentasi Swagger API dapat diakses di: `http://localhost:3000/api/docs`

---

### 3. Konfigurasi Mobile App (React Native Expo)

1. Buka terminal baru dan masuk ke direktori `mobile`:
   ```bash
   cd mobile
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Pastikan smartphone dan laptop terhubung dalam **jaringan Wi-Fi yang sama**.

4. Jalankan aplikasi Expo:
   ```bash
   npx expo start -c
   ```

5. Buka aplikasi **Expo Go** di smartphone Anda, lalu pindai (*scan*) QR Code yang muncul di terminal untuk membuka aplikasi secara langsung di perangkat Anda!

---

## 🔒 Catatan Keamanan
Proyek ini telah dikonfigurasi dengan `.gitignore` komprehensif:
- Seluruh file environment (`.env`, `.env.*`, `env.example`) **tidak diunggah** ke repository untuk menjaga kerahasiaan kredensial database dan JWT secret.
- File dependensi (`node_modules`), artefak build (`dist`, `.expo`), dan folder perancangan diabaikan secara ketat.

---

## 👨‍💻 Kontribusi & Lisensi
Dikembangkan sebagai solusi finansial modern, aman, dan mudah digunakan.  
Dilisensikan di bawah lisensi [MIT](mobile/LICENSE).
