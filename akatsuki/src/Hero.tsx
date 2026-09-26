import { useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { assemblyMembers, createAssemblyScene } from './assembly'
import './hero.css'

const lineup = [...assemblyMembers].sort((first, second) => first.x - second.x)

export function Hero({ motion }: { motion: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ReturnType<typeof createAssemblyScene> | null>(null)
  const [ready, setReady] = useState(false)
  const [available, setAvailable] = useState(true)
  const [selected, setSelected] = useState('itachi')
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.id = 'assembly-canvas'
    canvas.setAttribute(
      'aria-label',
      'Akatsuki members assembled in the rain, with Itachi in front',
    )
    hostRef.current!.append(canvas)
    try {
      sceneRef.current = createAssemblyScene(
        canvas,
        () => setReady(true),
        () => setAvailable(false),
      )
    } catch {
      setAvailable(false)
    }
    return () => {
      sceneRef.current?.dispose()
      sceneRef.current = null
      canvas.remove()
    }
  }, [])
  useEffect(() => {
    sceneRef.current?.setMotion(motion)
  }, [motion])
  useEffect(() => {
    sceneRef.current?.select(selected)
  }, [selected])
  const selectedName = assemblyMembers.find(
    (member) => member.id === selected,
  )!.name
  return (
    <section
      className="assembly-hero"
      aria-labelledby="hero-title"
      data-ready={ready}
    >
      <div className="assembly-backdrop" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="assembly-heading">
        <p className="eyebrow">
          <span className="red-dash" />
          THE WORLD CALLED THEM VILLAINS.
        </p>
        <h1 id="hero-title">
          AKATSUKI<span>.</span>
        </h1>
        <span className="assembly-kanji" lang="ja" aria-hidden="true">
          &#26241;
        </span>
      </div>
      <div ref={hostRef} className="assembly-stage" hidden={!available} />
      <div className="assembly-fallback" hidden={ready && available}>
        {lineup.map((member) => (
          <img
            key={member.id}
            src={`/cutouts/${member.id}.webp`}
            alt={member.name}
            className={`assembly-fallback-${member.id}`}
          />
        ))}
      </div>
      <div className="assembly-ground" aria-hidden="true" />
      <div className="assembly-footer">
        <div className="assembly-intro">
          <p>
            Different pasts. One red cloud.
            <br />
            <span>Meet the people behind the legend.</span>
          </p>
          <a className="button primary-button" href="#itachi">
            Enter the Akatsuki <ArrowDownRight aria-hidden="true" />
          </a>
        </div>
        <div className="assembly-roster">
          <div className="assembly-roster-label">
            <span className="micro-label">BENEATH THE RED CLOUDS</span>
            <a
              href={`#${selected}`}
              aria-label={`Explore ${selectedName}'s chapter`}
            >
              {selectedName}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <div
            className="assembly-select"
            role="group"
            aria-label="Akatsuki lineup"
          >
            {lineup.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelected(member.id)}
                aria-pressed={selected === member.id}
              >
                {member.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <span className="assembly-edition">FIVE SHADOWS. TWELVE STORIES.</span>
    </section>
  )
}
