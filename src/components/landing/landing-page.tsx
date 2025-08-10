'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "url('/igbo-pattern.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 400px',
        }}
      ></div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <header className="absolute top-0 flex w-full items-center justify-between p-4 sm:p-6">
            <div className="flex items-center space-x-3">
                <Image src="/logo.png" alt="Mmanyin Orie Logo" width={40} height={40} className="rounded-lg" />
                <h1 className="text-2xl font-bold text-foreground">Mmanyin Orie</h1>
            </div>
            <Link href="/dashboard">
                <Button variant="outline">
                    Sign In
                </Button>
            </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center">
            <div className="flex flex-col items-center space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <Image 
                        src="/logo.png" 
                        alt="Mmanyin Orie Logo" 
                        width={120} 
                        height={120} 
                        className="rounded-2xl shadow-lg"
                        priority
                    />
                    <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
                        Mmanyin Orie
                    </h1>
                </div>
                <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
                    A modern, streamlined solution for community management. Track members, manage contributions, and organize families with ease and clarity.
                </p>
                <Link href="/dashboard">
                    <Button size="lg" className="group bg-primary text-primary-foreground hover:bg-primary/90">
                        Access the Dashboard
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </div>
        </main>
        
        <footer className="w-full p-4 text-center text-sm text-muted-foreground sm:p-6">
            © {new Date().getFullYear()} Mmanyin Orie. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
