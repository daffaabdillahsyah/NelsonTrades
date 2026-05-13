import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response(null, { status: 401 })

  const formData = await request.formData()
  const files = formData.getAll('files')

  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const urls = []
  for (const file of files) {
    if (!(file instanceof File)) continue
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    await writeFile(join(uploadDir, filename), buffer)
    urls.push(`/uploads/${filename}`)
  }

  return Response.json({ urls })
}
