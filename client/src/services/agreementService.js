import { boundarySections } from '../data/boundarySections.js'
import { apiRequest } from './apiClient.js'

const AGREEMENT_SCHEMA_VERSION = 1

function normalizeEmail(user) {
  return user?.email?.trim().toLowerCase() || 'current-user'
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

export async function loadAgreementDraft(user) {
  const { agreement } = await apiRequest('/api/agreements/draft')
  return agreement || createAgreementDraft(user)
}

export async function saveAgreementDraft(_user, agreement) {
  const nextAgreement = {
    ...agreement,
    updatedAt: nowIsoString(),
  }
  const { agreement: savedAgreement } = await apiRequest('/api/agreements/draft', {
    method: 'PUT',
    body: JSON.stringify({ agreement: nextAgreement }),
  })

  return savedAgreement
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
  return 'database-backed'
}
