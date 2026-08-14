'use client'

import { useEffect, useRef, useState } from 'react'
import type { Instant } from '@/lib/day'
import type { Camera } from '@/lib/scene/projection'
import { vec } from '@/lib/scene/projection'
import { drawScene } from './drawScene'

/**
 * The scene, on a canvas, redrawn whenever the sun moves.
 *
 * Draggable: the camera orbits the gnomon, so a reader can walk round the stick
 * and see the shadow from the north, which is the whole point of it being 3D.
 * Keyboard-operable too, since a drag-only control excludes people.
 */
export function SkyScene({
  instant,
  daySamples,
  labels,
  interactive = true,
  height = 460 as number | string,
  className = '',
  ariaLabel,
  describedById,
}: {
  instant: Instant
  daySamples: readonly Instant[]
  labels: { north: string; east: string; south: string; west: string }
  interactive?: boolean
  height?: number | string
  className?: string
  ariaLabel: string
  /** id of a nearby element explaining that this graphic is drag/arrow-key operable. */
  describedById?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Until the reader takes hold of it, the camera follows the sun round the
  // sky, offset so that the sun and the shadow — which point opposite ways —
  // are both in frame. Once dragged it stays where it is put.
  const [manual, setManual] = useState(false)
  const [camera, setCamera] = useState<Camera>({
    azimuthDeg: 168,
    elevationDeg: 16,
    distance: 6.2,
    fovDeg: 56,
    target: vec(0, 0.45, 0),
  })

  useEffect(() => {
    if (manual || instant.altDeg < -6) return
    setCamera((current) => ({
      ...current,
      azimuthDeg: (instant.azDeg + 180 + 52) % 360,
    }))
  }, [manual, instant.azDeg, instant.altDeg])
  const drag = useRef<{ x: number; y: number; azimuth: number; elevation: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const render = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = canvas.clientWidth
      const clientHeight = canvas.clientHeight
      if (canvas.width !== width * ratio || canvas.height !== clientHeight * ratio) {
        canvas.width = width * ratio
        canvas.height = clientHeight * ratio
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      drawScene(context, { width, height: clientHeight }, {
        instant,
        daySamples,
        camera,
        labels,
      })
    }

    render()
    const observer = new ResizeObserver(render)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [instant, daySamples, camera, labels])

  const orbit = (dx: number, dy: number) => {
    setCamera((current) => ({
      ...current,
      azimuthDeg: (current.azimuthDeg + dx + 360) % 360,
      // Stay above the ground and below the zenith, where the view degenerates.
      elevationDeg: Math.min(78, Math.max(3, current.elevationDeg + dy)),
    }))
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel}
      aria-describedby={describedById}
      tabIndex={interactive ? 0 : -1}
      style={{ height, touchAction: interactive ? 'pan-y' : undefined }}
      className={`w-full select-none ${interactive ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      onPointerDown={(event) => {
        if (!interactive) return
        setManual(true)
        drag.current = {
          x: event.clientX,
          y: event.clientY,
          azimuth: camera.azimuthDeg,
          elevation: camera.elevationDeg,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        const start = drag.current
        if (!start) return
        setCamera((current) => ({
          ...current,
          azimuthDeg: (start.azimuth - (event.clientX - start.x) * 0.4 + 360) % 360,
          elevationDeg: Math.min(78, Math.max(3, start.elevation + (event.clientY - start.y) * 0.25)),
        }))
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      onKeyDown={(event) => {
        if (!interactive) return
        const step = event.shiftKey ? 15 : 5
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) setManual(true)
        if (event.key === 'ArrowLeft') orbit(-step, 0)
        else if (event.key === 'ArrowRight') orbit(step, 0)
        else if (event.key === 'ArrowUp') orbit(0, step)
        else if (event.key === 'ArrowDown') orbit(0, -step)
        else return
        event.preventDefault()
      }}
    />
  )
}
