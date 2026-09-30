# Invo Executive AI Copilot (Telegram Assistant) 🤖📈

Asisten AI Eksekutif berbasis Telegram untuk Pemilik Bisnis (**Owner**) sistem **Invo POS & FIFO Inventory Management**. Ditenagai oleh **Google Gemini AI** dengan **Function Calling / Tool Use** untuk menyajikan analisis finansial akurat, audit modal tertahan (*tied-up capital*), dan rekomendasi aksi bisnis langsung ke Telegram Anda secara *real-time*.

---

## 🌟 Fitur Utama

1. **📊 Analisis Finansial Real-Time (`getFinancialSummary`):**
   - Menghitung Omzet, HPP FIFO (COGS), Beban Operasional, Laba Kotor, dan Laba Bersih secara akurat tanpa halusinasi data.
   - Fleksibilitas periode: *Hari ini, Kemarin, Minggu ini, Bulan ini, atau Keseluruhan (All-time)*.
2. **⏳ Audit Inventori FIFO & Dead Stock (`getFIFOInventoryAudit`):**
   - Mendeteksi batch barang yang mengendap lama (*dead stock*) berdasarkan tanggal kedatangan.
   - Menghitung nilai modal kerja riil (Rp) yang tertahan pada batch-batch tersebut.
3. **📦 Status Dual-Mode Stok & Multi-Unit (`getStockStatus`):**
   - Memantau kapasitas barang di *Floating Pool* (stok bebas gudang) vs *Physical Allocation* (kuota siap jual di rak display).
   - Memeriksa kapasitas produksi paket hampers / bundling berbasis item *bottleneck*.
4. **💡 Rekomendasi Bisnis Proaktif (`getBusinessRecommendations`):**
   - Rekomendasi peralihan kuota stok ke promo repackage.
   - Peringatan dini stok menipis sebelum kehabisan di toko.
   - Rekomendasi restock komponen pembatas bundling.
5. **🔒 Keamanan Whitelist Telegram:**
   - Hanya nomor Telegram User ID Owner yang terdaftar di `.env` yang dapat mengakses bot. Pesan dari pihak asing akan otomatis ditolak.

---

## 🔑 Panduan Lengkap Mendapatkan Kredensial

Sebelum menjalankan chatbot, Anda memerlukan 3 kredensial utama yang semuanya dapat diperoleh secara **100% GRATIS**:

```
+---------------------+-------------------------------+----------------------------------------+
| Kredensial          | Sumber                        | Format Contoh                          |
+---------------------+-------------------------------+----------------------------------------+
| TELEGRAM_BOT_TOKEN  | @BotFather di Telegram        | xx...   |
| TELEGRAM_OWNER_ID   | @userinfobot di Telegram      | xx                     |
| GEMINI_API_KEY      | Google AI Studio              | xx.     |
+---------------------+-------------------------------+----------------------------------------+
```

---

### 1. Cara Mendapatkan `TELEGRAM_BOT_TOKEN`
Token ini berfungsi sebagai "kunci akses" program untuk mengendalikan bot Telegram Anda:

1. Buka aplikasi **Telegram** di smartphone atau laptop Anda.
2. Di kolom pencarian (*Search*), ketik **`@BotFather`** (pastikan akun resmi bertanda centang biru) atau klik tautan: [https://t.me/BotFather](https://t.me/BotFather).
3. Klik tombol **`Start`** atau kirim pesan `/start`.
4. Kirim perintah:
   ```text
   /newbot
   ```
5. BotFather akan meminta **Nama Tampilan Bot** (Display Name).  
   *Contoh masukan:* `Invo Executive Assistant` atau `Toko Jendral Bot`.
6. BotFather akan meminta **Username Bot** (harus unik dan berakhiran kata `bot` atau `_bot`).  
   *Contoh masukan:* `TokoJendralBot` atau `InvoAssistant_bot`.
7. Setelah berhasil, BotFather akan mengirimkan pesan konfirmasi berisi **HTTP API Token**.  
   *Contoh token:* `xx`
8. Salin (*copy*) token tersebut untuk dimasukkan ke file `.env`.

---

### 2. Cara Mendapatkan `TELEGRAM_OWNER_ID`
Telegram User ID adalah nomor identitas unik akun Telegram pribadi Anda. Bot menggunakan nomor ini sebagai **sistem keamanan (whitelist)** agar hanya Anda (sang Owner) yang bisa melihat laporan rahasia keuangan toko:

1. Buka aplikasi **Telegram**.
2. Di kolom pencarian (*Search*), cari bot **`@userinfobot`** atau klik tautan: [https://t.me/userinfobot](https://t.me/userinfobot).
3. Klik tombol **`Start`** atau kirim pesan apapun ke bot tersebut.
4. Bot akan langsung membalas dengan rincian profil Anda:
   ```text
   @userinfobot
   Id: 1284192524
   First: Budi
   Last: Santoso
   Lang: id
   ```
5. Salin nomor yang ada di baris **`Id:`** (contoh di atas: `xx`).
6. Nomor ini yang menjadi nilai untuk `TELEGRAM_OWNER_ID`.

---

### 3. Cara Mendapatkan `GEMINI_API_KEY` (Gratis Tanpa Kartu Kredit)
API Key ini digunakan agar asisten memiliki kecerdasan buatan untuk memahami pertanyaan bebas dan memanggil tool database:

1. Buka browser dan kunjungi **Google AI Studio**:  
   👉 **[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Login menggunakan akun Google / Gmail Anda.
3. Di dashboard, klik tombol biru **`Create API key`** (atau `Get API key`).
4. Pilih opsi **`Create API key in new project`** (atau pilih project Google Cloud yang sudah ada).
5. Tunggu beberapa detik, sebuah kunci API akan muncul (diawali dengan teks `AIzaSy...`).
6. Klik ikon **Copy** untuk menyalin API key tersebut.

> [!TIP]
> **Kuota Gratis (*Free Tier*):**  
> Google memberikan kuota gratis hingga 15 request per menit dan 1.500 request per hari tanpa perlu mendaftarkan kartu kredit, sangat mencukupi untuk asisten harian Owner toko.

---

## ⚙️ Konfigurasi File `.env`

Buat atau edit file bernama `.env` di folder root `d:\ChatBOT\` dan isi ketiga kredensial di atas:

```env
# 1. Token Bot dari @BotFather
TELEGRAM_BOT_TOKEN=xx

# 2. Telegram User ID Anda dari @userinfobot
TELEGRAM_OWNER_ID=xx

# 3. Google Gemini API Key dari Google AI Studio
GEMINI_API_KEY=xx

# 4. Model Gemini (Direkomendasikan: gemini-3.5-flash-lite untuk respon instan)
GEMINI_MODEL=gemini-3.5-flash-lite

# 5. Lokasi Database SQLite POS Invo
POS_DB_PATH=d:/POS/database/pos.db
```

---

## 🚀 Tutorial Menjalankan Chatbot

Buka terminal (PowerShell / Command Prompt) di folder `d:\ChatBOT\`:

### Langkah 1: Install Dependensi (Jika baru pertama kali)
```bash
npm install
```

### Langkah 2: Verifikasi Koneksi Database POS
Periksa apakah bot dapat membaca data SQLite dari POS Invo secara aman (*read-only*):
```bash
npm run test:tools
```
*Jika sukses, Anda akan melihat data ringkasan omzet, modal tertahan batch, dan daftar stok barang.*

### Langkah 3: Uji Coba Demonstrasi Output
Jalankan simulasi otomatis untuk melihat format balasan pesan yang disiapkan untuk Telegram:
```bash
npm run demo
```

### Langkah 4: Uji Coba Chat via Terminal (CLI Simulation)
Anda dapat menguji respon AI langsung dari terminal sebelum membuka Telegram:
```bash
npm run simulate
```
*Ketik pertanyaan seperti `Berapa omzet hari ini?` atau ketik `exit` untuk keluar.*

### Langkah 5: Menjalankan Bot Telegram (Live)
Jalankan bot untuk mulai menerima pesan dari aplikasi Telegram Anda:
```bash
npm start
```
Atau jika Anda sedang mengedit kode dan ingin bot otomatis restart saat file disimpan:
```bash
npm run dev
```

Ketika muncul tulisan:
```text
✨ Bot berhasil online sebagai @TokoJendralBot!
💬 Siap menerima pesan dari Owner.
```
Maka bot Anda telah resmi aktif dan siap diajak berbicara di Telegram!

---

## 💬 Cara Berinteraksi dengan Bot di Telegram

1. Buka aplikasi Telegram Anda di HP atau Desktop.
2. Cari bot Anda melalui username-nya (misal: `@TokoJendralBot`).
3. Klik tombol **`START`** (atau kirim pesan `/start`).
4. Gunakan **Menu Cepat** di papan ketik atau ketik pertanyaan langsung:
   * 📊 **"Omzet & Laba Hari Ini"** → Bot menyajikan omzet, HPP FIFO, beban, dan laba bersih hari ini.
   * 📈 **"Performa All-Time"** → Bot merangkum akumulasi total penjualan dan laba sejak toko buka.
   * 📦 **"Cek Stok Barang"** → Bot memeriksa sisa stok gudang (Floating) vs kemasan siap jual di rak (Allocated).
   * 💡 **"Saran Bisnis & Promo"** → Bot menganalisis peluang diskon bundling atau pencegahan dead stock.
   * ⏳ **"Audit Dead Stock FIFO"** → Bot mendata batch-batch tua dan nilai rupiah modal yang mengendap.
5. Anda juga bebas bertanya santai:
   * *"Berapa laba bersih kita minggu ini?"*
   * *"Kacamata masih sisa berapa pcs di gudang?"*
   * *"Barang apa yang paling lambat mutasinya?"*

---

## 🛡️ Model Keamanan (Security)

* **Read-Only Database Access:** Layanan chatbot hanya membuka database SQLite dalam mode `readonly: true`. Bot tidak memiliki izin untuk mengubah, menghapus, atau memanipulasi data transaksi kasir.
* **Whitelist Owner ID:** Setiap pesan yang masuk ke bot akan diverifikasi terhadap `TELEGRAM_OWNER_ID`. Jika ada akun Telegram lain yang mencoba mengirim chat, bot akan langsung menolak dan tidak akan memicu eksekusi query data finansial.

---

## 📂 Struktur Project

```text
d:\ChatBOT\
├── ai\
│   ├── agent.js             # Engine integrasi Gemini & loop function calling
│   └── tools.js             # Deklarasi tools & dispatcher eksekusi query
├── db\
│   ├── knex.js              # Koneksi read-only SQLite ke pos.db
│   └── queries.js           # Fungsi analitik finansial, audit FIFO, & stok
├── tests\
│   ├── demo-responses.js    # Simulasi visual respon bot
│   ├── simulate-chat.js     # CLI simulator interaktif
│   ├── test-ai.js           # Unit test koneksi Gemini live API
│   └── test-tools.js        # Unit test query analitik database
├── .env                     # Kredensial rahasia (Token, ID, API Key)
├── .env.example             # Template konfigurasi kredensial
├── .gitignore               # Daftar file yang diabaikan git
├── bot.js                   # Setup framework grammY & security middleware
├── index.js                 # Entrypoint server & diagnostik startup
├── package.json             # Dependensi & script perintah
├── README.md                # Dokumentasi panduan lengkap
└── spec.md                  # Dokumen spesifikasi teknis (SPEC-001)
```
