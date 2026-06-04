'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Gem,
  Rocket,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const staggerChild = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ---------------------------------------------------------------------------
// Mock NFT data
// ---------------------------------------------------------------------------

interface NFTItem {
  name: string;
  collection: string;
  gradient: string;
  iconEmoji: string;
}

const nftCollections: { label: string; translationKey: string; items: NFTItem[] }[] = [
  {
    label: 'genesis',
    translationKey: 'nft.genesisCollection',
    items: [
      { name: 'Cosmic Whale #001', collection: 'nft.genesisCollection', gradient: 'from-purple-500/30 via-indigo-500/20 to-blue-500/30', iconEmoji: '🐋' },
      { name: 'Diamond Hands #042', collection: 'nft.genesisCollection', gradient: 'from-amber-500/30 via-orange-500/20 to-yellow-500/30', iconEmoji: '💎' },
      { name: 'Moon Runner #108', collection: 'nft.genesisCollection', gradient: 'from-slate-500/20 via-zinc-400/20 to-gray-500/30', iconEmoji: '🌙' },
    ],
  },
  {
    label: 'aiTraders',
    translationKey: 'nft.aiTradersCollection',
    items: [
      { name: 'Neural Node #256', collection: 'nft.aiTradersCollection', gradient: 'from-emerald-500/30 via-teal-500/20 to-cyan-500/30', iconEmoji: '🧠' },
      { name: 'Bull Signal #077', collection: 'nft.aiTradersCollection', gradient: 'from-green-500/30 via-lime-500/20 to-emerald-500/30', iconEmoji: '🐂' },
      { name: 'Block Phoenix #333', collection: 'nft.aiTradersCollection', gradient: 'from-red-500/30 via-rose-500/20 to-orange-500/30', iconEmoji: '🔥' },
    ],
  },
  {
    label: 'legends',
    translationKey: 'nft.legendsCollection',
    items: [
      { name: 'Satoshi Spirit #001', collection: 'nft.legendsCollection', gradient: 'from-yellow-500/30 via-amber-400/20 to-orange-500/30', iconEmoji: '⚡' },
      { name: 'Chain Guardian #099', collection: 'nft.legendsCollection', gradient: 'from-sky-500/30 via-blue-500/20 to-indigo-500/30', iconEmoji: '🛡️' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Feature card data
// ---------------------------------------------------------------------------

interface FeatureDef {
  titleKey: string;
  descKey: string;
  icon: typeof Sparkles;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

const features: FeatureDef[] = [
  {
    titleKey: 'nft.aiDiscovery',
    descKey: 'nft.aiDiscoveryDesc',
    icon: Sparkles,
    gradient: 'from-violet-500/10 to-purple-500/5',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
  },
  {
    titleKey: 'nft.instantTrading',
    descKey: 'nft.instantTradingDesc',
    icon: Zap,
    gradient: 'from-amber-500/10 to-yellow-500/5',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
  },
  {
    titleKey: 'nft.earlyAccess',
    descKey: 'nft.earlyAccessDesc',
    icon: Clock,
    gradient: 'from-emerald-500/10 to-teal-500/5',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NFTSection() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // ---- Carousel scroll helpers ----
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 320;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // ---- Waitlist submit ----
  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setJoined(true);
  };

  // ---- Flatten NFT items for carousel ----
  const allNftItems = nftCollections.flatMap((col) =>
    col.items.map((item) => ({ ...item, collectionKey: col.translationKey })),
  );

  return (
    <section className="relative py-8 overflow-hidden">
      {/* Subtle radial glow background */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(245,158,11,0.2) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ================================================================== */}
        {/* HERO SECTION                                                       */}
        {/* ================================================================== */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-12 sm:mb-16"
        >
          {/* Coming Soon pill */}
          <motion.div variants={fadeInUp} custom={0} className="mb-6">
            <Badge
              variant="outline"
              className="border-gold/30 bg-gold/10 text-gold px-3 py-1 text-xs sm:text-sm font-semibold tracking-wide"
            >
              <Rocket className="size-3.5 mr-1.5" />
              {t('nft.comingSoon')}
            </Badge>
          </motion.div>

          {/* Main title */}
          <motion.h1
            variants={fadeInUp}
            custom={1}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4 sm:mb-5"
          >
            <span className="text-foreground">{t('nft.title').split(' ')[0]}</span>{' '}
            <span className="bg-gradient-to-r from-gold to-amber-300 bg-clip-text text-transparent">
              {t('nft.title').split(' ').slice(1).join(' ')}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            custom={2}
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
          >
            {t('nft.subtitle')}
          </motion.p>

          {/* Feature badges */}
          <motion.div
            variants={fadeInUp}
            custom={3}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { key: 'nft.aiCurated', icon: Sparkles },
              { key: 'nft.verified', icon: Shield },
              { key: 'nft.multiChain', icon: Gem },
            ].map(({ key, icon: Icon }) => (
              <Badge
                key={key}
                variant="secondary"
                className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-white/[0.06] border-white/[0.08] text-foreground/80 hover:bg-white/[0.1] transition-colors"
              >
                <Icon className="size-3.5 mr-1.5 text-gold" />
                {t(key)}
              </Badge>
            ))}
          </motion.div>
        </motion.div>

        {/* ================================================================== */}
        {/* SNEAK PEEK CAROUSEL                                                */}
        {/* ================================================================== */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeInUp}
          custom={0}
          className="mb-12 sm:mb-16"
        >
          {/* Section header with carousel controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-gold/15 flex items-center justify-center">
                <Gem className="size-4 text-gold" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {t('nft.sneakPeek')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-gold/30"
                onClick={() => scrollCarousel('left')}
                aria-label="Scroll left"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-gold/30"
                onClick={() => scrollCarousel('right')}
                aria-label="Scroll right"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable card strip */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            style={{ scrollbarWidth: 'thin' }}
          >
            {allNftItems.map((nft, idx) => (
              <motion.div
                key={`${nft.name}-${idx}`}
                variants={staggerChild}
                className="flex-shrink-0 w-[240px] sm:w-[260px] snap-start"
              >
                <Card className="group relative overflow-hidden bg-white/[0.03] border-white/[0.06] hover:border-gold/25 backdrop-blur-md rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gold/5 h-full">
                  {/* Gradient image placeholder */}
                  <div
                    className={`relative h-[200px] sm:h-[220px] bg-gradient-to-br ${nft.gradient} flex items-center justify-center`}
                  >
                    {/* Decorative pattern overlay */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                      aria-hidden="true"
                    />
                    {/* Emoji icon */}
                    <span className="text-5xl sm:text-6xl select-none drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {nft.iconEmoji}
                    </span>
                    {/* Preview badge */}
                    <Badge className="absolute top-3 right-3 bg-black/50 border-white/10 text-white/90 text-[10px] font-medium backdrop-blur-sm">
                      <Zap className="size-2.5 mr-1 text-gold" />
                      {t('nft.preview')}
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <p className="text-xs text-gold font-medium mb-1">
                      {t(nft.collectionKey)}
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {nft.name}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ================================================================== */}
        {/* FEATURE CARDS                                                      */}
        {/* ================================================================== */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16"
        >
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div key={feat.titleKey} variants={staggerChild}>
                <Card className="group relative overflow-hidden bg-white/[0.03] border-white/[0.06] hover:border-gold/25 backdrop-blur-md rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gold/5 h-full">
                  {/* Subtle gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    aria-hidden="true"
                  />
                  <CardHeader className="relative p-6 pb-2">
                    <div
                      className={`size-11 rounded-xl ${feat.iconBg} flex items-center justify-center mb-3`}
                    >
                      <Icon className={`size-5 ${feat.iconColor}`} />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      {t(feat.titleKey)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative p-6 pt-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(feat.descKey)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ================================================================== */}
        {/* WAITLIST SECTION                                                   */}
        {/* ================================================================== */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeInUp}
          custom={0}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-gold/[0.08] via-white/[0.03] to-white/[0.02] border-gold/20 backdrop-blur-md rounded-2xl">
            {/* Decorative glow */}
            <div
              className="absolute -top-20 -right-20 w-60 h-60 opacity-20 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            <CardContent className="relative p-6 sm:p-10 text-center">
              <motion.div variants={fadeInUp} custom={1}>
                <div className="size-14 rounded-2xl bg-gold/15 flex items-center justify-center mx-auto mb-5">
                  <Rocket className="size-6 text-gold" />
                </div>
              </motion.div>

              <motion.h3
                variants={fadeInUp}
                custom={2}
                className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
              >
                {t('nft.joinWaitlist')}
              </motion.h3>

              {!joined ? (
                <motion.form
                  variants={fadeInUp}
                  custom={3}
                  onSubmit={handleJoinWaitlist}
                  className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
                >
                  <div className="relative flex-1 w-full">
                    <Input
                      type="email"
                      required
                      placeholder={t('nft.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 bg-white/[0.06] border-white/[0.1] focus:border-gold/40 focus:ring-gold/20 text-foreground placeholder:text-muted-foreground/60 rounded-xl px-4"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-11 px-6 bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-black font-semibold rounded-xl shadow-lg shadow-gold/20 hover:shadow-gold/30 transition-all duration-300"
                  >
                    {t('nft.join')}
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-3 py-3"
                >
                  <div className="size-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 className="size-6 text-emerald-400" />
                  </div>
                  <p className="text-lg font-semibold text-emerald-400">
                    {t('nft.joined')}
                  </p>
                </motion.div>
              )}

              <motion.p
                variants={fadeInUp}
                custom={4}
                className="text-xs text-muted-foreground/60 mt-4"
              >
                {t('nft.noSpam')}
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
