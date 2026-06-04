'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  BarChart3,
  MessageSquare,
  Menu,
  Bell,
  Globe,
  ChevronDown,
  TrendingUp,
  Briefcase,
  ScanSearch,
  Brain,
  LineChart,
  HeartPulse,
  Sparkles,
  BarChartBig,
  Landmark,
  GitBranch,
  Microscope,
  Flame,
  Target,
  Layers,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Nav items (main bar)
// ---------------------------------------------------------------------------
interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { href: '#', labelKey: 'header.dashboard', icon: BarChart3 },
  { href: '#market', labelKey: 'header.market', icon: TrendingUp },
  { href: '#portfolio', labelKey: 'header.portfolio', icon: Briefcase },
  { href: '#screener', labelKey: 'header.screener', icon: ScanSearch },
  { href: '#ai-chat', labelKey: 'header.aiChat', icon: MessageSquare },
  { href: '#nft', labelKey: 'header.nft', icon: Layers },
];

// ---------------------------------------------------------------------------
// "More" dropdown items
// ---------------------------------------------------------------------------
interface MoreItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const moreItems: MoreItem[] = [
  { href: '#ai-analysis', labelKey: 'header.aiAnalysis', icon: Brain },
  { href: '#technical-analysis', labelKey: 'header.technicalAnalysis', icon: LineChart },
  { href: '#sentiment', labelKey: 'header.sentiment', icon: HeartPulse },
  { href: '#enhanced-predictions', labelKey: 'header.enhancedPredictions', icon: Sparkles },
  { href: '#market-analysis', labelKey: 'header.marketAnalysis', icon: BarChartBig },
  { href: '#macro-economics', labelKey: 'header.macroEconomics', icon: Landmark },
  { href: '#correlations', labelKey: 'header.correlations', icon: GitBranch },
  { href: '#microstructure', labelKey: 'header.microstructure', icon: Microscope },
  { href: '#trending', labelKey: 'header.trending', icon: Flame },
  { href: '#prediction-accuracy', labelKey: 'header.predictionAccuracy', icon: Target },
  { href: '#batch-analysis', labelKey: 'header.batchAnalysis', icon: Layers },
];

// ---------------------------------------------------------------------------
// Header component
// ---------------------------------------------------------------------------
export default function Header() {
  const { t, locale, setLocale } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'zh' : 'en');
  };

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
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8 overflow-hidden rounded-lg ring-1 ring-gold/20 group-hover:ring-gold/40 transition-all">
              <Image
                src="/driftcrypto-logo.png"
                alt="driftcrypto Logo"
                width={32}
                height={32}
                className="object-cover"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight gradient-text">
              driftcrypto
            </span>
          </Link>

          {/* Center: Navigation Links (desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.labelKey}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <Icon className="size-4" />
                  <span>{t(link.labelKey)}</span>
                </Link>
              );
            })}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                  <span>{t('header.more')}</span>
                  <ChevronDown className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#12121a]/95 backdrop-blur-xl border-white/10"
              >
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  {t('header.more')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.labelKey}
                      className="cursor-pointer text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-white/5"
                    >
                      <Icon className="size-4" />
                      <span>{t(item.labelKey)}</span>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="bg-white/5" />
                <div className="px-2 py-2">
                  <p className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                    <LogIn className="size-3" />
                    {t('header.signInRequired')}
                  </p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right: Search + Lang + Auth + Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search (desktop) */}
            <div className="hidden sm:flex items-center relative">
              {searchOpen ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder={t('header.search')}
                    className="pl-9 h-9 w-[200px] bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold/30"
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
                  <span className="sr-only">{t('header.search')}</span>
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
              <span className="sr-only">{t('header.notifications')}</span>
            </Button>

            {/* Language switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-2"
                >
                  <Globe className="size-4" />
                  <span className="text-xs font-medium">
                    {locale === 'en' ? 'EN' : '中文'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-32 bg-[#12121a]/95 backdrop-blur-xl border-white/10"
              >
                <DropdownMenuItem
                  className={`cursor-pointer ${locale === 'en' ? 'text-gold' : 'text-muted-foreground'}`}
                  onClick={() => setLocale('en')}
                >
                  <Globe className="size-4" />
                  <span>English</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`cursor-pointer ${locale === 'zh' ? 'text-gold' : 'text-muted-foreground'}`}
                  onClick={() => setLocale('zh')}
                >
                  <Globe className="size-4" />
                  <span>中文</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Auth buttons (desktop) */}
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                {t('header.signIn')}
              </Button>
              <Button
                size="sm"
                className="bg-gold hover:bg-gold/90 text-[#0a0a0f] font-semibold shadow-lg shadow-gold/20"
              >
                {t('header.signUp')}
              </Button>
            </div>

            {/* Mobile: Hamburger Menu */}
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Menu className="size-5" />
                    <span className="sr-only">{t('header.openMenu')}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="bg-[#0a0a0f] border-white/5 w-[300px] p-0"
                >
                  <SheetTitle className="sr-only">
                    {t('header.navigationMenu')}
                  </SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* Mobile header */}
                    <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/5">
                      <div className="relative w-7 h-7 overflow-hidden rounded-lg ring-1 ring-gold/20">
                        <Image
                          src="/driftcrypto-logo.png"
                          alt="driftcrypto Logo"
                          width={28}
                          height={28}
                          className="object-cover"
                        />
                      </div>
                      <span className="text-lg font-bold gradient-text">
                        driftcrypto
                      </span>
                    </div>

                    {/* Mobile search */}
                    <div className="px-4 pt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          placeholder={t('header.search')}
                          className="pl-9 h-10 bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold/30"
                        />
                      </div>
                    </div>

                    {/* Mobile nav links */}
                    <nav className="flex flex-col gap-0.5 px-4 py-4">
                      {mainNavItems.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.labelKey}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                          >
                            <Icon className="size-5" />
                            <span>{t(link.labelKey)}</span>
                          </Link>
                        );
                      })}

                      {/* Mobile "More" section */}
                      <Separator className="my-2 bg-white/5" />
                      <button
                        onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                        className="flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <ChevronDown
                            className={`size-5 transition-transform duration-200 ${mobileMoreOpen ? 'rotate-180' : ''}`}
                          />
                          <span>{t('header.more')}</span>
                        </span>
                      </button>
                      {mobileMoreOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {moreItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.labelKey}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 pl-10 pr-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                              >
                                <Icon className="size-4" />
                                <span>{t(item.labelKey)}</span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </nav>

                    {/* Mobile language switcher */}
                    <div className="px-4 pb-2">
                      <button
                        onClick={toggleLocale}
                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <Globe className="size-5" />
                        <span>
                          {locale === 'en' ? 'English' : '中文'} /{' '}
                          {locale === 'en' ? '中文' : 'English'}
                        </span>
                      </button>
                    </div>

                    {/* Mobile auth buttons */}
                    <div className="mt-auto px-4 pb-6 space-y-2">
                      <p className="text-xs text-muted-foreground/50 px-1 flex items-center gap-1.5">
                        <LogIn className="size-3" />
                        {t('header.signInRequired')}
                      </p>
                      <Button
                        variant="outline"
                        className="w-full border-white/10 hover:bg-white/5"
                      >
                        {t('header.signIn')}
                      </Button>
                      <Button className="w-full bg-gold hover:bg-gold/90 text-[#0a0a0f] font-semibold shadow-lg shadow-gold/20">
                        {t('header.signUp')}
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
