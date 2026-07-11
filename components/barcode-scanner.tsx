'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScanLine } from 'lucide-react'

interface Props {
  open: boolean
  onScan: (sku: string) => void
  onClose: () => void
}

export function BarcodeScanner({ open, onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const cooldownRef = useRef(false)
  const [cameraError, setCameraError] = useState(false)

  useEffect(() => {
    if (!open) { setCameraError(false); return }
    if (!videoRef.current) return

    let controls: { stop: () => void } | null = null
    cooldownRef.current = false

    const start = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (result && !cooldownRef.current) {
            cooldownRef.current = true
            onScan(result.getText())
            setTimeout(() => { cooldownRef.current = false }, 1500)
          }
        })
      } catch {
        setCameraError(true)
      }
    }

    start()
    return () => { controls?.stop() }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-sm p-0 gap-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <ScanLine className="size-4" />
            Quét mã vạch
          </DialogTitle>
        </DialogHeader>
        {cameraError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-muted-foreground">
            <p>Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.</p>
            <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
          </div>
        ) : (
          <>
            <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-56 rounded border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
              </div>
            </div>
            <div className="flex justify-end border-t p-3">
              <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
