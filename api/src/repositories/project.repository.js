import prisma from '../config/database.js'

export async function create({ name, objective, createdBy }) {
  return prisma.project.create({
    data: { name, objective, createdBy },
    include: { creator: { select: { id: true, email: true } } },
  })
}

export async function findAll() {
  return prisma.project.findMany({
    include: {
      creator: { select: { id: true, email: true } },
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findByUserId(userId) {
  return prisma.project.findMany({
    where: { createdBy: userId },
    include: {
      creator: { select: { id: true, email: true } },
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findById(id) {
  return prisma.project.findUnique({
    where: { id },
    include: { creator: { select: { id: true, email: true } } },
  })
}
