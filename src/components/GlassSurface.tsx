import { CSSProperties, ReactNode, useEffect, useId, useRef, useState } from "react"
import "./GlassSurface.css"

type BlendMode = "screen" | "difference" | "multiply" | "overlay" | "lighten"

type GlassSurfaceProps = {
  children: ReactNode
  width?: number | string
  height?: number | string
  borderRadius?: number
  borderWidth?: number
  brightness?: number
  opacity?: number
  blur?: number
  displace?: number
  backgroundOpacity?: number
  saturation?: number
  distortionScale?: number
  redOffset?: number
  greenOffset?: number
  blueOffset?: number
  mixBlendMode?: BlendMode
  className?: string
  style?: CSSProperties
}

export default function GlassSurface({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 55,
  opacity = 0.88,
  blur = 8,
  displace = 0.6,
  backgroundOpacity = 0.08,
  saturation = 1.2,
  distortionScale = -65,
  redOffset = 0,
  greenOffset = 4,
  blueOffset = 8,
  mixBlendMode = "screen",
  className = "",
  style = {},
}: GlassSurfaceProps) {
  const uniqueId = useId().replace(/:/g, "-")
  const filterId = `glass-filter-${uniqueId}`
  const redGradId = `red-grad-${uniqueId}`
  const blueGradId = `blue-grad-${uniqueId}`
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<SVGFEImageElement>(null)
  const redRef = useRef<SVGFEDisplacementMapElement>(null)
  const greenRef = useRef<SVGFEDisplacementMapElement>(null)
  const blueRef = useRef<SVGFEDisplacementMapElement>(null)
  const blurRef = useRef<SVGFEGaussianBlurElement>(null)
  const [svgSupported, setSvgSupported] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateMap = () => {
      const rect = container.getBoundingClientRect()
      const actualWidth = Math.max(rect.width, 1)
      const actualHeight = Math.max(rect.height, 1)
      const edge = Math.min(actualWidth, actualHeight) * borderWidth * 0.5
      const map = `<svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect width="${actualWidth}" height="${actualHeight}" fill="black"/><rect width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})"/><rect width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode:${mixBlendMode}"/><rect x="${edge}" y="${edge}" width="${actualWidth - edge * 2}" height="${actualHeight - edge * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)"/></svg>`
      imageRef.current?.setAttribute("href", `data:image/svg+xml,${encodeURIComponent(map)}`)
    }

    const channels = [
      { ref: redRef, offset: redOffset },
      { ref: greenRef, offset: greenOffset },
      { ref: blueRef, offset: blueOffset },
    ]
    channels.forEach(({ ref, offset }) => {
      ref.current?.setAttribute("scale", String(distortionScale + offset))
      ref.current?.setAttribute("xChannelSelector", "R")
      ref.current?.setAttribute("yChannelSelector", "G")
    })
    blurRef.current?.setAttribute("stdDeviation", String(displace))
    updateMap()

    const observer = new ResizeObserver(updateMap)
    observer.observe(container)
    return () => observer.disconnect()
  }, [blueGradId, blueOffset, blur, borderRadius, borderWidth, brightness, displace, distortionScale, greenOffset, mixBlendMode, opacity, redGradId, redOffset])

  useEffect(() => {
    const styleTest = document.createElement("div").style
    styleTest.backdropFilter = `url(#${filterId})`
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    const isFirefox = /Firefox/.test(navigator.userAgent)
    setSvgSupported(Boolean(styleTest.backdropFilter) && !isSafari && !isFirefox)
  }, [filterId])

  const containerStyle = {
    ...style,
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    "--glass-frost": backgroundOpacity,
    "--glass-saturation": saturation,
    "--glass-filter": `url(#${filterId})`,
  } as CSSProperties

  return (
    <div ref={containerRef} className={`glass-surface glass-surface--${svgSupported ? "svg" : "fallback"} ${className}`.trim()} style={containerStyle}>
      <svg className="glass-surface__filter" aria-hidden="true">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={imageRef} width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap ref={redRef} in="SourceGraphic" in2="map" result="disp-red" />
            <feColorMatrix in="disp-red" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
            <feDisplacementMap ref={greenRef} in="SourceGraphic" in2="map" result="disp-green" />
            <feColorMatrix in="disp-green" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
            <feDisplacementMap ref={blueRef} in="SourceGraphic" in2="map" result="disp-blue" />
            <feColorMatrix in="disp-blue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={blurRef} in="output" stdDeviation="0.6" />
          </filter>
        </defs>
      </svg>
      <div className="glass-surface__content">{children}</div>
    </div>
  )
}
