import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  ArrowUp,
  ArrowUpRight,
  Eye,
  Menu,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { Hero } from './Hero'
import { createPortraitScene } from './portrait'
import { members, type Member } from './members'
import { MemberArchive, MemberDossier } from './MemberArchive'
import { CharacterChapter } from './CharacterChapter'
import { chapterOrder } from './memberChapters'
import { asset } from './asset'

function CloudMark() {
  return (
    <svg viewBox="0 0 80 52" fill="none" aria-hidden="true">
      <path
        d="M17 30C4 34 3 45 19 45H59C74 45 78 36 69 30C79 19 66 6 54 16C51 0 27-1 24 15C8 7-1 25 12 27C22 26 25 30 17 30Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
}

function SoundToggle() {
  const [enabled, setEnabled] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const audio = useRef<{ context: AudioContext; gain: GainNode } | null>(null)
  useEffect(() => {
    const update = () => {
      if (audio.current)
        audio.current.gain.gain.setTargetAtTime(
          enabled && !document.hidden ? 0.025 : 0,
          audio.current.context.currentTime,
          0.3,
        )
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [enabled])
  useEffect(
    () => () => {
      void audio.current?.context.close()
      audio.current = null
    },
    [],
  )
  async function toggleSound() {
    try {
      if (!audio.current) {
        const context = new AudioContext()
        const gain = context.createGain()
        gain.gain.value = 0
        gain.connect(context.destination)
        for (const frequency of [55, 82.41, 110.15]) {
          const oscillator = context.createOscillator()
          oscillator.frequency.value = frequency
          oscillator.connect(gain)
          oscillator.start()
        }
        audio.current = { context, gain }
      }
      await audio.current.context.resume()
      setEnabled((value) => !value)
    } catch {
      setUnavailable(true)
    }
  }
  const label = unavailable
    ? 'Ambient sound is unavailable'
    : enabled
      ? 'Mute ambient sound'
      : 'Enable ambient sound'
  return (
    <button
      className="icon-button"
      id="sound-toggle"
      onClick={toggleSound}
      disabled={unavailable}
      aria-pressed={enabled}
      title={label}
      aria-label={label}
    >
      {enabled ? (
        <Volume2 aria-hidden="true" />
      ) : (
        <VolumeX aria-hidden="true" />
      )}
    </button>
  )
}

function Header({
  motion,
  onToggleMotion,
}: {
  motion: boolean
  onToggleMotion: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const motionLabel = motion ? 'Pause visual effects' : 'Enable visual effects'
  const links = [
    ['#itachi', '01', 'Itachi'],
    ['#members', '13', 'The members'],
    ['#origin', '14', 'The origin'],
  ]
  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setMenuOpen(false)
      }}
    >
      <a className="brand" href="#" aria-label="Akatsuki home">
        <CloudMark />
        <span>
          AKATSUKI<span className="brand-sub">THE SHADOW ARCHIVE</span>
        </span>
      </a>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([href, number, label]) => (
          <a
            key={href}
            href={href}
            className={href === '#itachi' ? 'itachi-link' : undefined}
          >
            <span>{number}</span>
            {label}
            {href === '#itachi' && <Eye aria-hidden="true" />}
          </a>
        ))}
      </nav>
      <div className="header-tools">
        <SoundToggle />
        <button
          className="icon-button"
          id="motion-toggle"
          onClick={onToggleMotion}
          aria-label={motionLabel}
          aria-pressed={!motion}
          title={motionLabel}
        >
          {motion ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <span className="header-edition">EST. IN THE RAIN</span>
        <button
          className="icon-button menu-toggle"
          id="menu-toggle"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      <nav
        id="mobile-nav"
        className="mobile-nav"
        aria-label="Mobile navigation"
        hidden={!menuOpen}
      >
        {links.map(([href, number, label]) => (
          <a key={href} href={href} onClick={() => setMenuOpen(false)}>
            {number} / {label}
          </a>
        ))}
      </nav>
    </header>
  )
}

function ItachiChapter({
  motion,
  captured,
  reality,
  onEnter,
  onSelect,
}: {
  motion: boolean
  captured: boolean
  reality: string
  onEnter: (explicit?: boolean) => boolean
  onSelect: (member: Member) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<ReturnType<typeof createPortraitScene> | null>(null)
  const hasEntered = useRef(false)
  const onVisible = useEffectEvent(() => {
    if (!hasEntered.current && !document.hidden && onEnter())
      hasEntered.current = true
  })
  useEffect(() => {
    try {
      sceneRef.current = createPortraitScene(canvasRef.current!, true)
    } catch {}
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible()
      },
      { threshold: 0.42 },
    )
    observer.observe(sectionRef.current!)
    return () => {
      observer.disconnect()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])
  useEffect(() => {
    sceneRef.current?.setMotion(motion)
  }, [motion])
  useEffect(() => {
    sceneRef.current?.setCaptured(captured)
  }, [captured])
  return (
    <section
      ref={sectionRef}
      id="itachi"
      className="itachi-section"
      aria-labelledby="itachi-title"
    >
      <div className="itachi-image">
        <img
          src={asset('itachi.webp')}
          alt="Itachi Uchiha wearing the red-cloud Akatsuki cloak"
          width="1440"
          height="1080"
          loading="lazy"
        />
        <canvas ref={canvasRef} id="itachi-canvas" aria-hidden="true" />
      </div>
      <div className="itachi-shade" />
      <div className="itachi-topline">
        <span className="eyebrow">01 / THE ONE ABOVE ALL</span>
        <span className="itachi-ring">
          &#26417; <span>SCARLET</span>
        </span>
      </div>
      <div className="itachi-copy">
        <p className="eyebrow red-text">THE TRUTH LIVES BEHIND HIS EYES</p>
        <h2 id="itachi-title">
          ITACHI
          <br />
          <em>UCHIHA.</em>
        </h2>
        <p className="itachi-intro">
          A villain to the world.
          <br />A brother until the end.
        </p>
        <p className="itachi-detail">
          Some protectors never get to be heroes. He carried an impossible truth
          in silence, and left the world with an illusion.
        </p>
        <button
          className="button light-button"
          id="genjutsu-trigger"
          onClick={() => onEnter(true)}
        >
          Enter Tsukuyomi <Eye aria-hidden="true" />
        </button>
        <button
          className="text-button itachi-dossier"
          data-member="itachi"
          onClick={() => onSelect(members[0])}
        >
          Read his story <ArrowUpRight aria-hidden="true" />
        </button>
      </div>
      <div className="itachi-japanese" lang="ja" aria-hidden="true">
        &#12358;&#12385;&#12399;
        <br />
        &#12452;&#12479;&#12481;
      </div>
      <div className="itachi-bottom">
        <div>
          <span className="micro-label">KEKKEI GENKAI</span>
          <span>Mangekyo Sharingan</span>
        </div>
        <div>
          <span className="micro-label">ALLEGIANCE</span>
          <span>More than meets the eye</span>
        </div>
        <div className="reality-indicator">
          <span className="status-dot" />
          <span id="reality-status">{reality}</span>
        </div>
      </div>
    </section>
  )
}

function Illusion({ timed, onClose }: { timed: boolean; onClose: () => void }) {
  const escapeRef = useRef<HTMLButtonElement>(null)
  const gazeRef = useRef<HTMLDivElement>(null)
  const close = useEffectEvent(onClose)
  useEffect(() => {
    escapeRef.current?.focus({ preventScroll: true })
    const timer = timed ? setTimeout(() => close(), 1600) : undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'Tab') {
        event.preventDefault()
        escapeRef.current?.focus()
      }
    }
    const onVisibility = () => {
      if (document.hidden) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [timed])
  useEffect(() => {
    const gaze = gazeRef.current!
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let frame = 0
    const move = (event: PointerEvent) => {
      if (preference.matches || event.pointerType === 'touch') return
      target.x = Math.max(-1, Math.min(1, (event.clientX / innerWidth) * 2 - 1))
      target.y = Math.max(-1, Math.min(1, (event.clientY / innerHeight) * 2 - 1))
    }
    const reset = () => {
      target.x = 0
      target.y = 0
    }
    const animate = () => {
      current.x += (target.x - current.x) * 0.09
      current.y += (target.y - current.y) * 0.09
      gaze.style.setProperty('--gaze-x', current.x.toFixed(4))
      gaze.style.setProperty('--gaze-y', current.y.toFixed(4))
      frame = requestAnimationFrame(animate)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', reset)
    preference.addEventListener('change', reset)
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', reset)
      preference.removeEventListener('change', reset)
    }
  }, [])
  return (
    <div
      id="illusion"
      className="illusion"
      role="dialog"
      aria-modal="true"
      aria-labelledby="illusion-title"
      aria-describedby="illusion-description"
      tabIndex={-1}
    >
      <button
        ref={escapeRef}
        id="escape-illusion"
        className="illusion-escape"
        onClick={onClose}
      >
        Return to reality <X aria-hidden="true" />
      </button>
      <span className="illusion-label">MANGEKYO SHARINGAN / TSUKUYOMI</span>
      <div ref={gazeRef} className="sharingan-gaze" aria-hidden="true">
        <div className="sharingan">
          <div className="iris-ring" />
          <span className="tomoe tomoe-one" />
          <span className="tomoe tomoe-two" />
          <span className="tomoe tomoe-three" />
          <div className="pupil" />
        </div>
      </div>
      <div className="illusion-text">
        <span id="illusion-description">A moment outside of time.</span>
        <h2 id="illusion-title">
          Your reality.
          <br />
          <em>His illusion.</em>
        </h2>
      </div>
      <span className="illusion-time">
        &#26376;&#35501; / TIME BELONGS TO HIM
      </span>
    </div>
  )
}

export default function App() {
  const [motion, setMotion] = useState(
    () => !matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [captured, setCaptured] = useState(false)
  const [persistentCapture, setPersistentCapture] = useState(false)
  const [selected, setSelected] = useState<Member | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [reality, setReality] = useState('REALITY IS A MATTER OF PERCEPTION')
  const returnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => {
      setMotion(!preference.matches)
      if (preference.matches) setCaptured(false)
    }
    preference.addEventListener('change', changed)
    return () => preference.removeEventListener('change', changed)
  }, [])
  useEffect(() => {
    document.body.classList.toggle('reduced-motion', !motion)
    document.documentElement.style.scrollBehavior = motion ? 'smooth' : 'auto'
    return () => {
      document.body.classList.remove('reduced-motion')
      document.documentElement.style.removeProperty('scroll-behavior')
    }
  }, [motion])
  useEffect(() => {
    document.body.classList.toggle('under-genjutsu', captured)
    document.body.classList.toggle('dialog-open', Boolean(selected))
    if (!captured && !selected && returnFocus.current?.isConnected)
      returnFocus.current.focus({ preventScroll: true })
    return () => document.body.classList.remove('under-genjutsu', 'dialog-open')
  }, [captured, selected])
  function openMember(member: Member) {
    returnFocus.current = document.activeElement as HTMLElement
    setSelected(member)
  }
  function enterGenjutsu(explicit = false) {
    if (captured || document.hidden || (selected && !explicit)) return false
    if (!motion) {
      if (explicit) {
        setSelected(null)
        setReality('TSUKUYOMI / A MOMENT OUTSIDE OF TIME')
        setAnnouncement('Tsukuyomi. Animated effects are paused.')
      }
      return true
    }
    if (!selected) returnFocus.current = document.activeElement as HTMLElement
    setSelected(null)
    setPersistentCapture(explicit)
    setCaptured(true)
    setAnnouncement(
      explicit
        ? 'Tsukuyomi. Press Escape or use Return to reality to leave the illusion.'
        : 'Tsukuyomi. Controls return in 1.6 seconds. Escape returns immediately.',
    )
    return true
  }
  function leaveGenjutsu() {
    setCaptured(false)
    setPersistentCapture(false)
    setReality('YOU WERE NEVER OUTSIDE THE ILLUSION')
    setAnnouncement('The illusion has ended. Page controls are restored.')
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div id="experience" inert={captured}>
        <Header
          motion={motion}
          onToggleMotion={() => {
            setMotion(!motion)
            setCaptured(false)
          }}
        />
        <main id="main">
          <Hero motion={motion} />
          <div className="manifesto-ticker" aria-hidden="true">
            <div>
              {[
                'NO VILLAGE.',
                'NO MASTERS.',
                'ONE DAWN.',
                'NO VILLAGE.',
                'NO MASTERS.',
                'ONE DAWN.',
              ].map((text, index) => (
                <span className="ticker-item" key={index}>
                  <span>{text}</span>
                  <span className="ticker-cloud">
                    <CloudMark />
                  </span>
                </span>
              ))}
            </div>
          </div>
          <section id="manifesto" className="manifesto section-pad">
            <div className="section-index">
              <span className="red-dash" />
              BEYOND GOOD AND EVIL
            </div>
            <h2>
              Every shadow
              <br />
              began with <em>a light.</em>
            </h2>
            <div className="manifesto-copy">
              <p>
                They wore the same clouds, but carried different storms.
                Renegades. Visionaries. Broken heroes. The Akatsuki were never
                just the villains of someone else&apos;s story.
              </p>
              <span className="micro-label">
                TWELVE STORIES. ONE UNFORGETTABLE LEGACY.
              </span>
            </div>
          </section>
          <nav className="chapter-nav" aria-label="Character chapters">
            <span>TWELVE FACES OF THE AKATSUKI</span>
            <div>
              <a href="#itachi">
                <span>01</span>Itachi
              </a>
              {chapterOrder.map((id, index) => (
                <a key={id} href={`#${id}`}>
                  <span>{String(index + 2).padStart(2, '0')}</span>
                  {id === 'tobi'
                    ? 'Obito'
                    : members
                        .find((member) => member.id === id)!
                        .name.split(/[ /]/)[0]}
                </a>
              ))}
            </div>
          </nav>
          <ItachiChapter
            motion={motion}
            captured={captured}
            reality={reality}
            onEnter={enterGenjutsu}
            onSelect={openMember}
          />
          {chapterOrder.map((character) => (
            <CharacterChapter
              key={character}
              character={character}
              motion={motion}
              onSelect={openMember}
            />
          ))}
          <MemberArchive onSelect={openMember} />
          <section
            id="origin"
            className="origin-section section-pad"
            aria-labelledby="origin-title"
          >
            <div className="section-index">
              <span className="red-dash" />
              14 / BEFORE THE RED CLOUDS
            </div>
            <div className="origin-layout">
              <div>
                <h2 id="origin-title">
                  IT BEGAN
                  <br />
                  WITH <em>RAIN.</em>
                </h2>
                <p>
                  Not an empire. Not a threat.
                  <br />
                  Just three friends who wanted a different world.
                </p>
                <span className="origin-kanji" lang="ja" aria-hidden="true">
                  &#38632;
                </span>
              </div>
              <div className="timeline">
                <article>
                  <span>01</span>
                  <div>
                    <h3>A dream in Amegakure</h3>
                    <p>
                      Yahiko, Nagato, and Konan founded the Akatsuki to bring
                      peace to a homeland caught between greater powers.
                    </p>
                  </div>
                </article>
                <article>
                  <span>02</span>
                  <div>
                    <h3>The dream changes shape</h3>
                    <p>
                      After Yahiko&apos;s death, Nagato adopted the identity of
                      Pain. The red clouds came to represent the rain
                      country&apos;s suffering.
                    </p>
                  </div>
                </article>
                <article>
                  <span>03</span>
                  <div>
                    <h3>A gathering of outcasts</h3>
                    <p>
                      Under a shared symbol, missing-nin from across the shinobi
                      world assembled. Each brought a different reason to stay.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </main>
        <footer className="site-footer">
          <a className="footer-brand" href="#">
            <CloudMark />
            <span>AKATSUKI</span>
          </a>
          <p>
            An unofficial tribute to the world of Naruto.
            <br />
            Characters &amp; artwork belong to their respective owners.
          </p>
          <a
            className="back-top"
            href="#"
            aria-label="Back to top"
            title="Back to top"
          >
            <ArrowUp aria-hidden="true" />
          </a>
          <div className="footer-bottom">
            <span>THE SHADOW ARCHIVE / 2026</span>
            <span>EVEN THE LONGEST NIGHT ENDS IN DAWN.</span>
          </div>
        </footer>
      </div>
      {selected && (
        <MemberDossier
          key={selected.id}
          member={selected}
          onClose={() => setSelected(null)}
          onGenjutsu={() => enterGenjutsu(true)}
        />
      )}
      {captured && (
        <Illusion timed={!persistentCapture} onClose={leaveGenjutsu} />
      )}
      <div
        className="sr-only"
        id="announcement"
        role="status"
        aria-live="polite"
      >
        {announcement}
      </div>
    </>
  )
}
