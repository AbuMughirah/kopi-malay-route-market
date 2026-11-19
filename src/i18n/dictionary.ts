export const LANGS = ["en", "ms", "th"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { en: "EN", ms: "BM", th: "ไทย" };
export const LANG_NAME: Record<Lang, string> = { en: "English", ms: "Bahasa Melayu", th: "ภาษาไทย" };

const en = {
  "nav.shop": "Shop", "nav.services": "Services", "nav.contact": "Contact us", "nav.track": "Track order",
  "nav.trackMine": "Track my order", "nav.admin": "Admin", "nav.adminDash": "Admin dashboard", "nav.towing": "Towing & Rescue",
  "nav.shopAll": "Shop All", "nav.jerseys": "Jerseys & T-shirts", "nav.stickers": "Stickers", "nav.tumblers": "Tumblers",
  "nav.magnets": "Fridge Magnets", "nav.patches": "Patches", "nav.lanyard": "Lanyard", "nav.other": "Other Merch",
  "nav.login": "Login", "nav.account": "Account", "nav.profile": "My profile", "nav.signOut": "Sign out",
  "nav.search": "Search", "nav.searchPh": "Search stickers, jerseys, tumblers…", "nav.menu": "Menu", "nav.cart": "Open cart",
  "nav.wishlist": "Wishlist", "nav.language": "Language",
  "marquee": "Register To Be A Member Today To Receive Special Offer!",
  "footer.tagline": "Crafted with care, made to perfection", "footer.legal": "Legal", "footer.social": "Social",
  "footer.contact": "Contact", "footer.office": "office", "footer.top": "Back to top",
  "footer.privacy": "Privacy Policy", "footer.access": "Accessibility Statement", "footer.terms": "Terms & Conditions",
  "footer.refund": "Refund Policy", "footer.shipping": "Shipping & Returns", "footer.faq": "FAQ",
};
export type Key = keyof typeof en;

const ms: Record<Key, string> = {
  "nav.shop": "Kedai", "nav.services": "Perkhidmatan", "nav.contact": "Hubungi kami", "nav.track": "Jejak pesanan",
  "nav.trackMine": "Jejak pesanan saya", "nav.admin": "Pentadbir", "nav.adminDash": "Papan pemuka pentadbir", "nav.towing": "Tunda & Bantuan",
  "nav.shopAll": "Semua Produk", "nav.jerseys": "Jersi & Kemeja-T", "nav.stickers": "Pelekat", "nav.tumblers": "Tumbler",
  "nav.magnets": "Magnet Peti Sejuk", "nav.patches": "Lencana Jahit", "nav.lanyard": "Tali Leher", "nav.other": "Barangan Lain",
  "nav.login": "Log masuk", "nav.account": "Akaun", "nav.profile": "Profil saya", "nav.signOut": "Log keluar",
  "nav.search": "Cari", "nav.searchPh": "Cari pelekat, jersi, tumbler…", "nav.menu": "Menu", "nav.cart": "Buka troli",
  "nav.wishlist": "Senarai hajat", "nav.language": "Bahasa",
  "marquee": "Daftar Sebagai Ahli Hari Ini Untuk Menerima Tawaran Istimewa!",
  "footer.tagline": "Dihasilkan dengan teliti, disempurnakan dengan cermat", "footer.legal": "Perundangan", "footer.social": "Media Sosial",
  "footer.contact": "Hubungi", "footer.office": "pejabat", "footer.top": "Kembali ke atas",
  "footer.privacy": "Dasar Privasi", "footer.access": "Pernyataan Kebolehcapaian", "footer.terms": "Terma & Syarat",
  "footer.refund": "Dasar Bayaran Balik", "footer.shipping": "Penghantaran & Pemulangan", "footer.faq": "Soalan Lazim",
};

const th: Record<Key, string> = {
  "nav.shop": "ร้านค้า", "nav.services": "บริการ", "nav.contact": "ติดต่อเรา", "nav.track": "ติดตามคำสั่งซื้อ",
  "nav.trackMine": "ติดตามคำสั่งซื้อของฉัน", "nav.admin": "ผู้ดูแล", "nav.adminDash": "แดชบอร์ดผู้ดูแล", "nav.towing": "บริการรถยกและช่วยเหลือ",
  "nav.shopAll": "สินค้าทั้งหมด", "nav.jerseys": "เสื้อเจอร์ซีย์และเสื้อยืด", "nav.stickers": "สติกเกอร์", "nav.tumblers": "แก้วเก็บความเย็น",
  "nav.magnets": "แม่เหล็กติดตู้เย็น", "nav.patches": "อาร์มผ้า", "nav.lanyard": "สายคล้องคอ", "nav.other": "สินค้าอื่น ๆ",
  "nav.login": "เข้าสู่ระบบ", "nav.account": "บัญชี", "nav.profile": "โปรไฟล์ของฉัน", "nav.signOut": "ออกจากระบบ",
  "nav.search": "ค้นหา", "nav.searchPh": "ค้นหาสติกเกอร์ เสื้อ แก้ว…", "nav.menu": "เมนู", "nav.cart": "เปิดตะกร้าสินค้า",
  "nav.wishlist": "รายการโปรด", "nav.language": "ภาษา",
  "marquee": "สมัครสมาชิกวันนี้ เพื่อรับสิทธิพิเศษ!",
  "footer.tagline": "ใส่ใจทุกขั้นตอน สมบูรณ์แบบทุกชิ้นงาน", "footer.legal": "ข้อกฎหมาย", "footer.social": "โซเชียลมีเดีย",
  "footer.contact": "ติดต่อ", "footer.office": "สำนักงาน", "footer.top": "กลับขึ้นด้านบน",
  "footer.privacy": "นโยบายความเป็นส่วนตัว", "footer.access": "การเข้าถึงเว็บไซต์", "footer.terms": "ข้อกำหนดและเงื่อนไข",
  "footer.refund": "นโยบายการคืนเงิน", "footer.shipping": "การจัดส่งและการคืนสินค้า", "footer.faq": "คำถามที่พบบ่อย",
};

export const DICT: Record<Lang, Record<Key, string>> = { en, ms, th };
export const translate = (lang: Lang, key: Key) => DICT[lang][key] ?? en[key];
