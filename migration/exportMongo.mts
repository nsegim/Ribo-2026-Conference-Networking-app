// Step 1 of 4. Connects to the legacy MongoDB **read-only** and dumps every source collection
// verbatim (raw _id's, no transformation) to a timestamped snapshot on disk. Decoupling export
// from import means a failed import can be retried against the same snapshot without hitting
// production Mongo again — important since the real cutover run happens during a live
// maintenance window.
import { MongoClient } from 'mongodb'
import fs from 'fs'
import path from 'path'

// Mongoose's default collection naming: lowercased, pluralized model name.
const MONGO_COLLECTIONS = ['admins', 'attendees', 'magiclinks', 'messages', 'sessions', 'sessionattendances']

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI env var is required (point it at the legacy backend\'s MongoDB).')
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = path.resolve(process.cwd(), 'migration/snapshots', timestamp, 'raw')
  fs.mkdirSync(outDir, { recursive: true })

  const counts: Record<string, number> = {}

  for (const name of MONGO_COLLECTIONS) {
    const docs = await db.collection(name).find({}).toArray()
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(docs, null, 2))
    counts[name] = docs.length
    console.log(`Exported ${docs.length} docs from "${name}"`)
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), 'migration/snapshots/latest.json'),
    JSON.stringify({ snapshot: timestamp, counts, exportedAt: new Date().toISOString() }, null, 2),
  )

  await client.close()
  console.log(`\nExport complete. Snapshot: ${timestamp}`)
}

main().catch((err) => {
  console.error('Export failed:', err)
  process.exit(1)
})
