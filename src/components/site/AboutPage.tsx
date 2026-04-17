"use client";

import heroCactus from "@/assets/hero-cactus.jpg";

function toAssetUrl(value: string | { src: string }) {
  return typeof value === "string" ? value : value.src;
}

export default function AboutPage() {
  const heroCactusUrl = toAssetUrl(heroCactus as string | { src: string });

  return (
    <div>
      <section className="relative h-64 overflow-hidden ">
        <img
          src={heroCactusUrl}
          alt="About"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-cactus-900/70 flex items-center justify-center">
          <h1 className="font-display text-4xl font-bold text-cactus-50">
            เกี่ยวกับเรา
          </h1>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-16 space-y-8">
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">
            Cacti Stock คือใคร?
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            Cacti Stock เป็นร้านจำหน่ายกระบองเพชรหายากคุณภาพสูง
            ที่รวบรวมสายพันธุ์แท้จากทั่วโลก
            เราคัดเลือกต้นไม้ทุกต้นอย่างพิถีพิถัน
            เพื่อให้มั่นใจว่าคุณจะได้รับต้นไม้ที่สมบูรณ์และมีคุณภาพดีที่สุด
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">
            ความมุ่งมั่นของเรา
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            เราเชื่อว่ากระบองเพชรไม่ใช่แค่ต้นไม้
            แต่เป็นงานศิลปะจากธรรมชาติที่ต้องการความใส่ใจ
            ทุกต้นที่เราจำหน่ายผ่านการดูแลอย่างดีก่อนถึงมือคุณ
            เราให้คำปรึกษาการดูแลฟรี และพร้อมช่วยเหลือคุณทุกขั้นตอน
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">วิธีสั่งซื้อ</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "เลือกต้นไม้",
                desc: "เลือกกระบองเพชรที่ชอบเข้าตะกร้า",
              },
              {
                step: "2",
                title: "ส่งใบสั่งซื้อ",
                desc: "กรอกข้อมูลติดต่อและส่งใบสั่งซื้อ",
              },
              {
                step: "3",
                title: "พูดคุยรายละเอียด",
                desc: "ทีมงานจะติดต่อกลับเพื่อยืนยันและจัดส่ง",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-lg border bg-card p-6 text-center"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {s.step}
                </div>
                <h3 className="font-display font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-cactus-50 p-6 text-center">
          <h3 className="font-display text-lg font-semibold">ติดต่อเรา</h3>
          <p className="mt-1 text-muted-foreground">
            อีเมล: cactistockfiles@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
