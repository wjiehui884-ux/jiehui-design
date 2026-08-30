import { useEffect, useLayoutEffect, useRef, useState } from "react"
import DepthText from "./components/DepthText"
import GlassSurface from "./components/GlassSurface"

const projects = [
  { src: "assets/project-1.png", alt: "语音房社交产品" },
  { src: "assets/project-2.png", alt: "AIGC生图探索" },
  { src: "assets/project-3.png", alt: "哈啰租车商家端" },
  { src: "assets/project-4.png", alt: "vibe coding工具" },
  { src: "assets/project-5.png", alt: "数据开发后台" },
]

const helloCarRentalImages = [
  "assets/hello/hello-car-rental-1.jpg",
  "assets/hello/hello-car-rental-1-2.jpg",
  ...Array.from(
    { length: 9 },
    (_, index) => `assets/hello/hello-car-rental-${index + 2}.jpg`,
  ),
]

const aigcImages = Array.from(
  { length: 6 },
  (_, index) => `assets/aigc/aigc-${index + 1}.jpg`,
)

const dataPlatformImages = Array.from(
  { length: 16 },
  (_, index) => `assets/data-platform/data-platform-${index + 1}.jpg`,
)

const voiceSocialImages = Array.from(
  { length: 15 },
  (_, index) => `assets/voice-social/voice-social-${index + 1}.jpg`,
)

const vibeCodingImages = Array.from(
  { length: 9 },
  (_, index) => `assets/vibe-coding/${index + 1}.png`,
)

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const contentsViewportRef = useRef<HTMLDivElement>(null)
  const contentsCardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const contentsPausedRef = useRef(false)
  const [portraitActive, setPortraitActive] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const retryPlayback = () => void videoRef.current?.play()

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual"

    // The in-app browser can retain #about and its previous scroll offset after
    // hot reloads. Always open this portfolio from its cover page.
    if (window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)
    }

    const resetToCover = () => {
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    }

    resetToCover()
    const frame = window.requestAnimationFrame(resetToCover)
    const shortTimer = window.setTimeout(resetToCover, 80)
    const restorationTimer = window.setTimeout(resetToCover, 350)
    window.addEventListener("pageshow", resetToCover)
    window.addEventListener("load", resetToCover)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(shortTimer)
      window.clearTimeout(restorationTimer)
      window.removeEventListener("pageshow", resetToCover)
      window.removeEventListener("load", resetToCover)
    }
  }, [])

  useEffect(() => {
    const viewport = contentsViewportRef.current
    if (!viewport) return

    let frame = 0
    let previous = performance.now()
    let progress = 0
    // Pixel measurements taken directly from the supplied 5760×3240 rope.
    // Keeping these normalized anchors avoids the thin JPEG line disappearing
    // when a browser downsamples it, which previously corrupted the left edge.
    const ropePoints = [
      [0, .259], [.1, .295], [.2, .323], [.3, .345], [.4, .359],
      [.5, .364], [.6, .358], [.7, .345], [.8, .323], [.9, .295], [1, .259],
    ] as const

    const ropeY = (x: number) => {
      const t = Math.max(0, Math.min(1, x))
      let segment = 0
      while (segment < ropePoints.length - 2 && t > ropePoints[segment + 1][0]) segment += 1
      const p0 = ropePoints[Math.max(0, segment - 1)]
      const p1 = ropePoints[segment]
      const p2 = ropePoints[segment + 1]
      const p3 = ropePoints[Math.min(ropePoints.length - 1, segment + 2)]
      const local = (t - p1[0]) / (p2[0] - p1[0])
      const local2 = local * local
      const local3 = local2 * local
      return .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * local
        + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * local2
        + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * local3)
    }

    const positionCards = (now: number) => {
      const elapsed = Math.min(now - previous, 50)
      previous = now
      if (!contentsPausedRef.current) progress += elapsed * 0.000027

      const width = viewport.clientWidth
      const height = viewport.clientHeight
      // Keep both wrap points at least half a card outside the viewport. The
      // previous 1.125× loop was shorter than the visible travel distance, so
      // a card teleported while its edge was still visible at the far left.
      const spacing = width * 0.25
      const loopWidth = spacing * projects.length
      const start = width * -0.13

      contentsCardRefs.current.forEach((card, index) => {
        if (!card) return
        const rawX = start + index * spacing - progress * width
        const x = ((rawX - start) % loopWidth + loopWidth) % loopWidth + start
        const normalizedX = Math.max(0, Math.min(1, x / width))
        const y = height * ropeY(normalizedX)
        const epsilon = .012
        const slope = height * (ropeY(Math.min(1, normalizedX + epsilon))
          - ropeY(Math.max(0, normalizedX - epsilon))) / (width * epsilon * 2)
        const ropeAngle = Math.atan(slope) * 180 / Math.PI
        card.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -8.5%) rotate(${ropeAngle}deg)`
        card.style.zIndex = String(10 + Math.round(y))
      })

      frame = requestAnimationFrame(positionCards)
    }

    frame = requestAnimationFrame(positionCards)
    return () => cancelAnimationFrame(frame)
  }, [])

  const renderBackButton = () => (
    <GlassSurface
      className="project-detail__back-surface"
      width="fit-content"
      height={40}
      borderRadius={999}
      distortionScale={-55}
    >
      <button
        className="project-detail__back"
        type="button"
        onClick={() => setActiveSection("contents")}
        aria-label="返回目录"
      >
        返回目录
      </button>
    </GlassSurface>
  )

  return (
    <main className="portfolio-shell">
      <nav className="nav" aria-label="主要导航">
        <a className="logo" href="#home" aria-label="返回首页" onClick={(event) => { event.preventDefault(); setActiveSection("home") }}>
          JIEHUI<sup>®</sup>
        </a>

        <GlassSurface className="nav__glass nav__glass--links" width="fit-content" height={42} borderRadius={999}>
          <div className="nav-links">
            {[{ id: "home", label: "首页" }, { id: "about", label: "关于" }, { id: "contents", label: "作品" }].map((item) => (
              <a
                className={activeSection === item.id ? "active" : ""}
                href={`#${item.id}`}
                aria-current={activeSection === item.id ? "page" : undefined}
                onClick={(event) => { event.preventDefault(); setActiveSection(item.id) }}
                key={item.id}
              >
                {item.label}
              </a>
            ))}
          </div>
        </GlassSurface>

        <GlassSurface className="nav__glass nav__glass--contact" width="fit-content" height={40} borderRadius={999} distortionScale={-55}>
          <a className={`glass-button ${activeSection === "contact" ? "active" : ""}`} href="#contact" onClick={(event) => { event.preventDefault(); setActiveSection("contact") }}>
            联系我
          </a>
        </GlassSurface>
      </nav>
      <section className="cover" id="home" hidden={activeSection !== "home"} onPointerDown={retryPlayback}>
      {activeSection === "home" && (
        <video ref={videoRef} className="cover__video" autoPlay muted loop playsInline preload="metadata" aria-label="作品集封面动态背景">
          <source src="assets/cover.mp4" type="video/mp4" />
        </video>
      )}
      <div className="cover__shade" aria-hidden="true" />
      <section className="cover__art" aria-label="王杰慧 UI/UX 设计作品集 2026">
        <img className="cover__title" src="assets/title.png" alt="设计作品集，向新而行！" />
        <img className="cover__uiux" src="assets/uiux.png" alt="UI/UX 2026" />
        <div className="cover__sticker-entry" aria-hidden="true">
          <img className="cover__sticker" src="assets/sticker.png" alt="" />
        </div>
        <span className="cover__signature-mask">
          <img className="cover__signature" src="assets/begin-anywhere.png" alt="Begin Anywhere" />
        </span>
      </section>
      <a className="cover__scroll-cue" href="#about" aria-label="查看关于我" onClick={(event) => { event.preventDefault(); setActiveSection("about") }}>
        <DepthText
          text="CLICK TO EXPLORE"
          layers={22}
          depth={1.15}
          faceColor="#ffffff"
          depthColor="#207bb5"
          tilt={7}
          smoothing={0.12}
          perspective={700}
          orbitSpeed={0.18}
          fontSize="clamp(.86rem, 1.05vw, 1.16rem)"
          fontWeight={800}
        />
      </a>
      </section>

      <section className="about about--image" id="about" hidden={activeSection !== "about"} aria-label="自我介绍">
        <div className={`about__canvas ${portraitActive ? "is-active" : ""}`}>
          <img className="about__page-image" src="assets/about-background-new.jpg" alt="王杰慧的自我介绍、教育经历与实习经历" loading="lazy" />
          <img className="about__person-layer about__person-layer--default" src="assets/about-person-default.jpg" alt="" loading="lazy" />
          <img className="about__person-layer about__person-layer--hover" src="assets/about-person-hover.jpg" alt="" loading="lazy" />
          <img className="about__click-tip" src="assets/about-click-tip.png" alt="点击我，和我打个招呼吧" loading="lazy" />
          <img className="about__vx-tag" src="assets/vx.png" alt="" aria-hidden="true" loading="lazy" />
          <button
            className="about__portrait-swap"
            type="button"
            aria-label="切换人物表情"
            aria-pressed={portraitActive}
            onMouseEnter={() => setPortraitActive(true)}
            onMouseLeave={() => setPortraitActive(false)}
            onFocus={() => setPortraitActive(true)}
            onBlur={() => setPortraitActive(false)}
            onClick={() => setPortraitActive((active) => !active)}
          />
        </div>
      </section>

      <section className="contents" id="contents" hidden={activeSection !== "contents"} aria-label="作品目录">
        <div className="contents__canvas">
          <img className="contents__background" src="assets/contents-base.jpg" alt="作品目录" />
          <img className="contents__rope" src="assets/contents-rope-layer.jpg" alt="" />
          <div
            className="contents__viewport"
            ref={contentsViewportRef}
          >
            {projects.map((project, index) => (
              <button
                className={`contents__card contents__card--${index + 1}`}
                type="button"
                key={project.src}
                ref={(node) => { contentsCardRefs.current[index] = node }}
                onMouseEnter={() => { contentsPausedRef.current = true }}
                onMouseLeave={() => { contentsPausedRef.current = false }}
                onFocus={() => { contentsPausedRef.current = true }}
                onBlur={() => { contentsPausedRef.current = false }}
                onClick={() => {
                        if (index === 0) setActiveSection("voice-social")
                        if (index === 1) setActiveSection("aigc")
                        if (index === 2) setActiveSection("hello-car-rental")
                        if (index === 3) setActiveSection("vibe-coding")
                        if (index === 4) setActiveSection("data-platform")
                      }}
              >
                <img src={project.src} alt={project.alt} />
              </button>
            ))}
          </div>
          <img className="contents__person" src="assets/contents-person-portrait.png" alt="" />
        </div>
      </section>

      <section
        className="project-detail project-detail--dark"
        id="vibe-coding"
        hidden={activeSection !== "vibe-coding"}
        aria-label="Vibe Coding 设计系统工作台项目详情"
      >
        {renderBackButton()}
        <div className="project-detail__images">
          {activeSection === "vibe-coding" && vibeCodingImages.map((src, index) => (
            <img
              src={src}
              alt={`Vibe Coding 设计系统工作台项目展示第 ${index + 1} 页`}
              loading={index < 2 ? "eager" : "lazy"}
              key={src}
            />
          ))}
        </div>
      </section>

      <section
        className="project-detail"
        id="voice-social"
        hidden={activeSection !== "voice-social"}
        aria-label="语音房社交项目详情"
      >
        {renderBackButton()}
        <div className="project-detail__images">
          {activeSection === "voice-social" && voiceSocialImages.map((src, index) => (
            <img
              src={src}
              alt={`语音房社交项目展示第 ${index + 1} 页`}
              loading={index < 2 ? "eager" : "lazy"}
              key={src}
            />
          ))}
        </div>
      </section>

      <section
        className="project-detail"
        id="aigc"
        hidden={activeSection !== "aigc"}
        aria-label="AIGC 生图探索项目详情"
      >
        {renderBackButton()}
        <div className="project-detail__images">
          {activeSection === "aigc" && aigcImages.map((src, index) => (
            <img
              src={src}
              alt={`AIGC 生图探索项目展示第 ${index + 1} 页`}
              loading={index === 0 ? "eager" : "lazy"}
              key={src}
            />
          ))}
        </div>
      </section>

      <section
        className="project-detail"
        id="hello-car-rental"
        hidden={activeSection !== "hello-car-rental"}
        aria-label="哈啰租车商家端项目详情"
      >
        {renderBackButton()}
        <div className="project-detail__images">
          {activeSection === "hello-car-rental" && helloCarRentalImages.map((src, index) => (
            <img
              src={src}
              alt={`哈啰租车商家端项目展示第 ${index + 1} 页`}
              loading={index < 2 ? "eager" : "lazy"}
              key={src}
            />
          ))}
        </div>
      </section>

      <section
        className="project-detail"
        id="data-platform"
        hidden={activeSection !== "data-platform"}
        aria-label="数据开发平台项目详情"
      >
        {renderBackButton()}
        <div className="project-detail__images">
          {activeSection === "data-platform" && dataPlatformImages.map((src, index) => (
            <img
              src={src}
              alt={`数据开发平台项目展示第 ${index + 1} 页`}
              loading={index < 2 ? "eager" : "lazy"}
              key={src}
            />
          ))}
        </div>
      </section>

      <footer className="portfolio-footer" id="contact" hidden={activeSection !== "contact"} aria-label="联系方式与作品集页尾">
        <div className="portfolio-footer__canvas">
          <img src="assets/portfolio-footer.jpg" alt="联系方式与作品集页尾" />
        </div>
      </footer>
    </main>
  )
}
