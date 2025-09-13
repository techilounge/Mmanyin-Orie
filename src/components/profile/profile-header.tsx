
'use client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function ProfileHeader() {
  const router = useRouter();
  
  return (
    <header className="bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Image src="/logo.png" alt="Mmanyin Orie Logo" width={40} height={40} className="rounded-lg" />
            <div>
              <h1 className="text-sm font-bold text-foreground font-headline">Mmanyin Orie</h1>
              <p className="text-lg text-muted-foreground font-semibold">Account Settings</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to App</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
