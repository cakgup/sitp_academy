# SITP Academy

Portal latihan OWASP Top 10:2025 yang berjalan sepenuhnya sebagai situs statis. Katalog, materi, 154 lab, hint, fixture runner, tabel respons, dan progres pengguna disimpan di browser sehingga dapat diterbitkan di GitHub Pages tanpa PHP atau SQLite.

## Menjalankan lokal

GitHub Pages dan browser tidak dapat memuat data JSON melalui file://. Jalankan server statis dari folder repo:

~~~~powershell
cd C:\Users\gufroni\Documents\GitHub\sitp_academy
python -m http.server 8080
~~~~

Buka http://localhost:8080/. Navigasi memakai hash route (#/category/..., #/topic/..., #/lab/...) sehingga tetap bekerja pada URL proyek GitHub Pages.

## Deploy ke GitHub Pages

Buat repo GitHub bernama sitp_academy, lalu push branch main. Workflow .github/workflows/pages.yml akan mengunggah seluruh isi repo dan menerbitkan situs melalui GitHub Pages Actions. Di pengaturan repository, pastikan Pages → Build and deployment → Source menggunakan GitHub Actions.

~~~~powershell
git remote add origin https://github.com/<akun>/sitp_academy.git
git branch -M main
git push -u origin main
~~~~

## Catatan keamanan dan data

Semua respons lab adalah fixture lokal yang diproses JavaScript. Progres dan nama profil disimpan di localStorage pada browser/perangkat masing-masing. Tidak ada koneksi ke host, shell, jaringan, upload executable, atau database.

Deployment publik menjaga payload XSS tetap sebagai teks yang di-escape. Ini mencegah halaman GitHub Pages menjalankan JavaScript dari input pengunjung; sink XSS yang benar-benar eksekutabel tetap berada pada portal PHP lokal untuk latihan terisolasi.

Data sumber diekspor dari portal PHP: 10 kategori, 33 topik, 144 materi, dan 154 lab (termasuk lab foundation).
