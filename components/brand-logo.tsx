import Image from "next/image"
import { cn } from "@/lib/utils"

/** Logo QuikTech (public/quiktech-logo-qcut.svg) — kích thước qua className, VD `size-8`. */
export function BrandLogo({ className }: { className?: string }) {
  return <Image src="/quiktech-logo-qcut.svg" alt="QuikTech POS" width={36} height={36} className={cn("size-8 shrink-0", className)} />
}
