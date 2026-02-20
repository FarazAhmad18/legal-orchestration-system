import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminHash = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@legalintel.dev' },
    update: {},
    create: {
      email: 'admin@legalintel.dev',
      role: 'admin',
      passwordHash: adminHash,
    },
  })
  console.log('Seeded admin user:', admin.email)

  // Demo operator user
  const demoHash = await bcrypt.hash('demo123', 12)
  const demo = await prisma.user.upsert({
    where: { email: 'demo@legalintel.dev' },
    update: {},
    create: {
      email: 'demo@legalintel.dev',
      role: 'operator',
      passwordHash: demoHash,
    },
  })
  console.log('Seeded demo user:', demo.email)

  // Demo project (idempotent — check by name)
  let project = await prisma.project.findFirst({ where: { name: 'Johnson v. TechCorp - Contract Dispute' } })
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Johnson v. TechCorp - Contract Dispute',
        objective: 'Analyze the employment agreement and related correspondence to identify key facts, timeline of events, and potential issues regarding the non-compete clause and wrongful termination claims.',
        createdBy: admin.id,
      },
    })
    console.log('Created demo project:', project.name)

    // Sample documents with pages
    const docs = [
      {
        filename: 'Employment_Agreement_2023.txt',
        mime: 'text/plain',
        pages: [
          'EMPLOYMENT AGREEMENT\n\nThis Employment Agreement ("Agreement") is entered into as of January 15, 2023, by and between TechCorp Industries, Inc. ("Company") and Michael Johnson ("Employee").\n\n1. POSITION AND DUTIES\nEmployee shall serve as Senior Software Engineer, reporting to the Vice President of Engineering. Employee shall devote full-time efforts to the Company.',
          '2. COMPENSATION\nBase salary of $185,000 per annum, paid bi-weekly. Annual performance bonus of up to 20% of base salary at Company discretion.\n\n3. NON-COMPETE CLAUSE\nFor a period of 24 months following termination, Employee shall not engage in any business that competes with the Company within a 100-mile radius of the Company headquarters.',
          '4. TERMINATION\nEither party may terminate this Agreement with 30 days written notice. Company may terminate for cause immediately upon written notice specifying the grounds for termination.\n\n5. GOVERNING LAW\nThis Agreement shall be governed by the laws of the State of California.\n\nSigned: Michael Johnson (Employee)\nSigned: Sarah Chen, VP HR (TechCorp Industries, Inc.)',
        ],
      },
      {
        filename: 'Termination_Letter_Oct2024.txt',
        mime: 'text/plain',
        pages: [
          'TechCorp Industries, Inc.\n1200 Innovation Drive\nSan Jose, CA 95110\n\nOctober 3, 2024\n\nMr. Michael Johnson\n456 Oak Avenue\nSunnyvale, CA 94086\n\nRe: Termination of Employment\n\nDear Mr. Johnson,\n\nThis letter confirms that your employment with TechCorp Industries, Inc. is terminated effective immediately, October 3, 2024.',
          'The grounds for termination are as follows:\n- Violation of Company Code of Conduct, Section 4.2 (Unauthorized disclosure of proprietary information)\n- Failure to meet performance objectives for Q2 and Q3 2024\n\nYour final paycheck, including accrued vacation, will be mailed to your address on file. Please return all Company property within 5 business days.\n\nThe non-compete clause in your Employment Agreement remains in effect for 24 months from this date.\n\nSincerely,\nSarah Chen\nVP of Human Resources\nTechCorp Industries, Inc.',
        ],
      },
      {
        filename: 'Side_A_Response_Nov2024.txt',
        mime: 'text/plain',
        pages: [
          'LAW OFFICES OF MARTINEZ & ASSOCIATES\n789 Legal Center Blvd, Suite 400\nSan Jose, CA 95113\n\nNovember 1, 2024\n\nSarah Chen, VP Human Resources\nTechCorp Industries, Inc.\n1200 Innovation Drive\nSan Jose, CA 95110\n\nRe: Michael Johnson - Wrongful Termination Claim\n\nDear Ms. Chen,\n\nWe represent Mr. Michael Johnson regarding his termination from TechCorp Industries on October 3, 2024. We believe the termination was wrongful for the following reasons:',
          '1. The alleged Code of Conduct violation is unsubstantiated. Mr. Johnson did not disclose proprietary information. The presentation referenced at the industry conference contained only publicly available data.\n\n2. The performance claims are pretextual. Mr. Johnson received "Exceeds Expectations" ratings in Q1 2024 and prior quarters. No formal performance improvement plan was issued.\n\n3. The non-compete clause is overly broad and unenforceable under California Business and Professions Code Section 16600.\n\nWe demand reinstatement with back pay or, alternatively, a severance package of 12 months salary plus waiver of the non-compete clause.\n\nPlease respond within 15 business days.\n\nSincerely,\nRoberto Martinez, Esq.\nMartinez & Associates',
        ],
      },
    ]

    for (const doc of docs) {
      const created = await prisma.document.create({
        data: {
          projectId: project.id,
          filename: doc.filename,
          storagePath: `demo/${doc.filename}`,
          mime: doc.mime,
          status: 'parsed',
        },
      })
      await prisma.documentPage.createMany({
        data: doc.pages.map((text, i) => ({
          documentId: created.id,
          pageNum: i + 1,
          text,
        })),
      })
      console.log(`  Created document: ${doc.filename} (${doc.pages.length} pages)`)
    }
  } else {
    console.log('Demo project already exists:', project.name)
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
