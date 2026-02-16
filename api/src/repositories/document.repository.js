import prisma from '../config/database.js'

export async function create({ projectId, filename, storagePath, mime }) {
  return prisma.document.create({
    data: { projectId, filename, storagePath, mime, status: 'uploaded' },
  })
}

export async function findByProjectId(projectId) {
  return prisma.document.findMany({
    where: { projectId },
    include: { _count: { select: { pages: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findById(id) {
  return prisma.document.findUnique({
    where: { id },
    include: { _count: { select: { pages: true } } },
  })
}

export async function updateStatus(id, status) {
  return prisma.document.update({
    where: { id },
    data: { status },
  })
}

export async function createPages(documentId, pages) {
  return prisma.documentPage.createMany({
    data: pages.map((p, i) => ({
      documentId,
      pageNum: p.pageNum ?? i + 1,
      text: p.text,
      metaJson: p.metaJson ?? null,
    })),
  })
}

export async function findPagesByDocumentId(documentId) {
  return prisma.documentPage.findMany({
    where: { documentId },
    orderBy: { pageNum: 'asc' },
  })
}

export async function deleteById(id) {
  // Delete pages first (cascading not automatic with Prisma)
  await prisma.documentPage.deleteMany({ where: { documentId: id } })
  return prisma.document.delete({ where: { id } })
}
