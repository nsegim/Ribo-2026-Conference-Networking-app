'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Alert } from 'react-bootstrap'
import jsQR from 'jsqr'

export default function QRScanner({ onScan }: { onScan: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isScanning) {
      startScanner()
    } else {
      stopScanner()
    }
    return () => stopScanner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning])

  const startScanner = async () => {
    try {
      stopScanner()
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      requestAnimationFrame(tick)
    } catch (err) {
      setError('Could not access camera: ' + (err instanceof Error ? err.message : 'unknown error'))
      setIsScanning(false)
    }
  }

  const stopScanner = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const tick = () => {
    const video = videoRef.current
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (streamRef.current) requestAnimationFrame(tick)
      return
    }

    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })

    if (code?.data) {
      onScan(code.data)
      setIsScanning(false)
      return
    }

    if (streamRef.current) requestAnimationFrame(tick)
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, margin: '0 auto' }}>
        <video ref={videoRef} style={{ width: '100%', borderRadius: 8, backgroundColor: '#000' }} playsInline muted />
      </div>
      <div className="text-center mt-3">
        {!isScanning ? (
          <Button onClick={() => setIsScanning(true)}>
            <i className="bi bi-camera me-1" /> Start Scanner
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setIsScanning(false)}>
            Stop Scanner
          </Button>
        )}
      </div>
    </div>
  )
}
