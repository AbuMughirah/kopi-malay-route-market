// Browser-safe UI dictionary. Product names, prices and order statuses stay untranslated (Loyverse/receipt alignment).
export const LANGS = ["en", "ms", "th"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { en: "EN", ms: "BM", th: "ไทย" };
export const LANG_NAME: Record<Lang, string> = { en: "English", ms: "Bahasa Melayu", th: "ภาษาไทย" };
export const LANG_STORAGE_KEY = "km_lang";

const en = {
  "nav.shop": "Shop", "nav.services": "Services", "nav.towing": "Towing & Rescue", "nav.contact": "Contact us",
  "nav.track": "Track order", "nav.trackMine": "Track my order", "nav.admin": "Admin", "nav.adminDashboard": "Admin dashboard",
  "nav.menu": "Menu", "nav.language": "Language",
  "cat.all": "Shop All", "cat.jerseys-t-shirts": "Jerseys & T-shirts", "cat.stickers": "Stickers", "cat.tumblers": "Tumblers",
  "cat.fridge-magnets": "Fridge Magnets", "cat.patches": "Patches", "cat.lanyard": "Lanyard", "cat.other-merch": "Other Merch",
  "header.search": "Search", "header.searchPlaceholder": "Search stickers, jerseys, tumblers…", "header.wishlist": "Wishlist",
  "header.account": "Account", "header.login": "Login", "header.profile": "My profile", "header.signOut": "Sign out",
  "header.openCart": "Open cart", "header.signedInAs": "Signed in as",
  "marquee": "Register To Be A Member Today To Receive Special Offer!",
  "footer.tagline": "Crafted with care, made to perfection", "footer.backToTop": "Back to top",
  "footer.legal": "Legal", "footer.social": "Social", "footer.contact": "Contact", "footer.office": "office",
  "footer.privacy": "Privacy Policy", "footer.accessibility": "Accessibility Statement", "footer.terms": "Terms & Conditions",
  "footer.refund": "Refund Policy", "footer.shipping": "Shipping & Returns", "footer.faq": "FAQ",
  "footer.contactUs": "Contact Us", "footer.track": "Track Your Order", "footer.rights": "CRAFTED WITH CARE, MADE TO PERFECTION.",
  "cart.title": "Your Cart", "cart.empty": "Your cart is empty.", "cart.startShopping": "Start shopping", "cart.size": "Size",
  "cart.decrease": "Decrease", "cart.increase": "Increase", "cart.remove": "Remove", "cart.subtotal": "Subtotal",
  "cart.note": "Malaysia pays in RM, Thailand pays in THB. Shipping and bundle discounts are calculated at checkout.",
  "cart.checkout": "Checkout",
} as const;
export type MsgKey = keyof typeof en;

const ms: Record<MsgKey, string> = {
  "nav.shop": "Kedai", "nav.services": "Perkhidmatan", "nav.towing": "Tunda & Bantuan", "nav.contact": "Hubungi kami",
  "nav.track": "Jejak pesanan", "nav.trackMine": "Jejak pesanan saya", "nav.admin": "Admin", "nav.adminDashboard": "Papan pemuka admin",
  "nav.menu": "Menu", "nav.language": "Bahasa",
  "cat.all": "Semua Produk", "cat.jerseys-t-shirts": "Jersi & T-shirt", "cat.stickers": "Pelekat", "cat.tumblers": "Tumbler",
  "cat.fridge-magnets": "Magnet Peti Sejuk", "cat.patches": "Patch", "cat.lanyard": "Lanyard", "cat.other-merch": "Barangan Lain",
  "header.search": "Cari", "header.searchPlaceholder": "Cari pelekat, jersi, tumbler…", "header.wishlist": "Senarai hajat",
  "header.account": "Akaun", "header.login": "Log masuk", "header.profile": "Profil saya", "header.signOut": "Log keluar",
  "header.openCart": "Buka troli", "header.signedInAs": "Log masuk sebagai",
  "marquee": "Daftar Sebagai Ahli Hari Ini Untuk Menerima Tawaran Istimewa!",
  "footer.tagline": "Dihasilkan dengan teliti, dibuat dengan sempurna", "footer.backToTop": "Kembali ke atas",
  "footer.legal": "Perundangan", "footer.social": "Media Sosial", "footer.contact": "Hubungi", "footer.office": "pejabat",
  "footer.privacy": "Dasar Privasi", "footer.accessibility": "Penyata Kebolehcapaian", "footer.terms": "Terma & Syarat",
  "footer.refund": "Dasar Bayaran Balik", "footer.shipping": "Penghantaran & Pemulangan", "footer.faq": "Soalan Lazim",
  "footer.contactUs": "Hubungi Kami", "footer.track": "Jejak Pesanan Anda", "footer.rights": "DIHASILKAN DENGAN TELITI, DIBUAT DENGAN SEMPURNA.",
  "cart.title": "Troli Anda", "cart.empty": "Troli anda kosong.", "cart.startShopping": "Mula membeli-belah", "cart.size": "Saiz",
  "cart.decrease": "Kurangkan", "cart.increase": "Tambah", "cart.remove": "Buang", "cart.subtotal": "Jumlah kecil",
  "cart.note": "Malaysia dibayar dalam RM, Thailand dalam THB. Caj penghantaran dan diskaun pakej dikira semasa pembayaran.",
  "cart.checkout": "Bayar",
};

const th: Record<MsgKey, string> = {
  "nav.shop": "ร้านค้า", "nav.services": "บริการ", "nav.towing": "รถยกและช่วยเหลือ", "nav.contact": "ติดต่อเรา",
  "nav.track": "ติดตามคำสั่งซื้อ", "nav.trackMine": "ติดตามคำสั่งซื้อของฉัน", "nav.admin": "ผู้ดูแล", "nav.adminDashboard": "แดชบอร์ดผู้ดูแล",
  "nav.menu": "เมนู", "nav.language": "ภาษา",
  "cat.all": "สินค้าทั้งหมด", "cat.jerseys-t-shirts": "เสื้อเจอร์ซีย์และเสื้อยืด", "cat.stickers": "สติกเกอร์", "cat.tumblers": "แก้วเก็บความเย็น",
  "cat.fridge-magnets": "แม่เหล็กติดตู้เย็น", "cat.patches": "อาร์มติดเสื้อ", "cat.lanyard": "สายคล้องคอ", "cat.other-merch": "สินค้าอื่นๆ",
  "header.search": "ค้นหา", "header.searchPlaceholder": "ค้นหาสติกเกอร์ เสื้อ แก้ว…", "header.wishlist": "รายการโปรด",
  "header.account": "บัญชี", "header.login": "เข้าสู่ระบบ", "header.profile": "โปรไฟล์ของฉัน", "header.signOut": "ออกจากระบบ",
  "header.openCart": "เปิดตะกร้า", "header.signedInAs": "เข้าสู่ระบบในชื่อ",
  "marquee": "สมัครสมาชิกวันนี้ รับข้อเสนอพิเศษ!",
  "footer.tagline": "ใส่ใจทุกขั้นตอน ประณีตทุกชิ้นงาน", "footer.backToTop": "กลับขึ้นด้านบน",
  "footer.legal": "ข้อกฎหมาย", "footer.social": "โซเชียล", "footer.contact": "ติดต่อ", "footer.office": "สำนักงาน",
  "footer.privacy": "นโยบายความเป็นส่วนตัว", "footer.accessibility": "การเข้าถึงเว็บไซต์", "footer.terms": "ข้อกำหนดและเงื่อนไข",
  "footer.refund": "นโยบายการคืนเงิน", "footer.shipping": "การจัดส่งและการคืนสินค้า", "footer.faq": "คำถามที่พบบ่อย",
  "footer.contactUs": "ติดต่อเรา", "footer.track": "ติดตามคำสั่งซื้อ", "footer.rights": "ใส่ใจทุกขั้นตอน ประณีตทุกชิ้นงาน",
  "cart.title": "ตะกร้าของคุณ", "cart.empty": "ตะกร้าของคุณว่างเปล่า", "cart.startShopping": "เริ่มช้อปปิ้ง", "cart.size": "ไซซ์",
  "cart.decrease": "ลดจำนวน", "cart.increase": "เพิ่มจำนวน", "cart.remove": "ลบ", "cart.subtotal": "ยอดรวม",
  "cart.note": "ลูกค้ามาเลเซียชำระเป็น RM ลูกค้าไทยชำระเป็น THB ค่าจัดส่งและส่วนลดชุดคำนวณตอนชำระเงิน",
  "cart.checkout": "ชำระเงิน",
};

export const DICT: Record<Lang, Record<MsgKey, string>> = { en, ms, th };
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);
export const translate = (lang: Lang, key: MsgKey) => DICT[lang][key] ?? en[key];
