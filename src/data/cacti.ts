import cactus1Top from "@/assets/cactus-1-top.jpg";
import cactus1Side1 from "@/assets/cactus-1-side1.jpg";
import cactus1Side2 from "@/assets/cactus-1-side2.jpg";
import cactus1Side3 from "@/assets/cactus-1-side3.jpg";
import cactus2Top from "@/assets/cactus-2-top.jpg";
import cactus2Side1 from "@/assets/cactus-2-side1.jpg";

export interface CactusItem {
  id: string;
  name: string;
  family: string;
  size: string;
  price: number;
  growType: "ไม้เมล็ด" | "ไม้กราฟ";
  description: string;
  images: {
    top: string;
    side1: string;
    side2: string;
    side3: string;
  };
}

export const cactiData: CactusItem[] = [
  {
    id: "1",
    name: "Astrophytum asterias",
    family: "Cactaceae",
    size: "5 cm",
    price: 1500,
    growType: "ไม้เมล็ด",
    description: "แอสโตรไฟตัม แอสทีเรียส หรือที่เรียกว่า 'ซีอุรชิน แคคตัส' เป็นกระบองเพชรที่มีลักษณะกลมแบน มีซี่โครง 8 ซี่ ลำต้นสีเขียวเข้ม มีจุดขาวกระจายอยู่ทั่ว เป็นกระบองเพชรที่หายากและเป็นที่นิยมสะสมอย่างมาก เหมาะสำหรับผู้ที่ชื่นชอบไม้แคคตัสหายาก",
    images: { top: cactus1Top.src, side1: cactus1Side1.src, side2: cactus1Side2.src, side3: cactus1Side3.src },
  },
  {
    id: "2",
    name: "Gymnocalycium mihanovichii",
    family: "Cactaceae",
    size: "4 cm",
    price: 850,
    growType: "ไม้กราฟ",
    description: "ยิมโนคาลิเซียม มิฮาโนวิชิอาย เป็นกระบองเพชรขนาดเล็กที่มีลำต้นทรงกลม มีสีสันสวยงาม มักนิยมนำมากราฟกับตอเพื่อให้เจริญเติบโตได้ดี เป็นที่นิยมมากในหมู่นักสะสม",
    images: { top: cactus2Top.src, side1: cactus2Side1.src, side2: cactus1Side2.src, side3: cactus1Side3.src },
  },
  {
    id: "3",
    name: "Lophophora williamsii",
    family: "Cactaceae",
    size: "6 cm",
    price: 3500,
    growType: "ไม้เมล็ด",
    description: "โลโฟฟอรา วิลเลียมซิอาย หรือ 'เพโยเต้' เป็นกระบองเพชรที่ไม่มีหนาม มีลำต้นกลมแบนสีเขียวอมฟ้า ผิวเรียบ เจริญเติบโตช้า เป็นกระบองเพชรที่หายากและมีมูลค่าสูงมาก",
    images: { top: cactus1Side3.src, side1: cactus1Top.src, side2: cactus2Top.src, side3: cactus1Side1.src },
  },
  {
    id: "4",
    name: "Ariocarpus retusus",
    family: "Cactaceae",
    size: "8 cm",
    price: 5200,
    growType: "ไม้เมล็ด",
    description: "อะริโอคาร์ปัส เรทูซัส เป็นกระบองเพชรที่มีลักษณะเฉพาะตัวมาก มีใบรูปสามเหลี่ยมเรียงซ้อนกันเป็นดอกกุหลาบ เจริญเติบโตช้ามาก ต้องใช้เวลาหลายปีกว่าจะโตเต็มวัย",
    images: { top: cactus1Side2.src, side1: cactus1Side3.src, side2: cactus2Side1.src, side3: cactus1Top.src },
  },
  {
    id: "5",
    name: "Turbinicarpus valdezianus",
    family: "Cactaceae",
    size: "3 cm",
    price: 2800,
    growType: "ไม้เมล็ด",
    description: "เทอร์บินิคาร์ปัส วัลเดเซียนัส เป็นกระบองเพชรขนาดจิ๋วที่มีหนามเป็นขนนกสวยงาม ดอกสีชมพูอมม่วง เป็นสายพันธุ์ที่หายากและใกล้สูญพันธุ์ในธรรมชาติ",
    images: { top: cactus2Side1.src, side1: cactus2Top.src, side2: cactus1Side1.src, side3: cactus1Side2.src },
  },
  {
    id: "6",
    name: "Copiapoa cinerea",
    family: "Cactaceae",
    size: "10 cm",
    price: 4500,
    growType: "ไม้เมล็ด",
    description: "โคเปียโปอา ซิเนเรีย เป็นกระบองเพชรจากทะเลทรายชิลี มีลำต้นสีเทาเงินอมฟ้า ทนแล้งได้ดีเยี่ยม เจริญเติบโตช้า เป็นที่ต้องการอย่างมากในตลาดนักสะสม",
    images: { top: cactus1Top.src, side1: cactus2Side1.src, side2: cactus1Side3.src, side3: cactus2Top.src },
  },
];

export const blogPosts = [
  {
    id: "1",
    title: "วิธีดูแลกระบองเพชรสำหรับมือใหม่",
    excerpt: "เรียนรู้พื้นฐานการดูแลกระบองเพชรตั้งแต่การรดน้ำ การให้แสง ไปจนถึงการเปลี่ยนกระถาง",
    date: "15 มี.ค. 2026",
    content: "กระบองเพชรเป็นพืชที่ดูแลง่าย แต่ก็ต้องการความใส่ใจในบางจุด สิ่งสำคัญที่สุดคือการรดน้ำ ควรรดน้ำเมื่อดินแห้งสนิทแล้วเท่านั้น ปกติประมาณ 1-2 สัปดาห์ต่อครั้ง ขึ้นอยู่กับสภาพอากาศ ควรวางในที่ที่ได้รับแสงแดดอย่างน้อย 4-6 ชั่วโมงต่อวัน และใช้ดินผสมที่ระบายน้ำได้ดี",
  },
  {
    id: "2",
    title: "การกราฟกระบองเพชร: คู่มือฉบับสมบูรณ์",
    excerpt: "ทำความเข้าใจเทคนิคการกราฟกระบองเพชร ทำไมต้องกราฟ และวิธีทำให้สำเร็จ",
    date: "10 มี.ค. 2026",
    content: "การกราฟเป็นเทคนิคการขยายพันธุ์โดยนำส่วนบนของกระบองเพชรสายพันธุ์หนึ่งไปติดบนตอของอีกสายพันธุ์ ข้อดีคือช่วยให้ต้นไม้เจริญเติบโตเร็วขึ้น และสามารถเลี้ยงสายพันธุ์ที่ไม่มีคลอโรฟิลล์ได้",
  },
  {
    id: "3",
    title: "สายพันธุ์กระบองเพชรหายากที่ควรรู้จัก",
    excerpt: "รวมสายพันธุ์กระบองเพชรหายากที่เป็นที่ต้องการของนักสะสมทั่วโลก",
    date: "5 มี.ค. 2026",
    content: "โลกของกระบองเพชรมีสายพันธุ์มากมายที่หายากและมีมูลค่าสูง ไม่ว่าจะเป็น Astrophytum asterias, Ariocarpus, Lophophora หรือ Copiapoa ซึ่งแต่ละสายพันธุ์มีเสน่ห์และความงามที่แตกต่างกัน",
  },
];
