import fs from 'fs'
import path from 'path'

export type IdMapCollection = 'users' | 'attendees' | 'sessions' | 'messages' | 'session-attendance'

type MapShape = Record<string, Record<string, number>>

/**
 * Persists Mongo _id -> new Postgres id per collection to disk as it's built, so a failed
 * importPayload.ts run can resume instead of restarting from zero (matches records that already
 * exist by legacyMongoId rather than re-creating them).
 */
export class IdMap {
  private data: MapShape = {}

  constructor(private filePath: string) {
    if (fs.existsSync(filePath)) {
      this.data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }
  }

  get(collection: IdMapCollection, legacyId: string): number | undefined {
    return this.data[collection]?.[String(legacyId)]
  }

  set(collection: IdMapCollection, legacyId: string, newId: number) {
    if (!this.data[collection]) this.data[collection] = {}
    this.data[collection][String(legacyId)] = newId
    this.save()
  }

  /** Resolves a required relationship. Throws if the referenced record hasn't been migrated yet. */
  resolve(collection: IdMapCollection, legacyId: string): number {
    const resolved = this.get(collection, legacyId)
    if (resolved === undefined) {
      throw new Error(
        `Could not resolve ${collection} legacyMongoId=${legacyId} — it must be migrated before ` +
          `anything that references it (check migration order in importPayload.ts).`,
      )
    }
    return resolved
  }

  private save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true })
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
  }
}
