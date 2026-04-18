import Image from "next/image";
import logo from "@/assets/logo.png";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="animate-pulse-scale">
            <Image
              src={logo}
              alt="Cacti Stock"
              width={80}
              height={80}
              className="h-20 w-20"
              priority
            />
          </div>
        </div>
        <div className="animate-pulse-scale-delayed">
          <h1 className="font-display text-2xl font-bold text-primary">
            Cacti Stock
          </h1>
        </div>
      </div>
    </div>
  );
}
