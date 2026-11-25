import type { Lang } from "@/lib/i18n/dictionary";
import type { PolicyDoc } from "@/lib/i18n/policy-render";

const ADDR = "Kopi Malay, 3, 13 Chomphon, Tambon Rahaeng, Mueang Tak District, Tak 63000, Thailand";

export const SHIPPING: Record<Lang, PolicyDoc> = {
  en: { title: "Shipping & Returns", blocks: [
    { p: "All orders are packed and dispatched from Tak, Thailand. We deliver within Malaysia and Thailand only." },
    { h: "Thailand" },
    { ul: ["Accessories, stickers, patches, magnets and apparel ship free.", "Tumblers weigh 292g each. THB 60 applies for the first kilogram of tumbler weight, plus THB 60 for every additional kilogram started."] },
    { h: "Peninsular Malaysia" },
    { ul: ["Jerseys & T-shirts: RM 20 for every block of 2 shirts.", "Tumblers: RM 20 for every block of 2 tumblers.", "Accessories (stickers, magnets, patches, lanyards, other merch): RM 20 for every block of 20 units.", "Big-item bonus: each block of 2 shirts or 2 tumblers ships up to 20 accessories free. Only accessories beyond that allowance are charged at RM 20 per block of 20 (e.g. 2 shirts + 20 stickers = RM 20; 2 shirts + 21 stickers = RM 40; 4 shirts + 40 stickers = RM 40)."] },
    { h: "Sabah & Sarawak" },
    { p: "The Peninsular Malaysia rate applies, plus a flat RM 10 surcharge once per order." },
    { h: "Order processing & daily cut-off" },
    { ul: ["Daily dispatch cut-off: 2:00 PM Thailand time (GMT+7) / 3:00 PM Malaysia time (GMT+8).", "Orders with payment verified before the cut-off are packed and handed to the courier the same day.", "Orders verified after the cut-off, or on courier public holidays, are dispatched on the next operating day."] },
    { h: "Delivery & tracking" },
    { ul: ["Malaysia (J&T Express): typically 5–10 working days.", "Thailand (Flash Express): typically 1–3 working days.", "You will receive a courier tracking number once your parcel is dispatched."] },
    { h: "Returns & exchanges" },
    { ul: ["Apparel sizes can be changed free in My Profile while an order is still \"Pending Verification\".", "After delivery we offer exchanges only, requested within 7 days on WhatsApp ({wa}). Items must be unused, unwashed and in original packaging.", "Report transit damage within 48 hours and defects within 7 days, with photos.", "The customer covers shipping both ways for size or change-of-mind exchanges; we cover it when the item was damaged, faulty or incorrect.", `Return address: ${ADDR}.`, "No store credit. Full details: [Refund, Return & Exchange Policy](/refund-policy)."] },
  ] },
  ms: { title: "Penghantaran & Pemulangan", blocks: [
    { p: "Semua pesanan dibungkus dan dihantar dari Tak, Thailand. Kami menghantar ke Malaysia dan Thailand sahaja." },
    { h: "Thailand" },
    { ul: ["Aksesori, pelekat, patch, magnet dan pakaian dihantar secara percuma.", "Setiap tumbler seberat 292g. Caj THB 60 dikenakan bagi kilogram pertama berat tumbler, serta THB 60 bagi setiap kilogram tambahan yang dimulakan."] },
    { h: "Semenanjung Malaysia" },
    { ul: ["Jersi & T-shirt: RM 20 bagi setiap blok 2 helai.", "Tumbler: RM 20 bagi setiap blok 2 unit.", "Aksesori (pelekat, magnet, patch, lanyard dan barangan lain): RM 20 bagi setiap blok 20 unit.", "Bonus barangan besar: setiap blok 2 helai baju atau 2 tumbler merangkumi sehingga 20 aksesori secara percuma. Hanya aksesori melebihi had tersebut dikenakan RM 20 bagi setiap blok 20 (cth. 2 baju + 20 pelekat = RM 20; 2 baju + 21 pelekat = RM 40; 4 baju + 40 pelekat = RM 40)."] },
    { h: "Sabah & Sarawak" },
    { p: "Kadar Semenanjung Malaysia terpakai, ditambah caj tetap RM 10 sekali bagi setiap pesanan." },
    { h: "Pemprosesan pesanan & masa tutup harian" },
    { ul: ["Masa tutup penghantaran harian: 2:00 petang waktu Thailand (GMT+7) / 3:00 petang waktu Malaysia (GMT+8).", "Pesanan yang pembayarannya disahkan sebelum masa tutup akan dibungkus dan diserahkan kepada kurier pada hari yang sama.", "Pesanan yang disahkan selepas masa tutup, atau pada cuti umum kurier, akan dihantar pada hari operasi berikutnya."] },
    { h: "Penghantaran & penjejakan" },
    { ul: ["Malaysia (J&T Express): lazimnya 5–10 hari bekerja.", "Thailand (Flash Express): lazimnya 1–3 hari bekerja.", "Anda akan menerima nombor penjejakan kurier sebaik sahaja bungkusan dihantar."] },
    { h: "Pemulangan & penukaran" },
    { ul: ["Saiz pakaian boleh ditukar secara percuma di Profil Saya selagi pesanan masih berstatus \"Pending Verification\".", "Selepas penghantaran, kami hanya menawarkan penukaran yang dimohon dalam tempoh 7 hari melalui WhatsApp ({wa}). Barangan mestilah belum digunakan, belum dibasuh dan dalam pembungkusan asal.", "Laporkan kerosakan semasa penghantaran dalam tempoh 48 jam dan kecacatan dalam tempoh 7 hari, berserta gambar.", "Pelanggan menanggung kos penghantaran dua hala bagi penukaran saiz atau pertukaran fikiran; kami menanggungnya jika barangan rosak, cacat atau tersalah hantar.", `Alamat pemulangan: ${ADDR}.`, "Tiada kredit kedai. Butiran penuh: [Polisi Bayaran Balik, Pemulangan & Penukaran](/refund-policy)."] },
  ] },
  th: { title: "การจัดส่งและการคืนสินค้า", blocks: [
    { p: "คำสั่งซื้อทั้งหมดแพ็กและจัดส่งจากจังหวัดตาก ประเทศไทย เราจัดส่งภายในประเทศมาเลเซียและประเทศไทยเท่านั้น" },
    { h: "ประเทศไทย" },
    { ul: ["อุปกรณ์เสริม สติกเกอร์ แพตช์ แม่เหล็ก และเสื้อผ้า จัดส่งฟรี", "แก้วทัมเบลอร์หนักใบละ 292 กรัม คิดค่าส่ง THB 60 สำหรับกิโลกรัมแรก และ THB 60 สำหรับทุกกิโลกรัมถัดไปที่เริ่มนับ"] },
    { h: "มาเลเซียคาบสมุทร" },
    { ul: ["เสื้อเจอร์ซีย์และเสื้อยืด: RM 20 ต่อทุก 2 ตัว", "แก้วทัมเบลอร์: RM 20 ต่อทุก 2 ใบ", "อุปกรณ์เสริม (สติกเกอร์ แม่เหล็ก แพตช์ สายคล้องคอ และสินค้าอื่น): RM 20 ต่อทุก 20 ชิ้น", "โบนัสสินค้าชิ้นใหญ่: เสื้อทุก 2 ตัวหรือแก้วทุก 2 ใบ ส่งอุปกรณ์เสริมได้ฟรีสูงสุด 20 ชิ้น ส่วนที่เกินคิด RM 20 ต่อทุก 20 ชิ้น (เช่น เสื้อ 2 ตัว + สติกเกอร์ 20 ชิ้น = RM 20; เสื้อ 2 ตัว + สติกเกอร์ 21 ชิ้น = RM 40; เสื้อ 4 ตัว + สติกเกอร์ 40 ชิ้น = RM 40)"] },
    { h: "ซาบาห์และซาราวัก" },
    { p: "ใช้อัตรามาเลเซียคาบสมุทร บวกค่าธรรมเนียมเพิ่ม RM 10 หนึ่งครั้งต่อคำสั่งซื้อ" },
    { h: "การดำเนินการและเวลาตัดรอบรายวัน" },
    { ul: ["เวลาตัดรอบจัดส่งรายวัน: 14:00 น. เวลาประเทศไทย (GMT+7) / 15:00 น. เวลามาเลเซีย (GMT+8)", "คำสั่งซื้อที่ยืนยันการชำระเงินก่อนเวลาตัดรอบ จะแพ็กและส่งมอบให้ขนส่งภายในวันเดียวกัน", "คำสั่งซื้อที่ยืนยันหลังเวลาตัดรอบ หรือในวันหยุดของบริษัทขนส่ง จะจัดส่งในวันทำการถัดไป"] },
    { h: "การจัดส่งและการติดตามพัสดุ" },
    { ul: ["มาเลเซีย (J&T Express): โดยปกติ 5–10 วันทำการ", "ไทย (Flash Express): โดยปกติ 1–3 วันทำการ", "คุณจะได้รับเลขพัสดุทันทีที่จัดส่งสินค้า"] },
    { h: "การคืนและเปลี่ยนสินค้า" },
    { ul: ["เปลี่ยนไซซ์เสื้อผ้าได้ฟรีที่ โปรไฟล์ของฉัน ขณะที่คำสั่งซื้อยังอยู่ในสถานะ \"Pending Verification\"", "หลังได้รับสินค้า เรารับเปลี่ยนสินค้าเท่านั้น โดยแจ้งภายใน 7 วันทาง WhatsApp ({wa}) สินค้าต้องไม่ผ่านการใช้งาน ไม่ผ่านการซัก และอยู่ในบรรจุภัณฑ์เดิม", "แจ้งความเสียหายจากการขนส่งภายใน 48 ชั่วโมง และสินค้าชำรุดภายใน 7 วัน พร้อมรูปถ่าย", "ลูกค้ารับผิดชอบค่าส่งไป-กลับกรณีเปลี่ยนไซซ์หรือเปลี่ยนใจ เรารับผิดชอบกรณีสินค้าเสียหาย ชำรุด หรือส่งผิด", `ที่อยู่สำหรับคืนสินค้า: ${ADDR}`, "ไม่มีเครดิตร้านค้า รายละเอียดทั้งหมด: [นโยบายการคืนเงิน คืนสินค้า และเปลี่ยนสินค้า](/refund-policy)"] },
  ] },
};
