import { albumMeta, groups, specialStickers } from './data/albumData'

export const SHARE_MODES = {
  REMAINING: 'remaining',
  DUPLICATES: 'duplicates',
  BOTH: 'both',
}

const COUNTRY_FLAG_BY_CODE = {
  SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
}

const getStickerCount = (stickerCounts, id) => stickerCounts[id] ?? 0

const isoToFlagEmoji = (iso) => {
  const normalized = iso.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2)
  if (normalized.length !== 2) return ''
  return String.fromCodePoint(...[...normalized].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65))
}

const getCountryFlagEmoji = (country) => COUNTRY_FLAG_BY_CODE[country.code] ?? isoToFlagEmoji(country.flag)

const formatSpecialNumber = (id) => (id === '00' ? '00' : id.replace('FWC ', ''))

const buildSpecialLines = (stickerCounts, type) => {
  const lines = []
  const isMatch = (id) => {
    const count = getStickerCount(stickerCounts, id)
    return type === SHARE_MODES.REMAINING ? count === 0 : count > 1
  }

  const matched = specialStickers.filter(isMatch)

  if (type === SHARE_MODES.REMAINING) {
    if (matched.length > 0) {
      lines.push(`FWC 🌎: ${matched.map(formatSpecialNumber).join(', ')}`)
    }
    return lines
  }

  const trophy = []
  const scroll = []

  matched.forEach((id) => {
    if (id === '00') {
      trophy.push('00')
      return
    }
    const number = parseInt(id.split(' ')[1], 10)
    if (number <= 8) trophy.push(String(number))
    else scroll.push(String(number))
  })

  if (trophy.length > 0) lines.push(`FWC 🏆: ${trophy.join(', ')}`)
  if (scroll.length > 0) lines.push(`FWC 📜: ${scroll.join(', ')}`)

  return lines
}

const buildCountryLines = (stickerCounts, type) => {
  const lines = []

  groups.forEach((group) => {
    group.countries.forEach((country) => {
      const numbers = []

      for (let index = 1; index <= albumMeta.stickersPerCountry; index += 1) {
        const id = `${country.code} ${index}`
        const count = getStickerCount(stickerCounts, id)

        if (type === SHARE_MODES.REMAINING && count === 0) numbers.push(String(index))
        if (type === SHARE_MODES.DUPLICATES && count > 1) numbers.push(String(index))
      }

      if (numbers.length > 0) {
        const flag = getCountryFlagEmoji(country)
        lines.push(`${country.code} ${flag}: ${numbers.join(', ')}`)
      }
    })
  })

  return lines
}

const buildSection = (stickerCounts, type, heading) => {
  const lines = buildSpecialLines(stickerCounts, type)
  lines.push(...buildCountryLines(stickerCounts, type))

  if (lines.length === 0) return []

  return [heading, ...lines]
}

export const buildShareListText = (stickerCounts, collectionId, mode) => {
  const output = ['Barajitas - Lista', `Usa ${collectionId}`]

  if (mode === SHARE_MODES.REMAINING || mode === SHARE_MODES.BOTH) {
    output.push('', ...buildSection(stickerCounts, SHARE_MODES.REMAINING, 'Me faltan'))
  }

  if (mode === SHARE_MODES.DUPLICATES || mode === SHARE_MODES.BOTH) {
    output.push('', ...buildSection(stickerCounts, SHARE_MODES.DUPLICATES, 'Repetidas'))
  }

  return output.join('\n').trim()
}

export const shareListText = async (text) => {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return { method: 'share' }
    } catch (error) {
      if (error?.name === 'AbortError') return { method: 'cancelled' }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer')

  return { method: 'whatsapp' }
}
