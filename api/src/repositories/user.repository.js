import prisma from '../config/database.js'

export async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } })
}

export async function findById(id) {
  return prisma.user.findUnique({ where: { id } })
}

export async function create({ email, passwordHash, role }) {
  return prisma.user.create({
    data: { email, passwordHash, role },
  })
}
