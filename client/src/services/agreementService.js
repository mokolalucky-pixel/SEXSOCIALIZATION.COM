import { boundarySections } from '../data/boundarySections.js'

const AGREEMENT_SCHEMA_VERSION = 1
const STORAGE_PREFIX = 'sexsocialization.agreement'

function normalizeEmail(user) {
  return user?.email?.trim().toLowerCase() || 'local-user'
}

function storageKeyFor(user) {
  return `${STORAGE_PREFIX}.${normalizeEmail(user)}`
}

function nowIsoString() {
  return new Date().toISOString()
}

export function createAgreementDraft(user, sections = boundarySections) {
  const timestamp = nowIsoString()

  return {
    id: `${normalizeEmail(user)}-agreement-draft`,
    schemaVersion: AGREEMENT_SCHEMA_VERSION,
    ownerEmail: normalizeEmail(user),
    status: 'draft',
    partnerInviteStatus: 'not_started',
    sections: sections.map((section) => ({
      id: section.id,
      acceptedItemIds: [],
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function loadAgreementDraft(user) {
  if (typeof window === 'undefined') {
    return createAgreementDraft(user)
  }

  try {
    const storedAgreement = window.localStorage.getItem(storageKeyFor(user))

    if (!storedAgreement) {
      return createAgreementDraft(user)
    }

    const parsedAgreement = JSON.parse(storedAgreement)

    if (parsedAgreement?.schemaVersion !== AGREEMENT_SCHEMA_VERSION) {
      return createAgreementDraft(user)
    }

    return parsedAgreement
  } catch {
    return createAgreementDraft(user)
  }
}

export function saveAgreementDraft(user, agreement) {
  const nextAgreement = {
    ...agreement,
    updatedAt: nowIsoString(),
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKeyFor(user), JSON.stringify(nextAgreement))
  }

  return nextAgreement
}

export function isAgreementItemAccepted(agreement, sectionId, itemId) {
  const section = agreement?.sections?.find((currentSection) => currentSection.id === sectionId)

  return Boolean(section?.acceptedItemIds?.includes(itemId))
}

export function toggleAgreementItem(agreement, sectionId, itemId) {
  return {
    ...agreement,
    sections: agreement.sections.map((section) => {
      if (section.id !== sectionId) {
        return section
      }

      const acceptedItemIds = new Set(section.acceptedItemIds)

      if (acceptedItemIds.has(itemId)) {
        acceptedItemIds.delete(itemId)
      } else {
        acceptedItemIds.add(itemId)
      }

      return {
        ...section,
        acceptedItemIds: Array.from(acceptedItemIds),
      }
    }),
  }
}

export function countAcceptedItems(agreement) {
  return agreement?.sections?.reduce((count, section) => count + section.acceptedItemIds.length, 0) || 0
}

export function getPersistenceMode() {
  return import.meta.env.VITE_AGREEMENT_STORAGE_MODE || 'local-draft'
}
