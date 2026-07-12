const AGREEMENT_SCHEMA_VERSION = 1
const boundarySectionIds = ['communication', 'privacy', 'conflict']

export function createAgreementDraft(user) {
  const timestamp = new Date().toISOString()

  return {
    id: `${user.email}-agreement-draft`,
    schemaVersion: AGREEMENT_SCHEMA_VERSION,
    ownerEmail: user.email,
    status: 'draft',
    partnerInviteStatus: 'not_started',
    sections: boundarySectionIds.map((id) => ({
      id,
      acceptedItemIds: [],
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function normalizeAgreementDraft(user, draft) {
  const baseDraft = createAgreementDraft(user)

  if (!draft || draft.schemaVersion !== AGREEMENT_SCHEMA_VERSION || !Array.isArray(draft.sections)) {
    return baseDraft
  }

  return {
    ...baseDraft,
    ...draft,
    id: `${user.email}-agreement-draft`,
    ownerEmail: user.email,
    schemaVersion: AGREEMENT_SCHEMA_VERSION,
    sections: boundarySectionIds.map((sectionId) => {
      const section = draft.sections.find((currentSection) => currentSection.id === sectionId)

      return {
        id: sectionId,
        acceptedItemIds: Array.isArray(section?.acceptedItemIds) ? section.acceptedItemIds : [],
      }
    }),
    updatedAt: new Date().toISOString(),
  }
}
