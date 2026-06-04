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
  User,
  CreditCard,
  LogOut,
  Crown,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n';
import { useSession, signOut } from 'next-auth/react';
import SignInDialog from '@/components/auth/SignInDialog';
import MembershipDialog from '@/components/auth/MembershipDialog';
import { motion } from 'framer-motion';
import type { SectionId } from '@/app/page';

// ---------------------------------------------------------------------------
// Nav items (main bar)
// ---------------------------------------------------------------------------
interface NavItem {
  section: SectionId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { section: 'dashboard', labelKey: 'header.dashboard', icon: BarChart3 },
  { section: 'market', labelKey: 'header.market', icon: TrendingUp },
  { section: 'portfolio', labelKey: 'header.portfolio', icon: Briefcase },
  { section: 'screener', labelKey: 'header.screener', icon: ScanSearch },
  { section: 'ai-chat', labelKey: 'header.aiChat', icon: MessageSquare },
  { section: 'piao-shu', labelKey: 'header.piaoShuAnalysis', icon: Crown },
];

// ---------------------------------------------------------------------------
// "More" dropdown items
// ---------------------------------------------------------------------------
interface MoreItem {
  section: SectionId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const moreItems: MoreItem[] = [
  { section: 'ai-analysis', labelKey: 'header.aiAnalysis', icon: Brain },
  { section: 'technical-analysis', labelKey: 'header.technicalAnalysis', icon: LineChart },
  { section: 'sentiment', labelKey: 'header.sentiment', icon: HeartPulse },
  { section: 'enhanced-predictions', labelKey: 'header.enhancedPredictions', icon: Sparkles },
  { section: 'market-analysis', labelKey: 'header.marketAnalysis', icon: BarChartBig },
  { section: 'macro-economics', labelKey: 'header.macroEconomics', icon: Landmark },
  { section: 'correlations', labelKey: 'header.correlations', icon: GitBranch },
  { section: 'microstructure', labelKey: 'header.microstructure', icon: Microscope },
  { section: 'trending', labelKey: 'header.trending', icon: Flame },
  { section: 'prediction-accuracy', labelKey: 'header.predictionAccuracy', icon: Target },
  { section: 'batch-analysis', labelKey: 'header.batchAnalysis', icon: Layers },
  { section: 'nft', labelKey: 'header.nft', icon: Layers },
];

// ---------------------------------------------------------------------------
// Header component
// ---------------------------------------------------------------------------

interface HeaderProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
}

export default function Header({ activeSection, onSectionChange }: HeaderProps) {
  const { t, locale, setLocale } = useI18n();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [membershipOpen, setMembershipOpen] = useState(false);

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

  const handleNavClick = (section: SectionId) => {
    onSectionChange(section);
    window.location.hash = section;
    setMobileOpen(false);
    // Scroll to top on section change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derive user initials for avatar fallback
  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
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
          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="relative w-8 h-8 overflow-hidden rounded-lg ring-1 ring-gold/20 group-hover:ring-gold/40 transition-all">
              <img
                src="/driftcrypto-logo.svg"
                alt="driftcrypto Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight gradient-text">
              driftcrypto
            </span>
          </button>

          {/* Center: Navigation Links (desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((link) => {
              const Icon = link.icon;
              const isActive = activeSection === link.section;
              return (
                <button
                  key={link.labelKey}
                  onClick={() => handleNavClick(link.section)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-gold bg-gold/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{t(link.labelKey)}</span>
                </button>
              );
            })}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  moreItems.some(m => m.section === activeSection)
                    ? 'text-gold bg-gold/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}>
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
                  const isActive = activeSection === item.section;
                  return (
                    <DropdownMenuItem
                      key={item.labelKey}
                      className={`cursor-pointer ${isActive ? 'text-gold' : 'text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-white/5'}`}
                      onClick={() => handleNavClick(item.section)}
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

            {/* Auth: Signed in — User dropdown */}
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden sm:flex items-center gap-2 px-2 hover:bg-white/5"
                  >
                    <Avatar className="size-7 ring-1 ring-gold/30">
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || 'User'}
                      />
                      <AvatarFallback className="bg-gold/10 text-gold text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground max-w-[100px] truncate">
                      {session.user.name}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-[#12121a]/95 backdrop-blur-xl border-white/10"
                >
                  <DropdownMenuLabel className="text-muted-foreground text-xs truncate">
                    {session.user.email || session.user.name}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    className="cursor-pointer text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-white/5"
                    onClick={() => handleNavClick('portfolio')}
                  >
                    <User className="size-4" />
                    <span>{t('auth.myAccount')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-white/5"
                    onClick={() => setMembershipOpen(true)}
                  >
                    <CreditCard className="size-4" />
                    <span>{t('auth.membership')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    className="cursor-pointer text-bearish hover:text-bearish focus:text-bearish focus:bg-white/5"
                    onClick={handleSignOut}
                  >
                    <LogOut className="size-4" />
                    <span>{t('auth.signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Auth: Signed out — Sign In / Sign Up buttons */
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setSignInOpen(true)}
                >
                  {t('header.signIn')}
                </Button>
                <Button
                  size="sm"
                  className="bg-gold hover:bg-gold/90 text-[#0a0a0f] font-semibold shadow-lg shadow-gold/20"
                  onClick={() => setSignInOpen(true)}
                >
                  {t('header.signUp')}
                </Button>
              </div>
            )}

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
                        <img
                          src="/driftcrypto-logo.svg"
                          alt="driftcrypto Logo"
                          width={28}
                          height={28}
                          className="object-contain"
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
                        const isActive = activeSection === link.section;
                        return (
                          <button
                            key={link.labelKey}
                            onClick={() => handleNavClick(link.section)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? 'text-gold bg-gold/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                          >
                            <Icon className="size-5" />
                            <span>{t(link.labelKey)}</span>
                          </button>
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
                            const isActive = activeSection === item.section;
                            return (
                              <button
                                key={item.labelKey}
                                onClick={() => handleNavClick(item.section)}
                                className={`flex items-center gap-3 pl-10 pr-3 py-2.5 rounded-lg text-sm transition-colors ${
                                  isActive
                                    ? 'text-gold bg-gold/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                              >
                                <Icon className="size-4" />
                                <span>{t(item.labelKey)}</span>
                              </button>
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

                    {/* Mobile auth section */}
                    {session?.user ? (
                      <div className="mt-auto px-4 pb-6 space-y-2">
                        <div className="flex items-center gap-3 px-3 py-2">
                          <Avatar className="size-8 ring-1 ring-gold/30">
                            <AvatarImage
                              src={session.user.image || undefined}
                              alt={session.user.name || 'User'}
                            />
                            <AvatarFallback className="bg-gold/10 text-gold text-xs font-semibold">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {session.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {session.user.email}
                            </p>
                          </div>
                        </div>
                        <Separator className="bg-white/5" />
                        <button
                          onClick={() => {
                            setMobileOpen(false);
                            setMembershipOpen(true);
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                        >
                          <CreditCard className="size-4" />
                          <span>{t('auth.membership')}</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-bearish hover:bg-white/5 transition-colors"
                        >
                          <LogOut className="size-4" />
                          <span>{t('auth.signOut')}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="mt-auto px-4 pb-6 space-y-2">
                        <p className="text-xs text-muted-foreground/50 px-1 flex items-center gap-1.5">
                          <LogIn className="size-3" />
                          {t('header.signInRequired')}
                        </p>
                        <Button
                          variant="outline"
                          className="w-full border-white/10 hover:bg-white/5"
                          onClick={() => {
                            setMobileOpen(false);
                            setSignInOpen(true);
                          }}
                        >
                          {t('header.signIn')}
                        </Button>
                        <Button
                          className="w-full bg-gold hover:bg-gold/90 text-[#0a0a0f] font-semibold shadow-lg shadow-gold/20"
                          onClick={() => {
                            setMobileOpen(false);
                            setSignInOpen(true);
                          }}
                        >
                          {t('header.signUp')}
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Dialogs */}
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      <MembershipDialog open={membershipOpen} onOpenChange={setMembershipOpen} />
    </motion.header>
  );
}
