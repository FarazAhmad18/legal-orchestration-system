import * as userRepo from '../repositories/user.repository.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signToken } from '../utils/jwt.js'
import ApiError from '../utils/ApiError.js'

export async function register({ email, password, role }) {
  const existing = await userRepo.findByEmail(email)
  if (existing) {
    throw ApiError.conflict('Email already registered')
  }

  const passwordHash = await hashPassword(password)
  const user = await userRepo.create({
    email,
    passwordHash,
    role: role || 'operator',
  })

  const token = signToken({ userId: user.id, email: user.email, role: user.role })

  return {
    user: { id: user.id, email: user.email, role: user.role },
    token,
  }
}

export async function login({ email, password }) {
  const user = await userRepo.findByEmail(email)
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password')
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password')
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role })

  return {
    user: { id: user.id, email: user.email, role: user.role },
    token,
  }
}
