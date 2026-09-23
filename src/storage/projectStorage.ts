import { openDB } from 'idb'
import type { CreatiBoxProject } from '../model/types'

const DB_NAME = 'creatibox'
const STORE = 'projects'
const AUTOSAVE_KEY = 'autosave'

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE)
      }
    },
  })
}

export async function saveAutosave(project: CreatiBoxProject): Promise<void> {
  const database = await db()
  await database.put(STORE, structuredClone(project), AUTOSAVE_KEY)
}

export async function loadAutosave(): Promise<CreatiBoxProject | undefined> {
  const database = await db()
  return database.get(STORE, AUTOSAVE_KEY)
}

export function exportProject(project: CreatiBoxProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${project.name.replace(/[^a-z0-9-_]+/gi, '-') || 'project'}.creatibox`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importProject(file: File): Promise<CreatiBoxProject> {
  const raw = JSON.parse(await file.text()) as CreatiBoxProject
  if (raw.formatVersion !== '0.1' || !raw.world || !Array.isArray(raw.world.entities)) {
    throw new Error('Unsupported or invalid CreatiBox project.')
  }
  return raw
}
