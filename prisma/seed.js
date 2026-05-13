const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')
const crypto = require('crypto')

const dbPath = path.resolve(__dirname, '..', 'dev.db')
const db = new Database(dbPath)

function cuid() {
  return 'c' + crypto.randomBytes(8).toString('hex')
}

function nowISO() {
  return new Date().toISOString()
}

async function main() {
  console.log('Seeding database...')

  const adminHash = await bcrypt.hash('admin123', 12)
  const userHash = await bcrypt.hash('user123', 12)

  const adminId = cuid()
  const userId = cuid()

  const existingAdmin = db.prepare('SELECT id FROM User WHERE username = ?').get('admin')
  if (!existingAdmin) {
    db.prepare('INSERT INTO User (id, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)').run(
      adminId, 'admin', adminHash, 'ADMIN', nowISO()
    )
    console.log('Created user: admin')
  } else {
    console.log('User admin already exists')
  }

  const existingUser1 = db.prepare('SELECT id FROM User WHERE username = ?').get('user1')
  if (!existingUser1) {
    db.prepare('INSERT INTO User (id, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)').run(
      userId, 'user1', userHash, 'USER', nowISO()
    )
    console.log('Created user: user1')
  } else {
    console.log('User user1 already exists')
  }

  const SAMPLE_VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  const categories = ['Basic', 'Intermediate', 'Advanced', 'Backtesting', 'Fundamental']

  for (let i = 0; i < categories.length; i++) {
    const name = categories[i]
    const existing = db.prepare('SELECT id FROM Category WHERE name = ?').get(name)
    if (existing) { console.log(`Category "${name}" exists, skipping.`); continue }

    const catId = cuid()
    db.prepare('INSERT INTO Category (id, name, "order", createdAt) VALUES (?, ?, ?, ?)').run(
      catId, name, i, nowISO()
    )

    for (let j = 0; j < 2; j++) {
      const subId = cuid()
      db.prepare('INSERT INTO SubCategory (id, categoryId, name, "order", createdAt) VALUES (?, ?, ?, ?, ?)').run(
        subId, catId, `${name} Part ${j + 1}`, j, nowISO()
      )

      const vidId = cuid()
      db.prepare('INSERT INTO Video (id, subCategoryId, title, youtubeUrl, description, "order", createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        vidId, subId,
        `Introduction to ${name} Part ${j + 1}`,
        SAMPLE_VIDEO,
        `Sample video for ${name} - Part ${j + 1}. This covers foundational concepts.`,
        0, nowISO()
      )
    }
    console.log(`Created category: ${name}`)
  }

  console.log('\nSeed complete!')
  console.log('Admin login: admin / admin123')
  console.log('User login:  user1 / user123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.close())
