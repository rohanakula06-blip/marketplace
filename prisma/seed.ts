import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.application.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.job.deleteMany();
  await prisma.workerDocument.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  const services = [
    { name: 'Electrical Repairs', category: 'electrician', description: 'Wiring, switchboards, lighting and power issues', icon: '⚡' },
    { name: 'Plumbing Services', category: 'plumber', description: 'Leaks, pipes, taps and drainage', icon: '🔧' },
    { name: 'Home Tutoring', category: 'tutor', description: 'Academic support for all grades', icon: '📚' },
    { name: 'Home Cleaning', category: 'cleaning', description: 'Deep cleaning and regular maintenance', icon: '🧹' },
    { name: 'Carpentry', category: 'carpenter', description: 'Furniture, doors and woodwork', icon: '🪚' },
    { name: 'Painting', category: 'painter', description: 'Interior and exterior painting', icon: '🎨' },
    { name: 'Appliance Repair', category: 'appliance', description: 'Fridge, AC, washing machine repairs', icon: '🔌' },
    { name: 'Vehicle Mechanics', category: 'mechanic', description: 'Car and bike servicing', icon: '🚗' },
    { name: 'Beauty at Home', category: 'beauty', description: 'Salon services at your doorstep', icon: '💇' },
    { name: 'Gardening', category: 'gardening', description: 'Landscaping and plant care', icon: '🌿' },
    { name: 'Pest Control', category: 'pest', description: 'Safe pest elimination', icon: '🐛' },
    { name: 'Moving Assistance', category: 'moving', description: 'Help with relocations', icon: '📦' },
  ];
  await prisma.service.createMany({ data: services });

  console.log('Seed complete — user database cleared. Services catalog only.');
  console.log('Register at /register/worker (pros) or sign up as a customer from the home page.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
