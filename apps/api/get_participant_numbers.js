const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  });
}

const { PrismaClient } = require('../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const submitted = await prisma.team.findMany({
    where: {
      OR: [
        { projectTitle: { not: null } },
        { agentName: { not: null } },
        { agentSolution: { not: null } }
      ]
    },
    include: {
      members: true
    },
    orderBy: {
      tableNumber: 'asc'
    }
  });

  const allMembers = [];
  submitted.forEach(t => {
    t.members.forEach(m => {
      allMembers.push({
        teamName: t.name,
        tableNumber: t.tableNumber || 'Pending',
        memberName: m.name,
        email: m.email,
        phone: m.phone || 'N/A',
        role: m.role || 'Member'
      });
    });
  });

  console.log(JSON.stringify({
    totalSubmittedTeams: submitted.length,
    totalMembers: allMembers.length,
    members: allMembers
  }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
