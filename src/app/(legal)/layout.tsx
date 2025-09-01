import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-50 flex w-full items-center justify-between p-4 sm:p-6 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center space-x-3">
          <Image src="/logo.png" alt="Mmanyin Orie Logo" width={40} height={40} className="rounded-lg" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mmanyin Orie</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </Button>
      </header>
       <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "url('/igbo-pattern.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 400px',
        }}
      ></div>
      <main className="relative z-10 container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="prose dark:prose-invert prose-headings:font-bold prose-headings:text-foreground prose-a:text-primary hover:prose-a:underline max-w-none bg-card/80 p-6 sm:p-8 md:p-12 rounded-xl shadow-md">
            {children}
        </div>
      </main>
       <footer className="relative z-10 w-full p-6 text-center text-sm text-muted-foreground bg-background border-t">
          <div className="flex justify-center gap-6">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
          <p className="mt-4">© {new Date().getFullYear()} Mmanyin Orie, a product of TechiLounge. All rights reserved.</p>
        </footer>
    </div>
  );
}
