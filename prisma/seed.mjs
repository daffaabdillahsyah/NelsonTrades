import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Set up __dirname for the generated client
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Set the DATABASE_URL from .env if not already set
import { readFileSync } from 'fs'
try {
  const envPath = join(__dirname, '..', '.env')
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^"|"$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  }
} catch {}

const { PrismaClient } = await import('../app/generated/prisma/client.ts')
const { default: bcrypt } = await import('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminHash = await bcrypt.hash('admin123', 12)
  const userHash = await bcrypt.hash('user123', 12)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminHash, role: 'ADMIN' },
  })
  const user1 = await prisma.user.upsert({
    where: { username: 'user1' },
    update: {},
    create: { username: 'user1', password: userHash, role: 'USER' },
  })
  console.log('Users:', admin.username, user1.username)

  const SAMPLE_VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  const categories = ['Basic', 'Intermediate', 'Advanced', 'Backtesting', 'Fundamental']

  for (let i = 0; i < categories.length; i++) {
    const name = categories[i]
    const existing = await prisma.category.findFirst({ where: { name } })
    if (existing) { console.log(`Skipping "${name}"`); continue }

    const cat = await prisma.category.create({ data: { name, order: i } })
    for (let j = 0; j < 2; j++) {
      const sub = await prisma.subCategory.create({
        data: { categoryId: cat.id, name: `${name} Part ${j + 1}`, order: j },
      })
      await prisma.video.create({
        data: {
          subCategoryId: sub.id,
          title: `Introduction to ${name} Part ${j + 1}`,
          youtubeUrl: SAMPLE_VIDEO,
          description: `Sample video for ${name} - Part ${j + 1}.`,
          order: 0,
        },
      })
    }
    console.log(`Created: ${name}`)
  }

  console.log('\nSeed complete!')
  console.log('Admin: admin / admin123')
  console.log('User:  user1 / user123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
