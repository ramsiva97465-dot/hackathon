import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const allTeams = await prisma.team.findMany({
    select: {
      name: true,
      agentName: true,
      agentPhoneNumber: true,
      projectTitle: true,
      tableNumber: true,
      round: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  const submitted = allTeams.filter(t => 
    (t.agentPhoneNumber && t.agentPhoneNumber !== 'N/A' && t.agentPhoneNumber.trim() !== '') ||
    (t.agentName && t.agentName !== 'N/A' && t.agentName.trim() !== '') ||
    (t.projectTitle && t.projectTitle !== 'N/A' && t.projectTitle.trim() !== '')
  )

  console.log(`| # | Team Name | Table No | Agent Name | Agent Phone Number | Project Title | Round |`)
  console.log(`| :---: | :--- | :---: | :--- | :---: | :--- | :---: |`)
  submitted.forEach((t, idx) => {
    console.log(`| ${idx + 1} | **${t.name}** | ${t.tableNumber || 'N/A'} | ${t.agentName || 'N/A'} | \`${t.agentPhoneNumber || 'N/A'}\` | ${t.projectTitle || 'N/A'} | Round ${t.round} |`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
