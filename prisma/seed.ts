import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 12);

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

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@localpro.demo',
      passwordHash,
      role: 'admin',
      location: 'Konaseema, Andhra Pradesh',
      latitude: 16.579,
      longitude: 82.006,
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@demo.com',
      phone: '+919876543210',
      passwordHash,
      role: 'customer',
      location: 'Amalapuram, Konaseema',
      latitude: 16.5787,
      longitude: 82.0061,
    },
  });

  const workers = [
    { name: 'Rajesh Kumar', email: 'rajesh@demo.com', category: 'electrician', skills: 'Wiring, Switchboards, LED Installation, Safety Inspections', experience: 8, pricing: '₹400 visit + ₹200/hr', rating: 4.8, bio: 'Licensed electrician serving Konaseema for over 8 years.', lat: 16.582, lng: 82.012 },
    { name: 'Suresh Reddy', email: 'suresh@demo.com', category: 'plumber', skills: 'Pipe Repair, Tap Installation, Drainage, Water Heaters', experience: 6, pricing: '₹350 visit + ₹150/hr', rating: 4.6, bio: 'Expert plumber serving Konaseema for over 6 years.', lat: 16.571, lng: 82.018 },
    { name: 'Anita Desai', email: 'anita@demo.com', category: 'tutor', skills: 'Mathematics, Physics, CBSE, EAMCET Prep', experience: 10, pricing: '₹600/hr', rating: 4.9, bio: 'Experienced tutor helping students achieve academic excellence.', lat: 16.585, lng: 81.998 },
    { name: 'Lakshmi Devi', email: 'lakshmi@demo.com', category: 'cleaning', skills: 'Deep Cleaning, Kitchen, Bathroom, Move-out Cleaning', experience: 5, pricing: '₹800/session', rating: 4.7, bio: 'Professional home cleaner with attention to detail.', lat: 16.568, lng: 82.005 },
    { name: 'Mohammed Ali', email: 'ali@demo.com', category: 'carpenter', skills: 'Furniture, Doors, Cabinets, Custom Woodwork', experience: 12, pricing: '₹500 visit + ₹250/hr', rating: 4.5, bio: 'Master carpenter specializing in custom furniture.', lat: 16.576, lng: 82.022 },
    { name: 'Vikram Singh', email: 'vikram@demo.com', category: 'painter', skills: 'Interior, Exterior, Texture, Waterproofing', experience: 7, pricing: '₹18/sq ft', rating: 4.4, bio: 'Quality painting services with premium finishes.', lat: 16.590, lng: 82.008 },
    { name: 'Kiran Patel', email: 'kiran@demo.com', category: 'appliance', skills: 'AC, Fridge, Washing Machine, Microwave', experience: 9, pricing: '₹400 visit + parts extra', rating: 4.7, bio: 'Certified appliance technician for all major brands.', lat: 16.565, lng: 81.992 },
    { name: 'Ravi Teja', email: 'ravi@demo.com', category: 'mechanic', skills: 'Car Service, Bike Repair, Diagnostics', experience: 11, pricing: '₹500 visit + labour', rating: 4.6, bio: 'Experienced mechanic for cars and two-wheelers.', lat: 16.581, lng: 82.025 },
    { name: 'Deepa Rao', email: 'deepa@demo.com', category: 'beauty', skills: 'Haircut, Facial, Manicure, Bridal Makeup', experience: 4, pricing: '₹500–₹3000/session', rating: 4.8, bio: 'Professional beautician bringing salon quality to your home.', lat: 16.587, lng: 82.001 },
    { name: 'Gopal Naidu', email: 'gopal@demo.com', category: 'gardening', skills: 'Landscaping, Pruning, Lawn Care, Plant Setup', experience: 6, pricing: '₹600 visit', rating: 4.3, bio: 'Passionate gardener transforming outdoor spaces.', lat: 16.574, lng: 81.988 },
  ];

  const workerUsers = [];
  for (const w of workers) {
    const user = await prisma.user.create({
      data: {
        name: w.name,
        email: w.email,
        phone: '+91 9' + Math.floor(100000000 + Math.random() * 900000000),
        passwordHash,
        role: 'worker',
        location: 'Konaseema, Andhra Pradesh',
        latitude: w.lat,
        longitude: w.lng,
      },
    });
    await prisma.workerProfile.create({
      data: {
        userId: user.id,
        category: w.category,
        skills: w.skills,
        experience: w.experience,
        pricing: w.pricing,
        availability: 'Mon–Sat, 8 AM – 8 PM',
        verificationStatus: 'verified',
        rating: w.rating,
        reviewCount: Math.floor(Math.random() * 50) + 10,
        completedJobs: Math.floor(Math.random() * 100) + 20,
        bio: w.bio,
        serviceAreas: 'Amalapuram, Razole, Palakollu, Konaseema',
        travelRadius: 15,
        languages: 'English, Hindi, Telugu',
        isAvailable: true,
        profilePhoto: null,
      },
    });
    workerUsers.push(user);
  }

  const job1 = await prisma.job.create({
    data: {
      customerId: customer.id,
      title: 'Kitchen tap is leaking',
      category: 'plumber',
      description: 'The kitchen tap has been dripping constantly for 2 days. Need urgent repair.',
      location: 'Amalapuram, Konaseema',
      latitude: 16.5787,
      longitude: 82.0061,
      budget: '₹500 – ₹800',
      date: '2026-08-13',
      time: '10:00 AM',
      urgency: 'same-day',
      status: 'open',
    },
  });

  const job2 = await prisma.job.create({
    data: {
      customerId: customer.id,
      title: 'Switchboard making sparks',
      category: 'electrician',
      description: 'Main switchboard sparking when turning on AC. Need immediate help.',
      location: 'Amalapuram, Konaseema',
      latitude: 16.5787,
      longitude: 82.0061,
      budget: '₹600 – ₹1,200',
      date: '2026-08-12',
      time: 'ASAP',
      urgency: 'emergency',
      status: 'open',
    },
  });

  const plumber = workerUsers.find((_, i) => workers[i].category === 'plumber')!;
  await prisma.application.create({
    data: {
      jobId: job1.id,
      workerId: plumber.id,
      proposedPrice: '₹650',
      message: 'I can fix the leaking tap today. Have all necessary parts.',
      availability: 'Available today 2–6 PM',
      estimatedArrival: '45 minutes',
      status: 'pending',
    },
  });

  const electrician = workerUsers.find((_, i) => workers[i].category === 'electrician')!;
  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      workerId: electrician.id,
      service: 'electrician',
      description: 'Fix bedroom ceiling fan wiring',
      date: '2026-08-14',
      time: '11:00 AM',
      price: '₹750',
      status: 'confirmed',
      address: 'Amalapuram, Konaseema',
      urgency: 'normal',
    },
  });

  await prisma.message.createMany({
    data: [
      { senderId: customer.id, receiverId: electrician.id, bookingId: booking.id, message: 'Hi Rajesh, the ceiling fan in the master bedroom stopped working.' },
      { senderId: electrician.id, receiverId: customer.id, bookingId: booking.id, message: 'Hello Priya! I can come tomorrow at 11 AM. Is that convenient?' },
      { senderId: customer.id, receiverId: electrician.id, bookingId: booking.id, message: 'Perfect, see you then. The address is Banjara Hills Road No. 12.' },
    ],
  });

  await prisma.review.create({
    data: {
      customerId: customer.id,
      workerId: workerUsers[2].id,
      bookingId: booking.id,
      rating: 5,
      review: 'Excellent tutor! My daughter improved significantly in mathematics.',
    },
  });

  await prisma.notification.createMany({
    data: [
      { userId: customer.id, title: 'Welcome to LocalPro', message: 'Find trusted local workers near you.', type: 'info' },
      { userId: plumber.id, title: 'New Job Nearby', message: 'Kitchen tap repair — 2.3 km away', type: 'info' },
      { userId: electrician.id, title: 'Booking Confirmed', message: 'Priya Sharma confirmed booking for Aug 14.', type: 'success' },
    ],
  });

  console.log('Seed complete!');
  console.log('Demo accounts:');
  console.log('  Customer: priya@demo.com / password123');
  console.log('  Worker: rajesh@demo.com / password123');
  console.log('  Admin: admin@localpro.demo / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
