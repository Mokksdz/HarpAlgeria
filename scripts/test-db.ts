import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    console.log('Connecting to database...');
    const collections = await prisma.collection.findMany({
        take: 1
    });
    console.log('Successfully fetched collections:', collections);
    
    const products = await prisma.product.findMany({
        take: 1
    });
    console.log('Successfully fetched products:', products);

  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
