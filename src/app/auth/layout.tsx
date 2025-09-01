import Image from "next/image";
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background">
       <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "url('/igbo-pattern.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 400px',
        }}
      ></div>
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center p-4">
         <Image 
            src="/logo.png" 
            alt="Mmanyin Orie Logo" 
            width={80} 
            height={80} 
            className="rounded-2xl shadow-lg mb-6"
            priority
        />
        <div className="w-full">{children}</div>
         <footer className="w-full p-6 text-center text-sm text-muted-foreground">
            <div className="flex justify-center gap-6">
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
            <p className="mt-4">© {new Date().getFullYear()} Mmanyin Orie</p>
        </footer>
      </div>
    </div>
  );
}
