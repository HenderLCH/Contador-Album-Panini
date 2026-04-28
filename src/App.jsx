import { useEffect, useMemo, useState } from 'react'
import ReactCountryFlag from 'react-country-flag'
import { albumMeta, groups, specialStickers } from './data/albumData'

const STORAGE_KEY = 'album-panini-2026-owned'
const THEME_KEY = 'album-panini-2026-theme'
const STICKER_STATE = {
  OWNED: 'owned',
  DUPLICATE: 'duplicate',
}
const SOCIAL_LINKS = {
  github: 'https://github.com/HenderLCH',
  instagram: 'https://instagram.com/henderjr',
  linkedin: 'https://www.linkedin.com/in/hender-eduardo-labrador-chacon/',
}

function CountrySection({ country, stickersState, toggleSticker, setStickerState }) {
  const [isOpen, setIsOpen] = useState(false)
  const stickers = useMemo(
    () => Array.from({ length: albumMeta.stickersPerCountry }, (_, i) => `${country.code} ${i + 1}`),
    [country.code],
  )

  const ownedCount = stickers.filter((id) => Boolean(stickersState[id])).length
  const isCompleted = ownedCount === albumMeta.stickersPerCountry

  const markAll = () => {
    stickers.forEach((id) => {
      if (!stickersState[id]) {
        setStickerState(id, STICKER_STATE.OWNED)
      }
    })
  }

  const clearAll = () => {
    stickers.forEach((id) => {
      if (stickersState[id]) {
        setStickerState(id, null)
      }
    })
  }

  return (
    <article
      className={`rounded-xl border p-4 shadow-sm ${
        isCompleted
          ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20'
          : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          <ReactCountryFlag
            countryCode={country.flag}
            svg
            style={{ width: '1.6rem', height: '1.6rem' }}
            aria-label={`Bandera de ${country.name}`}
          />
          <div>
            <p
              className={`text-base font-semibold ${
                isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {country.name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{country.code}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {ownedCount}/{albumMeta.stickersPerCountry}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{isOpen ? 'Ocultar' : 'Ver barajitas'}</p>
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={markAll}
              className="rounded-md border border-emerald-400 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            >
              Marcar todo
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Limpiar
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
            {stickers.map((stickerId) => {
              const status = stickersState[stickerId]
              const isOwned = status === STICKER_STATE.OWNED
              const isDuplicate = status === STICKER_STATE.DUPLICATE
              return (
                <button
                  key={stickerId}
                  type="button"
                  onClick={() => toggleSticker(stickerId)}
                  className={`rounded-md border px-2 py-2 text-sm font-medium transition ${
                    isOwned
                      ? 'border-emerald-600 bg-emerald-500 text-white'
                      : isDuplicate
                        ? 'border-amber-500 bg-amber-400 text-slate-900'
                      : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {stickerId}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}

function GroupSection({ group, stickersState, toggleSticker, setStickerState }) {
  const [isOpen, setIsOpen] = useState(false)

  const groupStickerIds = group.countries.flatMap((country) =>
    Array.from({ length: albumMeta.stickersPerCountry }, (_, i) => `${country.code} ${i + 1}`),
  )
  const ownedInGroup = groupStickerIds.filter((id) => Boolean(stickersState[id])).length

  return (
    <section id={`group-${group.id}`} className="scroll-mt-28 rounded-2xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Grupo {group.id}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{group.countries.length} paises</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {ownedInGroup}/{groupStickerIds.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{isOpen ? 'Ocultar grupo' : 'Abrir grupo'}</p>
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {group.countries.map((country) => (
            <CountrySection
              key={country.code}
              country={country}
              stickersState={stickersState}
              toggleSticker={toggleSticker}
              setStickerState={setStickerState}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function App() {
  const [stickersState, setStickersState] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      if (typeof parsed !== 'object' || parsed === null) return {}
      return Object.fromEntries(
        Object.entries(parsed)
          .map(([key, value]) => {
            if (value === STICKER_STATE.OWNED || value === true) return [key, STICKER_STATE.OWNED]
            if (value === STICKER_STATE.DUPLICATE) return [key, STICKER_STATE.DUPLICATE]
            return null
          })
          .filter(Boolean),
      )
    } catch {
      return {}
    }
  })
  const [darkMode, setDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem(THEME_KEY)
    if (storedTheme) return storedTheme === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stickersState))
  }, [stickersState])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const toggleSticker = (id) => {
    setStickersState((prev) => {
      const current = prev[id]
      if (!current) {
        return { ...prev, [id]: STICKER_STATE.OWNED }
      }
      if (current === STICKER_STATE.OWNED) {
        return { ...prev, [id]: STICKER_STATE.DUPLICATE }
      }
      if (current === STICKER_STATE.DUPLICATE) {
        const clone = { ...prev }
        delete clone[id]
        return clone
      }
      return prev
    })
  }

  const setStickerState = (id, state) => {
    setStickersState((prev) => {
      if (!state) {
        if (!prev[id]) return prev
        const clone = { ...prev }
        delete clone[id]
        return clone
      }
      if (prev[id] === state) return prev
      return { ...prev, [id]: state }
    })
  }

  const countryStickerTotal = albumMeta.totalCountries * albumMeta.stickersPerCountry
  const specialOwned = specialStickers.filter((id) => Boolean(stickersState[id])).length
  const countryOwned = Object.keys(stickersState).filter((id) => id.includes(' ')).length
  const duplicatesCount = Object.values(stickersState).filter(
    (value) => value === STICKER_STATE.DUPLICATE,
  ).length
  const ownedTotal = Object.keys(stickersState).length
  const percent = Math.round((ownedTotal / albumMeta.totalStickers) * 100)

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <header className="mb-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Album Mundial 2026
              </p>
              <h1 className="text-2xl font-bold md:text-3xl">Control de barajitas Panini</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {albumMeta.totalCountries} paises - {albumMeta.totalPages} paginas - {albumMeta.totalStickers} barajitas
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {darkMode ? 'Modo claro' : 'Modo oscuro'}
            </button>
          </div>

          <div className="mt-5 space-y-2">
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Tienes {ownedTotal} de {albumMeta.totalStickers} ({percent}%)
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paises: {countryOwned}/{countryStickerTotal} | Especiales: {specialOwned}/{specialStickers.length} |
              Repetidas: {duplicatesCount}
            </p>
          </div>
        </header>

        <nav className="sticky top-0 z-10 mb-6 rounded-xl border border-slate-300 bg-white/95 p-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Ir rapido a un grupo
          </p>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() =>
                  document.getElementById(`group-${group.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Grupo {group.id}
              </button>
            ))}
          </div>
        </nav>

        <section className="mb-6 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Barajitas especiales</h2>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">00, FWC, copa, balon, mascota y slogan</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {specialStickers.map((id) => {
              const status = stickersState[id]
              const isOwned = status === STICKER_STATE.OWNED
              const isDuplicate = status === STICKER_STATE.DUPLICATE
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleSticker(id)}
                  className={`rounded-md border px-2 py-2 text-sm font-semibold ${
                    isOwned
                      ? 'border-emerald-600 bg-emerald-500 text-white'
                      : isDuplicate
                        ? 'border-amber-500 bg-amber-400 text-slate-900'
                      : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {id}
                </button>
              )
            })}
          </div>
        </section>

        <div className="space-y-4">
          {groups.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              stickersState={stickersState}
              toggleSticker={toggleSticker}
              setStickerState={setStickerState}
            />
          ))}
        </div>

        <footer className="mt-8 rounded-2xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Elaborado por <span className="font-semibold">HenderLCH</span>
            </p>

            <div className="flex items-center gap-3">
              <a
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub de HenderLCH"
                className="rounded-full border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                  <path d="M12 0.5C5.37 0.5 0 5.88 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.28-.01-1.03-.02-2.02-3.34.73-4.05-1.61-4.05-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.24 1.84 1.24 1.08 1.84 2.82 1.31 3.51 1 .11-.78.42-1.31.76-1.61-2.67-.31-5.47-1.34-5.47-5.94 0-1.31.47-2.38 1.24-3.22-.13-.31-.54-1.57.12-3.28 0 0 1.01-.32 3.3 1.23a11.43 11.43 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.71.25 2.97.12 3.28.78.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.93.43.38.81 1.12.81 2.26 0 1.63-.01 2.95-.01 3.35 0 .32.21.7.82.58C20.56 22.3 24 17.8 24 12.5 24 5.88 18.63.5 12 .5Z" />
                </svg>
              </a>

              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram de HenderLCH"
                className="rounded-full border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm-.2 1.8A3.95 3.95 0 0 0 3.8 7.55v8.9A3.95 3.95 0 0 0 7.55 20.2h8.9a3.95 3.95 0 0 0 3.75-3.75v-8.9a3.95 3.95 0 0 0-3.75-3.75h-8.9ZM17.7 5.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z" />
                </svg>
              </a>

              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn de HenderLCH"
                className="rounded-full border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.5 9.5h5v12h-5v-12Zm8 0h4.78v1.71h.07c.66-1.25 2.28-2.57 4.7-2.57 5.03 0 5.95 3.31 5.95 7.62v5.24h-4.99v-4.65c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.2-1.79 2.45v4.74H10.5v-12Z" />
                </svg>
              </a>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">Copyright 2026</p>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default App
