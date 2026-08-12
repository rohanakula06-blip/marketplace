'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/app-store';

/** Redirects /contact to home and opens the contact popup */
export default function ContactPage() {
  const router = useRouter();
  const setInfoModal = useUIStore((s) => s.setInfoModal);

  useEffect(() => {
    setInfoModal('contact');
    router.replace('/');
  }, [setInfoModal, router]);

  return null;
}
