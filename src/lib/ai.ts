const KEYWORD_MAP: Record<string, { category: string; urgency: string; safety?: string }> = {
  spark: { category: 'electrician', urgency: 'high', safety: 'Switch off the main power supply immediately and do not touch the switchboard.' },
  electric: { category: 'electrician', urgency: 'high', safety: 'Switch off the main power supply immediately.' },
  wire: { category: 'electrician', urgency: 'medium', safety: 'Avoid touching exposed wires.' },
  switchboard: { category: 'electrician', urgency: 'high', safety: 'Switch off the main power supply immediately.' },
  leak: { category: 'plumber', urgency: 'medium', safety: 'Turn off the water supply valve if accessible.' },
  pipe: { category: 'plumber', urgency: 'medium', safety: 'Place a bucket under the leak if possible.' },
  tap: { category: 'plumber', urgency: 'low' },
  drain: { category: 'plumber', urgency: 'medium' },
  tutor: { category: 'tutor', urgency: 'low' },
  study: { category: 'tutor', urgency: 'low' },
  homework: { category: 'tutor', urgency: 'low' },
  clean: { category: 'cleaning', urgency: 'low' },
  maid: { category: 'cleaning', urgency: 'low' },
  carpenter: { category: 'carpenter', urgency: 'low' },
  furniture: { category: 'carpenter', urgency: 'low' },
  paint: { category: 'painter', urgency: 'low' },
  wall: { category: 'painter', urgency: 'low' },
  fridge: { category: 'appliance', urgency: 'medium' },
  washing: { category: 'appliance', urgency: 'medium' },
  ac: { category: 'appliance', urgency: 'medium' },
  car: { category: 'mechanic', urgency: 'low' },
  vehicle: { category: 'mechanic', urgency: 'low' },
  garden: { category: 'gardening', urgency: 'low' },
  pest: { category: 'pest', urgency: 'medium', safety: 'Keep food covered and avoid the affected area.' },
  cockroach: { category: 'pest', urgency: 'medium' },
  move: { category: 'moving', urgency: 'low' },
  beauty: { category: 'beauty', urgency: 'low' },
  haircut: { category: 'beauty', urgency: 'low' },
};

const CATEGORY_LABELS: Record<string, string> = {
  electrician: 'Electrician',
  plumber: 'Plumber',
  tutor: 'Tutor',
  cleaning: 'Home Cleaning',
  carpenter: 'Carpenter',
  painter: 'Painter',
  appliance: 'Appliance Repair',
  mechanic: 'Vehicle Mechanic',
  beauty: 'Beauty at Home',
  gardening: 'Gardening',
  pest: 'Pest Control',
  moving: 'Moving Assistance',
};

const PRICE_RANGES: Record<string, string> = {
  electrician: '₹300 – ₹800 visit charge',
  plumber: '₹250 – ₹600 visit charge',
  tutor: '₹400 – ₹800 per hour',
  cleaning: '₹500 – ₹1,200 per session',
  carpenter: '₹400 – ₹1,000 visit charge',
  painter: '₹15 – ₹25 per sq ft',
  appliance: '₹300 – ₹700 visit charge',
  mechanic: '₹400 – ₹900 visit charge',
  beauty: '₹300 – ₹1,500 per session',
  gardening: '₹400 – ₹800 visit charge',
  pest: '₹800 – ₹2,000 per treatment',
  moving: '₹1,500 – ₹5,000 per move',
};

export interface AIAnalysisResult {
  serviceDetected: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  safetyAdvice: string | null;
  recommendedRadius: number;
  suggestedPriceRange: string;
  summary: string;
}

export function analyzeProblem(description: string, location?: string): AIAnalysisResult {
  const lower = description.toLowerCase();
  let match: { category: string; urgency: string; safety?: string } = { category: 'electrician', urgency: 'medium' };

  for (const [keyword, data] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      match = data;
      break;
    }
  }

  const urgency = (match.urgency as 'low' | 'medium' | 'high') || 'medium';
  const category = match.category;

  return {
    serviceDetected: CATEGORY_LABELS[category] || 'General Service',
    category,
    urgency,
    safetyAdvice: match.safety || (urgency === 'high' ? 'Please exercise caution and avoid the affected area until a professional arrives.' : null),
    recommendedRadius: urgency === 'high' ? 5 : urgency === 'medium' ? 8 : 10,
    suggestedPriceRange: PRICE_RANGES[category] || '₹300 – ₹800',
    summary: `Based on your description${location ? ` in ${location}` : ''}, you likely need a ${CATEGORY_LABELS[category]}. ${match.safety || 'A verified professional can assess and resolve this safely.'}`,
  };
}

export function calculateMatchScore(
  worker: { category: string; rating: number; experience: number; verificationStatus: string; isAvailable: boolean },
  category: string,
  distance: number
): number {
  let score = 50;
  if (worker.category === category) score += 25;
  if (worker.verificationStatus === 'verified') score += 10;
  if (worker.isAvailable) score += 5;
  score += Math.min(worker.rating * 3, 15);
  score += Math.min(worker.experience, 10);
  if (distance < 3) score += 10;
  else if (distance < 5) score += 5;
  return Math.min(Math.round(score), 99);
}

export function summarizeReviews(reviews: { rating: number; review: string }[]) {
  if (!reviews.length) return { positive: [], negative: [], summary: 'No reviews yet.' };
  const positive = reviews.filter((r) => r.rating >= 4).map((r) => r.review.slice(0, 80));
  const negative = reviews.filter((r) => r.rating <= 2).map((r) => r.review.slice(0, 80));
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return {
    positive: positive.slice(0, 3),
    negative: negative.slice(0, 2),
    summary: `Customers rate this worker ${avg.toFixed(1)}/5. ${positive.length > 0 ? 'Common praise: punctual, skilled, professional.' : ''} ${negative.length > 0 ? 'Some noted: occasional delays.' : ''}`,
  };
}

export function suggestMessage(role: 'customer' | 'worker', context: string): string[] {
  if (role === 'customer') {
    return [
      `Hi, I need help with: ${context.slice(0, 50)}. Are you available today?`,
      'Could you share your estimated arrival time?',
      'What would be the approximate cost for this job?',
    ];
  }
  return [
    `Hello! I'm available to help with your ${context.slice(0, 40)} request.`,
    'I can arrive within 30-45 minutes. My visit charge is as listed on my profile.',
    'Please share your exact location pin for easy navigation.',
  ];
}
