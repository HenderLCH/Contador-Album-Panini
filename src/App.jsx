import { useEffect, useMemo, useRef, useState } from 'react'
import ReactCountryFlag from 'react-country-flag'
import { albumMeta, groups, specialStickers } from './data/albumData'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const STORAGE_KEY = 'album-panini-2026-owned'
const COLLECTION_KEY = 'album-panini-2026-collection-id'
const THEME_KEY = 'album-panini-2026-theme'
const UNDO_HISTORY_LIMIT = 10
const SOCIAL_LINKS = {
  github: 'https://github.com/HenderLCH',
  instagram: 'https://instagram.com/henderjr',
  linkedin: 'https://www.linkedin.com/in/hender-eduardo-labrador-chacon/',
}

const createCollectionId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID().slice(0, 8).toUpperCase()
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

const normalizeStickerCounts = (rawData) => {
  if (typeof rawData !== 'object' || rawData === null) return {}

  return Object.fromEntries(
    Object.entries(rawData)
      .map(([key, value]) => {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
          return [key, Math.floor(value)]
        }
        if (value === true || value === 'owned') return [key, 1]
        if (value === 'duplicate') return [key, 2]
        return null
      })
      .filter(Boolean),
  )
}

const getStickerCount = (stickerCounts, id) => stickerCounts[id] ?? 0

const MOBILE_VIEWS = {
  PRINCIPAL: 'principal',
  RESTANTES: 'restantes',
  REPETIDAS: 'repetidas',
}

const buildCatalogSections = () => {
  const sections = [
    {
      key: 'especiales',
      title: 'Especiales',
      subtitle: 'Barajitas especiales',
      items: specialStickers.map((id) => ({ id, label: id })),
    },
  ]

  groups.forEach((group) => {
    group.countries.forEach((country) => {
      sections.push({
        key: `${group.id}-${country.code}`,
        title: country.name,
        subtitle: `Grupo ${group.id} · ${country.code}`,
        country,
        items: Array.from({ length: albumMeta.stickersPerCountry }, (_, index) => ({
          id: `${country.code} ${index + 1}`,
          label: String(index + 1),
        })),
      })
    })
  })

  return sections
}

function CatalogSectionHeader({ section, count, badgeClassName }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {section.country ? (
          <ReactCountryFlag
            countryCode={section.country.flag}
            svg
            style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0 }}
            aria-label={`Bandera de ${section.country.name}`}
          />
        ) : (
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            aria-hidden="true"
          >
            ★
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{section.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{section.subtitle}</p>
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badgeClassName}`}>{count}</span>
    </div>
  )
}

function MobileViewTabs({ mobileView, setMobileView, remainingCount, duplicatesCount }) {
  const tabs = [
    { id: MOBILE_VIEWS.PRINCIPAL, label: 'Album' },
    { id: MOBILE_VIEWS.RESTANTES, label: `Faltan (${remainingCount})` },
    { id: MOBILE_VIEWS.REPETIDAS, label: `Rep. (${duplicatesCount})` },
  ]

  return (
    <nav className="sticky top-0 z-20 mb-4 grid grid-cols-3 gap-1 rounded-xl border border-slate-300 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setMobileView(tab.id)}
          className={`rounded-lg px-2 py-2 text-xs font-semibold ${
            mobileView === tab.id
              ? 'bg-emerald-500 text-white'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

function MobileRestantesView({ catalogSections, stickerCounts, markAsOwned, remainingCount }) {
  if (remainingCount === 0) {
    return (
      <div className="rounded-xl border border-emerald-400 bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-800 md:hidden dark:bg-emerald-900/30 dark:text-emerald-200">
        No te falta ninguna barajita.
      </div>
    )
  }

  return (
    <div className="space-y-3 md:hidden">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Toca una barajita para marcarla como obtenida. Desaparecera de esta lista.
      </p>
      {catalogSections.map((section) => {
        const remainingItems = section.items.filter((item) => getStickerCount(stickerCounts, item.id) === 0)
        if (remainingItems.length === 0) return null

        return (
          <article
            key={section.key}
            className="rounded-xl border border-slate-300 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <CatalogSectionHeader
              section={section}
              count={remainingItems.length}
              badgeClassName="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            />
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
              {remainingItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsOwned(item.id)}
                  className="min-h-9 rounded-md border border-slate-300 bg-slate-100 px-1 text-xs font-bold text-slate-800 hover:bg-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-emerald-900/40"
                  title={item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function MobileRepetidasView({ catalogSections, stickerCounts, subtractDuplicate, duplicatesCount }) {
  if (duplicatesCount === 0) {
    return (
      <div className="rounded-xl border border-slate-300 bg-white p-4 text-center text-sm font-medium text-slate-600 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        No tienes repetidas por ahora.
      </div>
    )
  }

  return (
    <div className="space-y-3 md:hidden">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Toca una repetida para restar 1. Si solo queda una copia, desaparece de esta lista.
      </p>
      {catalogSections.map((section) => {
        const duplicateItems = section.items
          .map((item) => ({
            ...item,
            duplicateCount: getStickerCount(stickerCounts, item.id) - 1,
          }))
          .filter((item) => item.duplicateCount > 0)

        if (duplicateItems.length === 0) return null

        return (
          <article
            key={section.key}
            className="rounded-xl border border-amber-400 bg-amber-50 p-3 shadow-sm dark:border-amber-600 dark:bg-amber-900/20"
          >
            <CatalogSectionHeader
              section={section}
              count={duplicateItems.length}
              badgeClassName="bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100"
            />
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
              {duplicateItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => subtractDuplicate(item.id)}
                  className="flex min-h-11 flex-col items-center justify-center rounded-md border border-amber-500 bg-amber-300 px-1 text-xs font-bold text-slate-900 hover:bg-amber-200"
                  title={item.id}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] font-extrabold">x{item.duplicateCount}</span>
                </button>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}

const escapeCsvField = (value) => {
  const text = String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

const CSV_MAX_COLUMNS = 10

const chunkIntoGridRows = (cells, columns = CSV_MAX_COLUMNS) => {
  const rows = []
  for (let index = 0; index < cells.length; index += columns) {
    rows.push(cells.slice(index, index + columns))
  }
  return rows
}

const gridRowToCsvLine = (cells) => cells.map(escapeCsvField).join(',')

const buildAlbumCsv = (allStickerIds, stickerCounts) => {
  const remaining = allStickerIds.filter((id) => getStickerCount(stickerCounts, id) === 0)
  const duplicateCells = allStickerIds
    .map((id) => ({ id, duplicateCount: getStickerCount(stickerCounts, id) - 1 }))
    .filter(({ duplicateCount }) => duplicateCount > 0)
    .map(({ id, duplicateCount }) => `${id} (${duplicateCount})`)

  const lines = [
    'Restantes',
    ...chunkIntoGridRows(remaining).map(gridRowToCsvLine),
    '',
    'Repetidas',
    ...chunkIntoGridRows(duplicateCells).map(gridRowToCsvLine),
  ]

  return lines.join('\r\n')
}

const downloadAlbumCsv = (allStickerIds, stickerCounts, collectionId) => {
  const csv = buildAlbumCsv(allStickerIds, stickerCounts)
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `album-panini-${collectionId}-${date}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function StickerButton({ id, count, increaseSticker, decreaseSticker, resetSticker }) {
  const isOwned = count > 0
  const hasDuplicates = count > 1

  const confirmReset = () => {
    if (window.confirm(`Estas seguro que quieres desmarcar ${id} y dejarla en 0?`)) {
      resetSticker(id)
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-md border text-sm font-medium transition ${
        hasDuplicates
          ? 'border-amber-500 bg-amber-400 text-slate-900'
          : isOwned
            ? 'border-emerald-600 bg-emerald-500 text-white'
            : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
      }`}
    >
      <div className="flex min-h-16 w-full flex-col items-center justify-center px-2 py-3">
        <span className="text-base font-bold">{id}</span>
        {!isOwned && <span className="text-xs font-bold">Sin marcar</span>}
        {hasDuplicates && <span className="text-xs font-bold">Repetidas: {count - 1}</span>}
      </div>
      <div className="grid grid-cols-3 border-t border-black/10 text-sm font-bold dark:border-white/20">
        <button
          type="button"
          onClick={() => increaseSticker(id)}
          className="min-h-11 px-2 py-2 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Sumar ${id}`}
        >
          +1
        </button>
        <button
          type="button"
          onClick={() => decreaseSticker(id)}
          disabled={!isOwned}
          className="min-h-11 border-x border-black/10 px-2 py-2 hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/10"
          aria-label={`Restar ${id}`}
        >
          -1
        </button>
        <button
          type="button"
          onClick={confirmReset}
          disabled={!isOwned}
          className="min-h-11 px-2 py-2 hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10"
          aria-label={`Desmarcar ${id}`}
        >
          0
        </button>
      </div>
    </div>
  )
}

function CountrySection({ country, stickerCounts, increaseSticker, decreaseSticker, resetSticker, setStickerCount }) {
  const [isOpen, setIsOpen] = useState(false)
  const stickers = useMemo(
    () => Array.from({ length: albumMeta.stickersPerCountry }, (_, i) => `${country.code} ${i + 1}`),
    [country.code],
  )

  const ownedCount = stickers.filter((id) => getStickerCount(stickerCounts, id) > 0).length
  const isCompleted = ownedCount === albumMeta.stickersPerCountry

  const markAll = () => {
    if (!window.confirm(`Estas seguro que quieres marcar todas las barajitas de ${country.name}?`)) return

    stickers.forEach((id) => {
      if (getStickerCount(stickerCounts, id) === 0) {
        setStickerCount(id, 1)
      }
    })
  }

  const clearAll = () => {
    if (!window.confirm(`Estas seguro que quieres limpiar todas las barajitas de ${country.name}?`)) return

    stickers.forEach((id) => {
      if (getStickerCount(stickerCounts, id) > 0) {
        setStickerCount(id, 0)
      }
    })
  }

  return (
    <article
      className={`rounded-xl border p-3 shadow-sm md:p-4 ${
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {stickers.map((stickerId) => (
              <StickerButton
                key={stickerId}
                id={stickerId}
                count={getStickerCount(stickerCounts, stickerId)}
                increaseSticker={increaseSticker}
                decreaseSticker={decreaseSticker}
                resetSticker={resetSticker}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function GroupSection({ group, stickerCounts, increaseSticker, decreaseSticker, resetSticker, setStickerCount }) {
  const [isOpen, setIsOpen] = useState(false)

  const groupStickerIds = group.countries.flatMap((country) =>
    Array.from({ length: albumMeta.stickersPerCountry }, (_, i) => `${country.code} ${i + 1}`),
  )
  const ownedInGroup = groupStickerIds.filter((id) => getStickerCount(stickerCounts, id) > 0).length

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
              stickerCounts={stickerCounts}
              increaseSticker={increaseSticker}
              decreaseSticker={decreaseSticker}
              resetSticker={resetSticker}
              setStickerCount={setStickerCount}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function App() {
  const [stickerCounts, setStickerCounts] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      return normalizeStickerCounts(parsed)
    } catch {
      return {}
    }
  })
  const [collectionId, setCollectionId] = useState(() => localStorage.getItem(COLLECTION_KEY) || createCollectionId())
  const [collectionInput, setCollectionInput] = useState(collectionId)
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? 'Cargando Supabase...' : 'Configura Supabase para sincronizar')
  const [cloudReady, setCloudReady] = useState(!isSupabaseConfigured)
  const latestStickerCounts = useRef(stickerCounts)
  const undoStackRef = useRef([])
  const [undoStackSize, setUndoStackSize] = useState(0)
  const [mobileView, setMobileView] = useState(MOBILE_VIEWS.PRINCIPAL)
  const [darkMode, setDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem(THEME_KEY)
    if (storedTheme) return storedTheme === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stickerCounts))
    latestStickerCounts.current = stickerCounts
  }, [stickerCounts])

  useEffect(() => {
    localStorage.setItem(COLLECTION_KEY, collectionId)
  }, [collectionId])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let isCancelled = false

    const loadCollection = async () => {
      setCloudReady(false)
      setSyncStatus('Cargando desde Supabase...')

      const { data, error } = await supabase
        .from('album_collections')
        .select('stickers')
        .eq('collection_id', collectionId)
        .maybeSingle()

      if (isCancelled) return

      if (error) {
        setSyncStatus(`Error al cargar: ${error.message}`)
        setCloudReady(true)
        return
      }

      if (data?.stickers) {
        const loadedStickerCounts = normalizeStickerCounts(data.stickers)
        latestStickerCounts.current = loadedStickerCounts
        setStickerCounts(loadedStickerCounts)
        setSyncStatus('Datos cargados desde Supabase')
      } else {
        const { error: insertError } = await supabase.from('album_collections').insert({
          collection_id: collectionId,
          stickers: latestStickerCounts.current,
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          setSyncStatus(`Error al crear coleccion: ${insertError.message}`)
        } else {
          setSyncStatus('Coleccion creada en Supabase')
        }
      }

      setCloudReady(true)
    }

    loadCollection()

    return () => {
      isCancelled = true
    }
  }, [collectionId])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !cloudReady) return

    const saveTimeout = window.setTimeout(async () => {
      setSyncStatus('Guardando en Supabase...')

      const { error } = await supabase.from('album_collections').upsert({
        collection_id: collectionId,
        stickers: stickerCounts,
        updated_at: new Date().toISOString(),
      })

      setSyncStatus(error ? `Error al guardar: ${error.message}` : 'Sincronizado con Supabase')
    }, 700)

    return () => window.clearTimeout(saveTimeout)
  }, [cloudReady, collectionId, stickerCounts])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const recordUndoStep = (change) => {
    undoStackRef.current = [...undoStackRef.current, change].slice(-UNDO_HISTORY_LIMIT)
    setUndoStackSize(undoStackRef.current.length)
  }

  const setStickerCount = (id, count, shouldTrackChange = true) => {
    const previousStickerCounts = latestStickerCounts.current
    const previousCount = getStickerCount(previousStickerCounts, id)
    const nextCount = Math.max(Math.floor(count), 0)

    if (previousCount === nextCount) return

    const nextStickerCounts = { ...previousStickerCounts }
    if (nextCount === 0) {
      delete nextStickerCounts[id]
    } else {
      nextStickerCounts[id] = nextCount
    }

    latestStickerCounts.current = nextStickerCounts
    setStickerCounts(nextStickerCounts)

    if (shouldTrackChange) {
      recordUndoStep({ id, previousCount })
    }
  }

  const increaseSticker = (id) => {
    setStickerCount(id, getStickerCount(latestStickerCounts.current, id) + 1)
  }

  const decreaseSticker = (id) => {
    setStickerCount(id, getStickerCount(latestStickerCounts.current, id) - 1)
  }

  const resetSticker = (id) => setStickerCount(id, 0)

  const undoLastChangeRef = useRef(() => {})

  useEffect(() => {
    undoLastChangeRef.current = () => {
      const undoStack = undoStackRef.current
      if (undoStack.length === 0) return

      const lastStep = undoStack[undoStack.length - 1]
      undoStackRef.current = undoStack.slice(0, -1)
      setUndoStackSize(undoStackRef.current.length)
      setStickerCount(lastStep.id, lastStep.previousCount, false)
    }
  })

  const undoLastChange = () => undoLastChangeRef.current()

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z' || event.shiftKey) return

      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, [contenteditable="true"]')) return

      event.preventDefault()
      undoLastChangeRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const useCollection = (event) => {
    event.preventDefault()
    const nextCollectionId = collectionInput.trim()
    if (nextCollectionId) setCollectionId(nextCollectionId)
  }

  const copyCollectionId = async () => {
    await navigator.clipboard?.writeText(collectionId)
  }

  const countryStickerIds = useMemo(
    () =>
      groups.flatMap((group) =>
        group.countries.flatMap((country) =>
          Array.from({ length: albumMeta.stickersPerCountry }, (_, i) => `${country.code} ${i + 1}`),
        ),
      ),
    [],
  )

  const allStickerIds = useMemo(() => [...specialStickers, ...countryStickerIds], [countryStickerIds])
  const catalogSections = useMemo(() => buildCatalogSections(), [])

  const exportCsv = () => downloadAlbumCsv(allStickerIds, stickerCounts, collectionId)

  const markAsOwned = (id) => setStickerCount(id, 1)
  const subtractDuplicate = (id) => decreaseSticker(id)

  const remainingCount = allStickerIds.filter((id) => getStickerCount(stickerCounts, id) === 0).length
  const countryStickerTotal = albumMeta.totalCountries * albumMeta.stickersPerCountry
  const specialOwned = specialStickers.filter((id) => getStickerCount(stickerCounts, id) > 0).length
  const countryOwned = countryStickerIds.filter((id) => getStickerCount(stickerCounts, id) > 0).length
  const duplicatesCount = Object.values(stickerCounts).reduce((total, count) => total + Math.max(count - 1, 0), 0)
  const physicalStickersCount = Object.values(stickerCounts).reduce((total, count) => total + count, 0)
  const ownedTotal = Object.values(stickerCounts).filter((count) => count > 0).length
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

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Exportar CSV
              </button>
              <button
                type="button"
                onClick={undoLastChange}
                disabled={undoStackSize === 0}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                title={`Deshacer hasta ${UNDO_HISTORY_LIMIT} pasos (Ctrl+Z)`}
              >
                Deshacer{undoStackSize > 0 ? ` (${undoStackSize})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                {darkMode ? 'Modo claro' : 'Modo oscuro'}
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Tienes {ownedTotal} de {albumMeta.totalStickers} ({percent}%) · Faltan {remainingCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paises: {countryOwned}/{countryStickerTotal} | Especiales: {specialOwned}/{specialStickers.length} |
              Repetidas: {duplicatesCount} | Total fisicas: {physicalStickersCount}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 md:hidden">
              En movil usa Faltan y Rep. En Album puedes sumar repetidas con +1.
            </p>
            <p className="hidden text-xs font-medium text-slate-500 dark:text-slate-400 md:block">
              Usa +1 para sumar, -1 para restar y 0 para desmarcar. Deshacer guarda los ultimos {UNDO_HISTORY_LIMIT}{' '}
              pasos (Ctrl+Z).
            </p>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-bold">Sincronizacion</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Usa el mismo codigo de coleccion en tu PC y celular para compartir los datos.
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{syncStatus}</p>
            </div>

            <form onSubmit={useCollection} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={collectionInput}
                onChange={(event) => setCollectionInput(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                aria-label="Codigo de coleccion"
              />
              <button
                type="submit"
                className="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
              >
                Usar codigo
              </button>
              <button
                type="button"
                onClick={copyCollectionId}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Copiar
              </button>
            </form>
          </div>
        </section>

        <MobileViewTabs
          mobileView={mobileView}
          setMobileView={setMobileView}
          remainingCount={remainingCount}
          duplicatesCount={duplicatesCount}
        />

        {mobileView === MOBILE_VIEWS.RESTANTES && (
          <MobileRestantesView
            catalogSections={catalogSections}
            stickerCounts={stickerCounts}
            markAsOwned={markAsOwned}
            remainingCount={remainingCount}
          />
        )}

        {mobileView === MOBILE_VIEWS.REPETIDAS && (
          <MobileRepetidasView
            catalogSections={catalogSections}
            stickerCounts={stickerCounts}
            subtractDuplicate={subtractDuplicate}
            duplicatesCount={duplicatesCount}
          />
        )}

        <div className={mobileView === MOBILE_VIEWS.PRINCIPAL ? '' : 'hidden md:block'}>
        <nav className="sticky top-0 z-10 mb-6 rounded-xl border border-slate-300 bg-white/95 p-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 md:top-0">
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
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Usa +1 para sumar cantidad, -1 para restar y 0 para desmarcar por completo.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {specialStickers.map((id) => (
              <StickerButton
                key={id}
                id={id}
                count={getStickerCount(stickerCounts, id)}
                increaseSticker={increaseSticker}
                decreaseSticker={decreaseSticker}
                resetSticker={resetSticker}
              />
            ))}
          </div>
        </section>

        <div className="space-y-4">
          {groups.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              stickerCounts={stickerCounts}
              increaseSticker={increaseSticker}
              decreaseSticker={decreaseSticker}
              resetSticker={resetSticker}
              setStickerCount={setStickerCount}
            />
          ))}
        </div>
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
