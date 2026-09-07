# 🌌 EduVerse

<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/graduation-cap.svg" width="80" height="80" alt="EduVerse Logo" />
</p>

<p align="center">
  <b>Platform Pembelajaran Berbasis Kelas Mandiri & Gamifikasi Kuis Interaktif</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18%2F19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Laravel-11%2F12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
  <img src="https://img.shields.io/badge/Sanctum-Auth-F55247?style=for-the-badge&logo=laravel&logoColor=white" alt="Sanctum" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## 📖 Tentang EduVerse

**EduVerse** adalah platform *Learning Management System* (LMS) modern yang mengusung konsep **desentralisasi ruang kelas mandiri**. Berbeda dengan platform konvensional yang kaku dan terpusat pada hierarki institusi sekolah, EduVerse memberikan kebebasan bagi setiap pengguna untuk membuat ruang kelasnya sendiri, mengundang anggota melalui **6-Karakter Kode Kelas Unik**, membagi peran secara dinamis (*Owner*, *Admin*, *Member*), serta berkolaborasi dalam mengelola materi dan evaluasi pembelajaran.

Aplikasi ini mengintegrasikan dua pilar inovasi:
1. **Version Control Materi Pembelajaran**: Setiap penambahan dan pengubahan materi melalui alur pengajuan draf, peninjauan berdampingan (*Side-by-Side Review*), dan verifikasi dua arah untuk menjamin kualitas konten.
2. **Gamifikasi Kuis Edukatif**: Pengalaman ujian yang interaktif menyerupai game dengan undian 8 variasi *Power-Up*, *Instant Lock & Feedback*, papan peringkat kelas (*Leaderboard*), serta kurva perolehan *Experience Points* (XP) anti-*farming*.

---

## ✨ Fitur-Fitur Unggulan

### 1. 🏫 Desentralisasi & Manajemen Ruang Kelas
- **Pembuatan Kelas Instan**: Siapapun bisa membuat ruang kelas dan otomatis menjadi **Owner**.
- **Kode Kelas 6 Karakter**: Anggota dapat bergabung dengan cepat tanpa verifikasi manual yang rumit.
- **Regenerasi Kode Kelas**: Owner dapat mengacak ulang kode jika kode lama bocor tanpa memutus anggota yang sudah terdaftar.
- **Kustomisasi & Pengaturan**: Informasi nama, deskripsi, tema visual, serta opsi penghapusan kelas permanen.

### 2. 👥 Manajemen Peran Berbasis Konteks (*Class-Scoped Roles*)
- Peran berlaku per kelas (`Owner`, `Admin`, `Member`). Seorang pengguna bisa menjadi Owner di kelasnya sendiri, sekaligus menjadi Member di kelas orang lain.
- **Promosi & Demosi**: Owner dapat menunjuk Member menjadi Admin atau menurunkannya kembali.
- **Moderasi Anggota**: Fitur mengeluarkan anggota (*Kick*) dan keluar dari kelas (*Leave*).

### 3. 📚 Kontrol Versi Materi (*Version Control Material*)
- **Alur Verifikasi Dua Arah**:
  - Draf materi yang dibuat Admin berstatus `menunggu_verifikasi`.
  - Owner meninjau revisi dan memutuskan untuk **Approve** (terbit) atau **Reject** (wajib melampirkan catatan revisi).
  - Materi yang dibuat langsung oleh Owner otomatis berstatus `terverifikasi` (v1).
- **Side-by-Side Comparison**: Tampilan perbandingan 2 kolom antara versi lama dan draf baru untuk mempermudah audit materi.
- **Riwayat Versi (*Version History*)**: Seluruh anggota dapat melihat dan membaca arsip versi materi terdahulu.

### 4. 🗃️ Manajemen Mapel & Bank Soal Cerdas (AI-Powered)
- **Katalog Mata Pelajaran**: Pengelompokan materi dengan kode singkatan dan palet warna visual tematik.
- **Bank Soal Kelas**: Soal-soal tersimpan terpusat dan dapat digunakan berulang kali untuk berbagai paket kuis.
- **Smart AI Text Parser**: Cukup salin prompt standar AI, tempel teks soal hasil generate AI, dan sistem akan mem-parsing pertanyaan, opsi A-E, kunci jawaban, serta pembahasan secara instan.

### 5. 🎮 Arena Kuis Gamifikasi Interaktif
- **Raffle Spin Awal**: Pengundian acak 3 dari 8 variasi *Power-Up* sebelum memulai pengerjaan kuis.
- **8 Ragam Power-Up**:
  - 💡 **Hint**: Memunculkan kata kunci bantuan/pembahasan.
  - ✂️ **Fifty-Fifty (50:50)**: Mengeliminasi 2 opsi jawaban salah secara acak.
  - 🔍 **Answer Scanner**: Memprediksi probabilitas persentase opsi jawaban benar.
  - ⏭️ **Skip Question**: Melewati butir soal rumit tanpa penalti skor.
  - 🎁 **Kotak Misteri**: Efek kejutan acak (Hint, 50:50, Skip, atau +15 XP instan).
  - 🍀 **Lucky Guess (Pasif)**: Peluang keberuntungan 25-30% mengubah jawaban salah menjadi benar saat dikunci.
  - 🔄 **Second Chance (Pasif)**: Memberi satu kali kesempatan memilih ulang jika jawaban pertama salah.
  - 🛡️ **Shield (Pasif)**: Melindungi skor agar tidak berkurang ketika menjawab keliru.
- **Instant Lock & Feedback**: Pilihan opsi langsung terkunci dengan feedback warna hijau/merah seketika, memberi jeda ~1.5 detik sebelum pindah soal.

### 6. 🏆 Leaderboard & Anti-Farming XP Scaling
- **Papan Peringkat Real-Time**: Pemeringkatan anggota kelas berdasarkan akumulasi XP dengan lencana *Gold*, *Silver*, dan *Bronze*.
- **Kurva XP Bertingkat**:
  - *Percobaan 1*: **100% XP**.
  - *Percobaan 2*: **50% XP** (apresiasi remedial).
  - *Percobaan 3+*: **0% XP** (mencegah eksploitasi spam XP).

### 7. 🔒 Keamanan & Sanitasi Sesi
- Otentikasi stateless via **Laravel Sanctum (Bearer Token)**.
- **Middleware `CekPeranKelas`**: Memastikan non-anggota diblokir ketat (`403 Forbidden`) saat mencoba mengakses resource kelas.
- **Clean Slate Logout**: Pembersihan total token di database, pembersihan state global, serta pembersihan storage klien untuk mencegah residu data antar-pengguna.

---

## 🏗️ Arsitektur Sistem

EduVerse dibangun dengan arsitektur terpisah (*Decoupled Client-Server Architecture*):

```
+-------------------------------------------------------------------------+
|                       FRONTEND LAYER (React SPA)                       |
|  - React 18 / 19 + React Router DOM v7 (Dynamic Routing /class/:id)    |
|  - Vite Build Tool (Fast HMR & Optimized Bundling)                     |
|  - Vanilla CSS Glassmorphism + Tailwind CSS Utility + Lucide Icons     |
|  - AppStateContext (Global Auth, Active Class & XP Sync)               |
+-------------------------------------------------------------------------+
                                    │
                                    │ HTTP / REST JSON (Sanctum Bearer)
                                    ▼
+-------------------------------------------------------------------------+
|                      BACKEND LAYER (Laravel 11 / 12)                    |
|  - RESTful API Controllers & Clean Architecture                         |
|  - Laravel Sanctum Authentication & Stateful Guards                    |
|  - CekPeranKelas Middleware & Gate Policies (Data Isolation)            |
|  - Eloquent ORM (Eager Loading, Cascade Handlers, Query Scopes)         |
+-------------------------------------------------------------------------+
                                    │
                                    │ PDO Connection (MySQL / MariaDB)
                                    ▼
+-------------------------------------------------------------------------+
|                       DATABASE LAYER (MySQL 8.0)                        |
|  - 12 Tabel Relasional (users, classes, mapel, materi, kuis, dll)      |
|  - Foreign Key Constraints & Cascade Referentials                      |
|  - Indexed Search Fields & Audit Activity Logs                          |
+-------------------------------------------------------------------------+
```

---

## 📁 Struktur Direktori Proyek

```plaintext
EduVerse/
├── Eduverse-Backend/               # Server RESTful API (Laravel)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # Auth, Class, Mapel, Materi, Kuis, Soal, Leaderboard
│   │   │   └── Middleware/        # CekPeranKelas (Otorisasi Akses Kelas)
│   │   └── Models/                # User, Kelas, AnggotaKelas, Materi, Kuis, dll
│   ├── database/
│   │   ├── migrations/            # 12 File Migrasi Skema Basis Data
│   │   └── seeders/               # Database Seeder (Demo Data)
│   ├── routes/
│   │   └── api.php                # Endpoint Katalog API EduVerse
│   └── .env.example
│
├── Eduverse-Frontend/              # Klien Antarmuka (React Single Page Application)
│   ├── src/
│   │   ├── assets/                # Aset Gambar, Logo, dan Gaya CSS
│   │   ├── components/            # Modal & Komponen Reusable (Navbar, Sidebar, Modals)
│   │   ├── context/               # AppStateContext (Penyimpan State Global)
│   │   ├── layouts/               # Layout Pembungkus Halaman
│   │   ├── pages/                 # Halaman Aplikasi (Main, Home, Quiz, Leaderboard, dll)
│   │   ├── routes/                # Konfigurasi Rute Aplikasi
│   │   └── services/              # authService & Integrasi API Helper
│   ├── package.json
│   └── vite.config.js
│
├── Dokumentasi_Aplikasi_EduVerse.md # Dokumentasi Lengkap & Buku Panduan Teknis
└── README.md                       # Ringkasan Proyek & Panduan Memulai
```

---

## 🛠️ Persyaratan Sistem (*Prerequisites*)

Pastikan lingkungan lokal Anda telah terpasang:
- **PHP**: `>= 8.2` (dengan ekstensi `pdo_mysql`, `mbstring`, `openssl`, `curl`)
- **Composer**: `>= 2.5`
- **Node.js**: `>= 18.x` atau `>= 20.x` (LTS)
- **npm**: `>= 9.x`
- **MySQL**: `>= 8.0` atau **MariaDB** `>= 10.5`

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Kloning Repositori
```bash
git clone https://github.com/refkyaja/EduVerse_PaAri.git
cd EduVerse_PaAri
```

### 2. Setup Backend (Laravel API)

1. Masuk ke direktori backend:
   ```bash
   cd Eduverse-Backend
   ```
2. Pasang pustaka dependensi PHP via Composer:
   ```bash
   composer install
   ```
3. Salin berkas lingkungan `.env`:
   ```bash
   cp .env.example .env
   ```
4. Buat kunci enkripsi aplikasi:
   ```bash
   php artisan key:generate
   ```
5. Siapkan basis data baru di MySQL (misal: `eduverse_db`):
   ```sql
   CREATE DATABASE eduverse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
6. Sesuaikan konfigurasi database pada berkas `.env`:
   ```ini
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=eduverse_db
   DB_USERNAME=root
   DB_PASSWORD=

   SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
   SESSION_DOMAIN=localhost
   ```
7. Eksekusi migrasi tabel dan data awal (*seeder*):
   ```bash
   php artisan migrate --seed
   ```
8. Jalankan server backend:
   ```bash
   php artisan serve --port=8000
   ```
   > Server backend akan berjalan pada `http://127.0.0.1:8000`.

---

### 3. Setup Frontend (React Vite)

1. Buka terminal baru dan masuk ke direktori frontend:
   ```bash
   cd Eduverse-Frontend
   ```
2. Pasang seluruh dependensi JavaScript:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
   > Aplikasi klien dapat diakses melalui peramban di `http://localhost:5173`.

---

## 📋 Matriks Hak Akses Peran (*Role Matrix*)

| Hak Akses / Fitur | Owner Kelas | Admin Kelas | Member Kelas |
| :--- | :---: | :---: | :---: |
| Mengubah Info & Kode Kelas | ✅ | ❌ | ❌ |
| Mengeluarkan Anggota (*Kick*) | ✅ | ❌ | ❌ |
| Promosi / Demosi Admin | ✅ | ❌ | ❌ |
| Hapus Ruang Kelas | ✅ | ❌ | ❌ |
| Menyetujui / Menolak Draf Materi | ✅ | ❌ | ❌ |
| Buat Materi (*Direct Publish*) | ✅ | ❌ | ❌ |
| Ajukan Draf Materi Baru | ✅ | ✅ | ❌ |
| Kelola Mapel & Bank Soal | ✅ | ✅ | ❌ |
| Rancang & Terbitkan Kuis | ✅ | ✅ | ❌ |
| Membaca Materi Terverifikasi | ✅ | ✅ | ✅ |
| Mengerjakan Kuis & Power-Up | ✅ | ✅ | ✅ |
| Melihat Peringkat Leaderboard | ✅ | ✅ | ✅ |

---

## 📡 Ringkasan Endpoint API Utama

| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Pendaftaran akun baru | Publik |
| `POST` | `/api/login` | Otentikasi pengguna & terbitkan token | Publik |
| `POST` | `/api/logout` | Revoke token aktif & hapus sesi | Auth |
| `GET` | `/api/classes` | Ambil daftar kelas yang diikuti | Auth |
| `POST` | `/api/classes` | Buat ruang kelas baru | Auth |
| `POST` | `/api/classes/join` | Gabung kelas via 6-karakter kode | Auth |
| `GET` | `/api/classes/{id}` | Ambil detail informasi kelas | Anggota |
| `POST` | `/api/classes/{id}/regenerate-code` | Acak ulang kode akses kelas | Owner |
| `GET` | `/api/classes/{id}/members` | Daftar seluruh anggota kelas | Anggota |
| `POST` | `/api/classes/{id}/members/{u}/promote` | Promosikan Member menjadi Admin | Owner |
| `GET` | `/api/classes/{id}/materi` | Daftar materi pembelajaran | Anggota |
| `POST` | `/api/classes/{id}/materi` | Buat / ajukan materi baru | Owner / Admin |
| `POST` | `/api/classes/{id}/materi-versi/{v}/verify` | Approve / Reject draf materi | Owner |
| `POST` | `/api/classes/{id}/soal/parse-teks` | Parsing teks soal format AI otomatis | Owner / Admin |
| `GET` | `/api/classes/{id}/kuis` | Katalog kuis yang tersedia | Anggota |
| `POST` | `/api/classes/{id}/kuis/{id}/submit` | Submit jawaban & kalkulasi skor/XP | Anggota |
| `GET` | `/api/classes/{id}/leaderboard` | Peringkat anggota berdasarkan XP | Anggota |

---

## 🧪 Format Prompt Generator Soal AI

Untuk menambahkan soal secara cepat menggunakan AI (ChatGPT, Claude, Gemini), salin format template berikut:

```text
Buatkan 5 soal pilihan ganda tentang [Topik Materi].
Gunakan format teks berikut secara persis tanpa modifikasi format:

1. [Pertanyaan soal]
A. [Pilihan A]
B. [Pilihan B]
C. [Pilihan C]
D. [Pilihan D]
E. [Pilihan E]
Jawaban: [Huruf A/B/C/D/E]
Pembahasan: [Penjelasan singkat jawaban benar]

(Pisahkan setiap butir soal dengan satu baris kosong)
```
*Tempel hasil respons AI ke dalam dialog `Impor Teks AI` pada tab Bank Soal EduVerse untuk konversi otomatis.*

---

## 👥 Kontributor & Ucapan Terima Kasih

Proyek ini dikembangkan oleh **Tim Pengembang EduVerse**:
- **Lead Architect & Fullstack Engineer**
- **Dosen & Pembimbing Akademik**

Terima kasih kepada seluruh kontributor dan pengguna yang telah berpartisipasi dalam pengujian serta pengembangan EduVerse.

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT License**. Lihat berkas [LICENSE](LICENSE) untuk informasi lebih lanjut.
