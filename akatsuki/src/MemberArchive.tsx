import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { ArrowUpRight, Eye, Minus, Plus, Search, X } from 'lucide-react'
import { members, type Member } from './members'

export function MemberArchive({
  onSelect,
}: {
  onSelect: (member: Member) => void
}) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const search = query.trim().toLowerCase()
  const filtered = members.filter(
    (member) =>
      (filter === 'all' || member.category === filter) &&
      `${member.name} ${member.village} ${member.epithet}`
        .toLowerCase()
        .includes(search),
  )
  const shown =
    expanded || search || filter !== 'all' ? filtered : filtered.slice(0, 6)
  return (
    <section
      id="members"
      className="members-section section-pad"
      aria-labelledby="members-title"
    >
      <div className="section-index">
        <span className="red-dash" />
        13 / THE PEOPLE BENEATH THE CLOAK
      </div>
      <div className="section-heading">
        <h2 id="members-title">
          DIFFERENT PATHS.
          <br />
          <span>THE SAME CLOUD.</span>
        </h2>
        <p>
          Know the names.
          <br />
          Discover what made them legends.
        </p>
      </div>
      <div className="archive-toolbar">
        <div className="filter-tabs" role="group" aria-label="Filter members">
          {[
            ['all', 'All members', '12'],
            ['core', 'The core', '10'],
            ['legacy', 'The beginnings', '02'],
          ].map(([value, label, count]) => (
            <button
              key={value}
              data-filter={value}
              className={filter === value ? 'active' : ''}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label} <sup>{count}</sup>
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search aria-hidden="true" />
          <input
            type="search"
            id="member-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a member"
            aria-label="Find a member"
            autoComplete="off"
          />
        </label>
      </div>
      <div id="member-grid" className="member-grid">
        {shown.map((member) => (
          <button
            key={member.id}
            className={`member-card ${member.id === 'itachi' ? 'featured-member' : ''}`}
            data-member={member.id}
            onClick={() => onSelect(member)}
            aria-label={`Read ${member.name}'s dossier`}
          >
            <div className="member-image">
              <img
                src={`/${member.id}.webp`}
                alt={member.name}
                width="480"
                height="560"
                loading="lazy"
              />
              <span className="member-number">
                {String(members.indexOf(member) + 1).padStart(2, '0')}
              </span>
              {member.id === 'itachi' && (
                <span className="member-special">THE EXCEPTION</span>
              )}
              <span className="member-open">
                <ArrowUpRight aria-hidden="true" />
              </span>
              <span className="member-village">{member.village}</span>
            </div>
            <div className="member-info">
              <h3>{member.name}</h3>
              <span>{member.epithet}</span>
            </div>
          </button>
        ))}
      </div>
      <p id="empty-state" className="empty-state" hidden={filtered.length > 0}>
        No shinobi found. Try another name or village.
      </p>
      <div className="archive-bottom">
        <span id="member-count" className="micro-label" aria-live="polite">
          {String(shown.length).padStart(2, '0')} OF{' '}
          {String(filtered.length).padStart(2, '0')} DOSSIERS
        </span>
        <button
          className="text-button"
          id="show-members"
          hidden={filtered.length <= 6 || Boolean(search) || filter !== 'all'}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show fewer members' : 'Reveal all members'}
          {expanded ? (
            <Minus aria-hidden="true" />
          ) : (
            <Plus aria-hidden="true" />
          )}
        </button>
      </div>
    </section>
  )
}

export function MemberDossier({
  member,
  onClose,
  onGenjutsu,
}: {
  member: Member
  onClose: () => void
  onGenjutsu: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const close = useEffectEvent(onClose)
  useEffect(() => {
    const dialog = dialogRef.current!
    dialog.showModal()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      dialog.close()
    }
  }, [])
  return (
    <dialog
      ref={dialogRef}
      id="member-dialog"
      className="member-dialog"
      aria-labelledby="dialog-name"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose()
      }}
    >
      <button
        className="icon-button dialog-close"
        aria-label="Close member dossier"
        title="Close dossier"
        onClick={onClose}
      >
        <X aria-hidden="true" />
      </button>
      <div id="dialog-content">
        <div className="dossier-portrait">
          <img src={`/${member.id}.webp`} alt={member.name} />
          <span className="dossier-number">
            {String(members.indexOf(member) + 1).padStart(2, '0')}
          </span>
        </div>
        <div className="dossier-copy">
          <span className="eyebrow red-text">
            CLASSIFIED /{' '}
            {member.category === 'core' ? 'THE CORE' : 'THE BEGINNINGS'}
          </span>
          <h2 id="dialog-name">{member.name}</h2>
          <p className="dossier-epithet">{member.epithet}</p>
          <p>{member.story}</p>
          <dl>
            <div>
              <dt>ORIGIN</dt>
              <dd>{member.village}</dd>
            </div>
            <div>
              <dt>RING</dt>
              <dd>{member.ring}</dd>
            </div>
            <div>
              <dt>PARTNER</dt>
              <dd>{member.partner}</dd>
            </div>
          </dl>
          <h3>SIGNATURE TECHNIQUES</h3>
          <ul>
            {member.techniques.map((technique) => (
              <li key={technique}>{technique}</li>
            ))}
          </ul>
          {member.id === 'itachi' && (
            <button
              className="button primary-button"
              id="dossier-genjutsu"
              onClick={onGenjutsu}
            >
              Enter Tsukuyomi <Eye aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}
