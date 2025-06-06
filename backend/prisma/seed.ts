import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    // Read the simplified brands data
    const brandsPath = path.join(__dirname, '../src/scraper/debug/simplified-brands.json');
    const brands = JSON.parse(fs.readFileSync(brandsPath, 'utf-8'));

    console.log('Starting to seed brands...');

    // Create brands in the database
    for (const brand of brands) {
      await prisma.brand.upsert({
        where: { id: brand.id },
        update: { name: brand.name },
        create: {
          id: brand.id,
          name: brand.name,
        },
      });
    }

    console.log('Successfully seeded brands!');
  } catch (error) {
    console.error('Error seeding brands:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 