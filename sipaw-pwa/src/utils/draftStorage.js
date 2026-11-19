const PREFIX = 'sipaw_draft_'

export const saveDraft = (draftData, draftId = 'alat_create') => {
  try {
    localStorage.setItem(
      `${PREFIX}${draftId}`,
      JSON.stringify({ ...draftData, savedAt: new Date().toISOString() })
    )
    return true
  } catch {
    return false
  }
}

export const loadDraft = (draftId = 'alat_create') => {
  try {
    const raw = localStorage.getItem(`${PREFIX}${draftId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const deleteDraft = (draftId = 'alat_create') => {
  try {
    localStorage.removeItem(`${PREFIX}${draftId}`)
  } catch {
    // Ignore error
  }
}

export const hasDraft = (draftId = 'alat_create') => {
  try {
    return localStorage.getItem(`${PREFIX}${draftId}`) !== null
  } catch {
    return false
  }
}
