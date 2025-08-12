
import Image from "next/image";

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
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
         <Image 
            src="/logo.png" 
            alt="Mmanyin Orie Logo" 
            width={80} 
            height={80} 
            className="rounded-2xl shadow-lg mb-6"
            priority
        />
        {children}
      </div>
    </div>
  );
}
