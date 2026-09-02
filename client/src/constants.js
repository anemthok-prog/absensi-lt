// Daftar kelas MTsN 1 Kebumen: 7A-7J, 8A-8J, 9A-9J (30 rombel)
export const KELAS_LIST = [7, 8, 9].flatMap(grade =>
  'ABCDEFGHIJ'.split('').map(letter => `${grade}${letter}`)
)

export const SHIFT_LIST = [
  { value: 'siang', label: 'Siang' },
  { value: 'malam', label: 'Malam' },
]

export const STATUS_LIST = [
  { value: 'hadir', label: 'Hadir' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'izin', label: 'Izin' },
  { value: 'alpa', label: 'Alpa' },
]

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
