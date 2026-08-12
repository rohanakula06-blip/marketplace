import { NextRequest, NextResponse } from 'next/server';
import { analyzeProblem } from '@/lib/ai';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { description, location } = await req.json();
    if (!description) {
      return NextResponse.json({ error: 'Description required' }, { status: 400 });
    }

    const analysis = analyzeProblem(description, location);

    const workers = await prisma.workerProfile.findMany({
      where: {
        category: analysis.category,
        verificationStatus: 'verified',
        isAvailable: true,
      },
      include: { user: { select: { id: true, name: true, location: true } } },
      take: 20,
    });

    return NextResponse.json({
      analysis,
      availableWorkers: workers.length,
      workers: workers.slice(0, 6).map((w) => ({
        id: w.userId,
        name: w.user.name,
        category: w.category,
        rating: w.rating,
        pricing: w.pricing,
        experience: w.experience,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
