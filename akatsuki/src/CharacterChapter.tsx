import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  CircleDot,
  Orbit,
  Sparkles,
  Feather,
  Waves,
  Bird,
  Network,
  Scissors,
  Leaf,
  CloudRain,
  Layers,
  Mountain,
  Droplets,
  Flame,
  Wind,
  Zap,
} from 'lucide-react'
import { createAbilityScene, type Ability } from './abilities'
import { memberChapters, portraitSizes } from './memberChapters'
import { chakraNatures } from './memberScenes'
import { members, type Member } from './members'
import './chapters.css'
import './members.css'

const chapters = {
  pain: {
    number: '02',
    name: 'PAIN.',
    secondName: 'NAGATO',
    epithet: 'THE GOD OF THE HIDDEN RAIN',
    symbol: '\u96f6',
    ring: 'ZERO',
    lead: 'Six paths. One will.',
    line: 'A world forced to understand.',
    story:
      'A child of war who dreamed of peace. Behind the Six Paths stood Nagato, a man who believed the world could only change when it understood the weight of loss.',
    ability: 'Shinra Tensei',
    action: 'Unleash Almighty Push',
    active: 'SHINRA TENSEI / GRAVITY RELEASED',
    idle: 'ALL THINGS ARE DRAWN TO A CENTER',
    detail: 'Rinnegan',
    detailLabel: 'DOJUTSU',
    technique: 'Attraction / Repulsion',
    next: '#tobi',
    nextName: 'The man behind the mask',
  },
  tobi: {
    number: '03',
    name: 'TOBI.',
    secondName: 'OBITO UCHIHA',
    epithet: 'THE MAN WHO REJECTED REALITY',
    symbol: '\u7389',
    ring: 'JEWEL',
    lead: 'Not quite here.',
    line: 'Never really gone.',
    story:
      'Behind a borrowed name was a boy who once wanted to become Hokage. Obito learned to slip beyond the world, then tried to replace it with a dream that could never break.',
    ability: 'Kamui',
    action: 'Open Kamui',
    active: 'KAMUI / BETWEEN TWO WORLDS',
    idle: 'SOMEWHERE BETWEEN HERE AND NOWHERE',
    detail: 'Space-time ninjutsu',
    detailLabel: 'DIMENSION',
    technique: 'Intangibility / Warp',
    next: '#orochimaru',
    nextName: 'The pursuit of forever',
  },
  orochimaru: {
    number: '04',
    name: 'OROCHI',
    secondName: 'MARU.',
    epithet: 'THE ONE WHO WOULD NOT END',
    symbol: '\u7a7a',
    ring: 'SKY',
    lead: 'One lifetime was',
    line: 'never going to be enough.',
    story:
      'A brilliant mind with no final question. One of the Legendary Sannin, Orochimaru traded belonging for forbidden knowledge, shedding each limit in pursuit of the next life.',
    ability: 'Rebirth',
    action: 'Shed the old self',
    active: 'REBIRTH / ANOTHER BEGINNING',
    idle: 'KNOWLEDGE HAS NO FINAL FORM',
    detail: 'White serpent',
    detailLabel: 'TRUE NATURE',
    technique: 'Reincarnation / Renewal',
    next: '#konan',
    nextName: 'A thousand folds of resolve',
  },
  ...memberChapters,
} satisfies Record<Ability, Record<string, string>>

const abilityIcons = {
  pain: CircleDot,
  tobi: Orbit,
  orochimaru: Sparkles,
  konan: Feather,
  kisame: Waves,
  deidara: Bird,
  sasori: Network,
  hidan: Scissors,
  kakuzu: Layers,
  zetsu: Leaf,
  yahiko: CloudRain,
}
const natureIcons = [Mountain, Droplets, Flame, Wind, Zap]

function AbilityCanvas({
  character,
  motion,
  active,
  variant,
  onUnavailable,
}: {
  character: Ability
  motion: boolean
  active: boolean
  variant: number
  onUnavailable: () => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ReturnType<typeof createAbilityScene> | null>(null)
  const sync = useEffectEvent(() => {
    sceneRef.current?.setMotion(motion)
    sceneRef.current?.setActive(active)
    sceneRef.current?.setVariant(variant)
  })
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.id = `${character}-canvas`
    canvas.setAttribute(
      'aria-label',
      `${chapters[character].ability} interactive 3D scene`,
    )
    hostRef.current!.append(canvas)
    const section = canvas.closest('section')!
    try {
      sceneRef.current = createAbilityScene(canvas, character, () => {
        if (character === 'tobi') section.classList.add('kamui-ready')
      })
      sync()
    } catch {
      onUnavailable()
    }
    return () => {
      sceneRef.current?.dispose()
      sceneRef.current = null
      section.classList.remove('kamui-ready')
      canvas.remove()
    }
  }, [character])
  useEffect(() => {
    sync()
  }, [motion, active, variant])
  return <div ref={hostRef} className="chapter-canvas-host" />
}

export function CharacterChapter({
  character,
  motion,
  onSelect,
}: {
  character: Ability
  motion: boolean
  onSelect: (member: Member) => void
}) {
  const chapter: Record<string, string> = chapters[character]
  const member = members.find((member) => member.id === character)!
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)
  const [available, setAvailable] = useState(true)
  const [used, setUsed] = useState(false)
  const [nearby, setNearby] = useState(false)
  const [variant, setVariant] = useState(0)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const bespoke = character in memberChapters
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearby(true)
        } else {
          setNearby(false)
        }
      },
      { rootMargin: '350px' },
    )
    observer.observe(sectionRef.current!)
    return () => {
      observer.disconnect()
    }
  }, [character])
  useEffect(() => () => clearTimeout(resetTimer.current), [])
  const AbilityIcon = abilityIcons[character]
  return (
    <section
      ref={sectionRef}
      id={character}
      className={`character-chapter chapter-${character} ${bespoke ? 'chapter-bespoke' : ''}`}
      data-active={active}
      data-variant={variant}
      aria-labelledby={`${character}-title`}
    >
      <div className="chapter-texture" aria-hidden="true" />
      <div className="chapter-art">
        <img
          src={
            character === 'tobi' ? '/cutouts/tobi.webp' : `/${character}.webp`
          }
          alt={member.name}
          width={character === 'tobi' ? 592 : portraitSizes[character][0]}
          height={character === 'tobi' ? 1133 : portraitSizes[character][1]}
          loading="lazy"
        />
        <div className="chapter-art-shade" />
      </div>
      <div className="chapter-canvas">
        {nearby && available && (
          <AbilityCanvas
            character={character}
            motion={motion}
            active={active}
            variant={variant}
            onUnavailable={() => setAvailable(false)}
          />
        )}
        {!available && (
          <span className="scene-unavailable">3D scene unavailable</span>
        )}
      </div>
      <div className="chapter-topline">
        <span className="eyebrow">
          {chapter.number} / {chapter.epithet}
        </span>
        <span className="chapter-ring">
          <span lang="ja">{chapter.symbol}</span>
          {chapter.ring}
        </span>
      </div>
      <div className="chapter-copy">
        <p className="eyebrow">
          {chapter.eyebrow ??
            (character === 'pain'
              ? 'PEACE, AT THE MERCY OF A GOD'
              : character === 'tobi'
                ? 'THE DISTANCE BETWEEN TWO WORLDS'
                : 'A STUDY IN THE IMPOSSIBLE')}
        </p>
        <h2 id={`${character}-title`}>
          <span>{chapter.name}</span>
          <em>{chapter.secondName}</em>
        </h2>
        <p className="chapter-lead">
          {chapter.lead}
          <br />
          {chapter.line}
        </p>
        <p className="chapter-story">{chapter.story}</p>
        {character === 'kakuzu' && (
          <div
            className="nature-selector"
            role="group"
            aria-label="Chakra nature"
          >
            {chakraNatures.map((nature, index) => {
              const NatureIcon = natureIcons[index]
              return (
                <button
                  key={nature}
                  aria-label={nature}
                  title={nature}
                  aria-pressed={variant === index}
                  onClick={() => setVariant(index)}
                >
                  <NatureIcon aria-hidden="true" />
                  <span>{nature}</span>
                </button>
              )
            })}
          </div>
        )}
        <div className="chapter-actions">
          <button
            className="button ability-button"
            id={`${character}-ability`}
            onClick={() => {
              clearTimeout(resetTimer.current)
              resetTimer.current = setTimeout(() => setActive(false), 2400)
              setActive(true)
              setUsed(true)
            }}
            disabled={active}
            aria-pressed={active}
          >
            {chapter.action}
            <AbilityIcon aria-hidden="true" />
          </button>
          <button
            className="text-button"
            data-member={character}
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true })
              onSelect(member)
            }}
          >
            {character === 'konan' ? 'Read her story' : 'Read their story'}{' '}
            <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </div>
      <span className="chapter-japanese" lang="ja" aria-hidden="true">
        {chapter.japanese ??
          (character === 'pain'
            ? '\u8f2a\u5efb\u773c'
            : character === 'tobi'
              ? '\u795e\u5a01'
              : '\u5927\u86c7\u4e38')}
      </span>
      <div className="chapter-bottom">
        <div>
          <span className="micro-label">{chapter.detailLabel}</span>
          <span>{chapter.detail}</span>
        </div>
        <div>
          <span className="micro-label">SIGNATURE</span>
          <span>{chapter.technique}</span>
        </div>
        <p className="chapter-status" aria-live="polite">
          <span className="status-dot" />
          {active
            ? chapter.active
            : used
              ? `${chapter.ability.toUpperCase()} / THE WORLD SETTLES AGAIN`
              : chapter.idle}
        </p>
      </div>
      <a className="chapter-next" href={chapter.next}>
        <span>{chapter.nextName}</span>
        <ArrowDown aria-hidden="true" />
      </a>
    </section>
  )
}
