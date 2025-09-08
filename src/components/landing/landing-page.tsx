'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart2, Users, Home, Settings, ChevronDown, Menu } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import React, { useCallback, useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: <BarChart2 className="w-8 h-8 text-primary" />,
    title: 'Dashboard Overview',
    description: 'Get a clear overview of community stats like total members, families, and expected contributions.',
  },
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: 'Member Management',
    description: 'Easily manage community members with powerful filtering and search functionality.',
  },
  {
    icon: <Home className="w-8 h-8 text-primary" />,
    title: 'Family Management',
    description: 'View a summary of each family, and easily add or manage members within their respective families.',
  },
  {
    icon: <Settings className="w-8 h-8 text-primary" />,
    title: 'Custom Contributions',
    description: 'Configure membership tiers and create custom contribution templates for discounts or sponsorships.',
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Create Families',
    description: 'Start by setting up the families that make up your community. This forms the core of your registry.',
  },
  {
    step: 2,
    title: 'Add Members',
    description: 'Add individual members to their respective families, capturing essential details like age and contact information.',
  },
  {
    step: 3,
    title: 'Manage Contributions',
    description: 'Define contribution types, assign them to age groups, and easily track payments from members.',
  },
];

const faqs = [
    {
        question: "Is my community's data secure?",
        answer: "Yes, your data is stored securely on Firebase, with access controls to protect your privacy."
    },
    {
        question: "Can I customize the contribution amounts?",
        answer: "Absolutely. The settings page allows you to define different age groups and create custom, reusable contribution templates for various needs."
    },
    {
        question: "Is the application accessible on mobile devices?",
        answer: "Yes, the application is fully responsive and designed to work seamlessly across desktops, tablets, and mobile phones."
    },
     {
        question: "How do I get started?",
        answer: "Simply sign up or sign in, and you'll be guided through setting up your community."
    }
]

const heroCarouselImages = ["/trad1.png", "/trad2.png", "/trad3.png", "/trad4.png"];
const howItWorksCarouselImages = ["/fam1.png", "/fam2.png", "/fam3.png", "/fam4.png"];


export function LandingPage() {
  const [api1, setApi1] = useState<CarouselApi | undefined>();
  const [api2, setApi2] = useState<CarouselApi | undefined>();
  const [activeLink, setActiveLink] = useState('');

  const autoplayPlugin1 = React.useRef(Autoplay({ delay: 10000, stopOnInteraction: true, stopOnMouseEnter: true }));
  const autoplayPlugin2 = React.useRef(Autoplay({ delay: 10000, stopOnInteraction: true, stopOnMouseEnter: true }));

  const onSelect = useCallback((emblaApi: CarouselApi) => {
    if (!emblaApi) return;
    emblaApi.slideNodes().forEach((slideNode, index) => {
      if (emblaApi.selectedScrollSnap() === index) {
        slideNode.classList.add('is-active');
      } else {
        slideNode.classList.remove('is-active');
      }
    });
  }, []);

  useEffect(() => {
    if (api1) {
        onSelect(api1);
        api1.on('select', onSelect);
        api1.on('reInit', onSelect);
        if (api1.slideNodes().length > 0) {
            api1.slideNodes()[0]?.classList.add('is-active');
        }
    }
  }, [api1, onSelect]);

   useEffect(() => {
    if (api2) {
        onSelect(api2);
        api2.on('select', onSelect);
        api2.on('reInit', onSelect);
        if (api2.slideNodes().length > 0) {
            api2.slideNodes()[0]?.classList.add('is-active');
        }
    }
  }, [api2, onSelect]);

  useEffect(() => {
    const sections = ['features', 'how-it-works', 'faq'];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      let currentSection = '';
      for (const id of sections) {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= scrollPosition) {
          currentSection = id;
        }
      }
      setActiveLink(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
      { href: '#features', label: 'Features' },
      { href: '#how-it-works', label: 'How it Works' },
      { href: '#faq', label: 'FAQ' },
  ]

  const navLinks = (
    <>
      {navItems.map(item => (
        <Link 
            key={item.href}
            href={item.href} 
            className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                activeLink === item.href.substring(1) ? "text-primary" : "text-muted-foreground"
            )}
        >
            {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "url('/igbo-pattern.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 400px',
        }}
      ></div>

      <div className="relative z-10 flex flex-col">
        <header className="sticky top-0 z-50 flex w-full items-center justify-between p-4 sm:p-6 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
                <Image src="/logo.png" alt="Mmanyin Orie Logo" width={40} height={40} className="rounded-lg" />
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mmanyin Orie</h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
                {navLinks}
            </nav>
            <div className="flex items-center gap-2">
               <Link href="/auth/sign-in" className="hidden sm:inline-flex">
                  <Button variant="ghost">
                      Sign In
                  </Button>
              </Link>
              <Link href="/auth/sign-up" className="hidden sm:inline-flex">
                  <Button>
                      Sign Up
                  </Button>
              </Link>
               <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <div className="flex flex-col gap-6 pt-12">
                               {navLinks}
                               <hr />
                               <Link href="/auth/sign-in">
                                  <Button variant="outline" className="w-full">Sign In</Button>
                               </Link>
                               <Link href="/auth/sign-up">
                                  <Button className="w-full">Sign Up</Button>
                               </Link>
                            </div>
                        </SheetContent>
                    </Sheet>
               </div>
            </div>
        </header>

        <main className="flex flex-1 flex-col items-center">
            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center text-center py-20 sm:py-32 px-4">
                 <div className="absolute top-1/4 left-4 lg:left-12 xl:left-24 w-[200px] h-[100px] opacity-20 pointer-events-none hidden md:block">
                    <Image 
                        src="/kola-nuts.png" 
                        alt="Kola nuts decoration"
                        fill
                        sizes="200px"
                        className="object-contain"
                        aria-hidden="true"
                        data-ai-hint="background kola nuts"
                    />
                </div>
                 <div className="absolute top-1/4 right-4 lg:right-12 xl:right-24 w-[200px] h-[100px] opacity-20 pointer-events-none hidden md:block">
                    <Image 
                        src="/kola-nuts.png" 
                        alt="Kola nuts decoration"
                        fill
                        sizes="200px"
                        className="object-contain"
                        aria-hidden="true"
                        data-ai-hint="background kola nuts"
                    />
                </div>
                <div className="flex flex-col items-center space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <Image 
                            src="/logo.png" 
                            alt="Mmanyin Orie Logo" 
                            width={120} 
                            height={120} 
                            className="rounded-2xl shadow-lg"
                            priority
                            data-ai-hint="logo"
                        />
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
                            Mmanyin Orie
                        </h1>
                    </div>
                    <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                        Mmanyin Orie is an online home for Igbo kindreds—preserving lineage, community, and tradition anywhere. Create and manage your kindred, organize Umu Nna meetings, track dues, share updates, and coordinate events or projects. Whether in the village or diaspora, Mmanyin Orie keeps families connected, accountable, and proud of their roots—ensuring traditions live on for generations. - ‘Onye Aghala Nwanneya’
                    </p>
                    <Link href="/auth/sign-up">
                        <Button size="lg" className="group bg-primary text-primary-foreground hover:bg-primary/90">
                            Get Started for Free
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </section>
            
            {/* Features Section */}
            <section id="features" className="w-full py-20 sm:py-32 bg-muted/50">
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold tracking-tight">Powerful Features, Simple Interface</h2>
                  <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Everything you need to manage your community efficiently.</p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                  {features.map((feature, index) => (
                    <div key={index} className="p-6 bg-card rounded-xl shadow-md hover:shadow-lg transition-shadow">
                      <div className="mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

             {/* Hero Carousel Section */}
            <section className="w-full py-20 sm:py-32">
                <div className="container mx-auto px-4">
                     <Carousel
                        setApi={setApi1}
                        plugins={[autoplayPlugin1.current]}
                        className="w-full max-w-6xl mx-auto"
                        opts={{ loop: true }}
                     >
                         <CarouselContent>
                           {heroCarouselImages.map((src, index) => (
                             <CarouselItem key={index} className="embla__slide">
                               <div className="p-1">
                                 <Image 
                                   src={src} 
                                   alt={`Community tradition image ${index + 1}`} 
                                   width={1200} 
                                   height={600} 
                                   className="rounded-xl shadow-2xl mx-auto object-contain" 
                                 />
                               </div>
                             </CarouselItem>
                           ))}
                         </CarouselContent>
                         <CarouselPrevious />
                         <CarouselNext />
                       </Carousel>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="w-full py-20 sm:py-32 bg-muted/50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold tracking-tight">Get Started in 3 Simple Steps</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Managing your community has never been this straightforward.</p>
                    </div>
                    <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12">
                       <div className="lg:w-1/2 relative">
                         <Carousel
                            setApi={setApi2}
                            plugins={[autoplayPlugin2.current]}
                            className="w-full max-w-4xl mx-auto"
                            opts={{
                                loop: true,
                            }}
                           >
                             <CarouselContent>
                               {howItWorksCarouselImages.map((src, index) => (
                                 <CarouselItem key={index} className="embla__slide">
                                   <div className="p-1">
                                     <Image 
                                       src={src} 
                                       alt={`Feature demonstration image ${index + 1}`} 
                                       width={800} 
                                       height={600} 
                                       className="rounded-xl shadow-2xl mx-auto object-contain" 
                                     />
                                   </div>
                                 </CarouselItem>
                               ))}
                             </CarouselContent>
                             <CarouselPrevious />
                             <CarouselNext />
                           </Carousel>
                       </div>
                       <div className="lg:w-1/2 space-y-8">
                        {howItWorks.map((step) => (
                           <div key={step.step} className="flex items-start gap-6">
                             <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-xl shrink-0">
                               {step.step}
                             </div>
                             <div>
                               <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                               <p className="text-muted-foreground">{step.description}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                </div>
            </section>
            
            {/* FAQs Section */}
            <section id="faq" className="w-full py-20 sm:py-32">
              <div className="container mx-auto px-4 max-w-4xl">
                 <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Have questions? We've got answers.</p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-lg text-left font-semibold">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-base text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
        </main>
        
        <footer className="w-full p-6 text-center text-sm text-muted-foreground bg-background border-t">
          <div className="flex justify-center gap-6">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
          <p className="mt-4">© {new Date().getFullYear()} Mmanyin Orie, a product of TechiLounge. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
