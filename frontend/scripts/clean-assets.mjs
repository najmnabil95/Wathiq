import { readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const assetsDir = fileURLToPath(new URL('../../backend/public/assets/', import.meta.url))

try {
  const entries = await readdir(assetsDir)
  await Promise.all(
    entries
      .filter((name) => name.endsWith('.js') || name.endsWith('.css'))
      .map((name) => unlink(join(assetsDir, name)))
  )
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
