export const SERVICE_CATEGORIES = [
  { id: 'electrician', name: 'Electricians', icon: '⚡', workers: 24 },
  { id: 'plumber', name: 'Plumbers', icon: '🔧', workers: 18 },
  { id: 'tutor', name: 'Tutors', icon: '📚', workers: 32 },
  { id: 'cleaning', name: 'Home Cleaning', icon: '🧹', workers: 28 },
  { id: 'carpenter', name: 'Carpenters', icon: '🪚', workers: 15 },
  { id: 'painter', name: 'Painters', icon: '🎨', workers: 12 },
  { id: 'appliance', name: 'Appliance Repair', icon: '🔌', workers: 10 },
  { id: 'mechanic', name: 'Vehicle Mechanics', icon: '🚗', workers: 14 },
  { id: 'beauty', name: 'Beauty at Home', icon: '💇', workers: 20 },
  { id: 'gardening', name: 'Gardening', icon: '🌿', workers: 11 },
  { id: 'pest', name: 'Pest Control', icon: '🐛', workers: 8 },
  { id: 'moving', name: 'Moving Assistance', icon: '📦', workers: 9 },
] as const;

export const BOOKING_STATUSES = [
  'requested',
  'accepted',
  'confirmed',
  'arriving',
  'started',
  'completed',
  'paid',
  'reviewed',
] as const;

export const TRUST_INDICATORS = [
  { icon: '✓', title: 'Verified Worker Profiles' },
  { icon: '📍', title: 'Location-Based Discovery' },
  { icon: '🔒', title: 'Secure Communication' },
  { icon: '📋', title: 'Transparent Booking' },
];

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },
];

export const DEFAULT_LOCATION = 'Konaseema, Andhra Pradesh';

export const LOCATIONS = [
  'Konaseema, Andhra Pradesh',
  'Amalapuram, Konaseema',
  'Rajahmundry, Andhra Pradesh',
  'Hyderabad, Telangana',
  'Bangalore, Karnataka',
  'Chennai, Tamil Nadu',
];

export const DEMO_COORDS = { lat: 16.579, lng: 82.006 };
