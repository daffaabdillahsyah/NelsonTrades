import { PrismaClient } from '../app/generated/prisma/client'
import bcrypt from 'bcryptjs'

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
  console.log('Users created:', admin.username, user1.username)

  const categoryNames = ['Basic', 'Intermediate', 'Advanced', 'Backtesting', 'Fundamental']
  const SAMPLE_VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i]
    const existing = await prisma.category.findFirst({ where: { name } })
    if (existing) {
      console.log(`Category "${name}" already exists, skipping.`)
      continue
    }

    const cat = await prisma.category.create({
      data: { name, order: i },
    })

    for (let j = 0; j < 2; j++) {
      const sub = await prisma.subCategory.create({
        data: { categoryId: cat.id, name: `${name} Part ${j + 1}`, order: j },
      })
      await prisma.video.create({
        data: {
          subCategoryId: sub.id,
          title: `Introduction to ${name} Part ${j + 1}`,
          youtubeUrl: SAMPLE_VIDEO,
          description: `Sample video for ${name} - Part ${j + 1}. This covers foundational concepts.`,
          order: 0,
        },
      })
    }
    console.log(`Created category: ${name}`)
  }

  console.log('\nSeed complete!')
  console.log('Admin login: admin / admin123')
  console.log('User login:  user1 / user123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
