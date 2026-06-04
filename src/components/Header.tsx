'use client';

import { useState, useEffect } from 'react';
import { Search, BarChart3, MessageSquare, Server, Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

const navLinks = [
  { href: '#', label: 'Dashboard', icon: BarChart3 },
  { href: '#market', label: 'Market', icon: TrendingUpIcon },
  { href: '#ai-chat', label: 'AI Chat', icon: MessageSquare },
  { href: '#mcp', label: 'MCP', icon: Server },
] as const;

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20'
          : 'bg-[#0a0a0f]/60 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 overflow-hidden rounded-lg ring-1 ring-gold/20 group-hover:ring-gold/40 transition-all">
              <Image
                src="/coinrichai-logo.png"
                alt="CoinRichAI Logo"
                width={32}
                height={32}
                className="object-cover"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight gradient-text">
              CoinRichAI
            </span>
          </Link>

          {/* Center: Navigation Links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <Icon className="size-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Search + Auth + Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Search (desktop) */}
            <div className="hidden sm:flex items-center relative">
              {searchOpen ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Search coins, news..."
                    className="pl-9 h-9 w-[220px] bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold/30"
                    onBlur={() => setSearchOpen(false)}
                  />
                </motion.div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Search className="size-4" />
                  <span className="sr-only">Search</span>
                </Button>
              )}
            </div>

            {/* Notification bell */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
            >
              <Bell className="size-4" />
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Auth buttons (desktop) */}
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="bg-gold hover:bg-gold/90 text-[#0a0a0f] font-semibold shadow-lg shadow-gold/20"
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile: Hamburger Menu */}
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Menu className="size-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="bg-[#0a0a0f] border-white/5 w-[280px] p-0"
                >
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* Mobile header */}
                    <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/5">
                      <div className="relative w-7 h-7 overflow-hidden rounded-lg ring-1 ring-gold/20">
                        <Image
                          src="/coinrichai-logo.png"
                          alt="CoinRichAI Logo"
                          width={28}
                          height={28}
                          className="object-cover"
                        />
                      </div>
                      <span className="text-lg font-bold gradient-text">
                        CoinRichAI
                      </span>
                    </div>

                    {/* Mobile search */}
                    <div className="px-4 pt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Search coins, news..."
                          className="pl-9 h-10 bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold/30"
                        />
                      </div>
                    </div>

                    {/* Mobile nav links */}
                    <nav className="flex flex-col gap-1 px-4 py-4">
                      {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.label}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                          >
                            <Icon className="size-5" />
                            <span>{link.label}</span>
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Mobile auth buttons */}
                    <div className="mt-auto px-4 pb-6 space-y-2">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 hover:bg-white/5"
                      >
                        Sign In
                      </Button>
                      <Button className="w-full bg-gold hover:bg-gold/90 text-[#0a0a0f] font-semibold shadow-lg shadow-gold/20">
                        Sign Up
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
