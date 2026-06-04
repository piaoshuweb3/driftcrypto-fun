'use client';

import { useState } from 'react';
import {
  Check,
  Zap,
  Crown,
  Shield,
  Sparkles,
  Bot,
  Newspaper,
  BarChart3,
  MessageSquare,
  Lock,
  Gift,
  TrendingUp,
  Wallet,
  CreditCard,
  ArrowRight,
  Star,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useSession } from 'next-auth/react';
import SignInDialog from '@/components/auth/SignInDialog';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Pricing benchmarks (from market research)
// CoinGecko Premium: $10/mo, $99.90/yr
// CoinGlass Prime: $28/mo, $268/yr
// Santiment Pro: $49/mo, $529/yr
// Nansen Pro: $69/mo, $588/yr ($49/mo annual)
// Token Metrics Basic: $19/mo, ~$137/yr
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

interface PricingTier {
  key: 'free' | 'plus' | 'pro';
  nameKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  borderClass: string;
  bgGlowClass: string;
  popular?: boolean;
  prices: Record<BillingCycle, { usd: number; usdc: number }>;
  featuresKey: string;
  featureIcons: React.ComponentType<{ className?: string }>[];
  ctaKey: string;
}

// ---------------------------------------------------------------------------
// Pricing data (market-competitive)
// ---------------------------------------------------------------------------

const pricingTiers: PricingTier[] = [
  {
    key: 'free',
    nameKey: 'membershipSvc.tierFree',
    descriptionKey: 'membershipSvc.tierFreeDesc',
    icon: Zap,
    accentClass: 'text-muted-foreground',
    borderClass: 'border-white/10',
    bgGlowClass: '',
    prices: {
      monthly: { usd: 0, usdc: 0 },
      quarterly: { usd: 0, usdc: 0 },
      yearly: { usd: 0, usdc: 0 },
    },
    featuresKey: 'membershipSvc.freeFeatures',
    featureIcons: [BarChart3, MessageSquare, Newspaper],
    ctaKey: 'membershipSvc.getStarted',
  },
  {
    key: 'plus',
    nameKey: 'membershipSvc.tierPlus',
    descriptionKey: 'membershipSvc.tierPlusDesc',
    icon: Sparkles,
    accentClass: 'text-gold',
    borderClass: 'border-gold/40',
    bgGlowClass: 'shadow-lg shadow-gold/10',
    popular: true,
    prices: {
      monthly: { usd: 19, usdc: 19 },
      quarterly: { usd: 49, usdc: 49 },     // ~$16.33/mo (save 14%)
      yearly: { usd: 149, usdc: 149 },       // ~$12.42/mo (save 35%)
    },
    featuresKey: 'membershipSvc.plusFeatures',
    featureIcons: [Bot, TrendingUp, Newspaper, Shield, BarChart3, MessageSquare],
    ctaKey: 'membershipSvc.upgradeNow',
  },
  {
    key: 'pro',
    nameKey: 'membershipSvc.tierPro',
    descriptionKey: 'membershipSvc.tierProDesc',
    icon: Crown,
    accentClass: 'text-amber-300',
    borderClass: 'border-amber-400/40',
    bgGlowClass: 'shadow-lg shadow-amber-500/10',
    prices: {
      monthly: { usd: 49, usdc: 49 },
      quarterly: { usd: 129, usdc: 129 },    // ~$43/mo (save 12%)
      yearly: { usd: 399, usdc: 399 },       // ~$33.25/mo (save 32%)
    },
    featuresKey: 'membershipSvc.proFeatures',
    featureIcons: [Bot, TrendingUp, Newspaper, Shield, BarChart3, MessageSquare, Wallet, Gift],
    ctaKey: 'membershipSvc.goPro',
  },
];

const savingsPercent: Record<BillingCycle, string> = {
  monthly: '',
  quarterly: 'membershipSvc.save14',
  yearly: 'membershipSvc.save35',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MembershipSection() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [currency, setCurrency] = useState<'usd' | 'usdc'>('usd');
  const [signInOpen, setSignInOpen] = useState(false);

  const currentMembership = (session?.user as Record<string, unknown> | undefined)?.membership as string || 'free';

  const getMonthlyEquivalent = (tier: PricingTier): string => {
    const price = tier.prices[billingCycle][currency];
    if (price === 0) return '$0';
    if (billingCycle === 'monthly') return `$${price}`;
    if (billingCycle === 'quarterly') return `$${(price / 3).toFixed(0)}`;
    return `$${(price / 12).toFixed(0)}`;
  };

  const getPeriodLabel = (): string => {
    if (billingCycle === 'monthly') return t('membershipSvc.perMonth');
    if (billingCycle === 'quarterly') return t('membershipSvc.perQuarter');
    return t('membershipSvc.perYear');
  };

  const getSavingsLabel = (tier: PricingTier): string | null => {
    if (tier.prices.monthly[currency] === 0) return null;
    const monthlyAnnual = tier.prices.monthly[currency] * 12;
    const currentAnnual = billingCycle === 'monthly'
      ? monthlyAnnual
      : billingCycle === 'quarterly'
        ? tier.prices.quarterly[currency] * 4
        : tier.prices.yearly[currency];
    if (billingCycle === 'monthly') return null;
    const saved = monthlyAnnual - currentAnnual;
    if (saved <= 0) return null;
    return `${currency === 'usdc' ? '~' : ''}$${saved}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center ring-1 ring-gold/30">
            <Crown className="size-6 text-gold" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text">{t('membershipSvc.title')}</h1>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto">{t('membershipSvc.subtitle')}</p>
      </motion.div>

      {/* Billing Cycle + Currency Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        {/* Billing Cycle */}
        <div className="flex items-center p-1 rounded-xl bg-card border border-border/50">
          {(['monthly', 'quarterly', 'yearly'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                billingCycle === cycle
                  ? 'bg-gold/10 text-gold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <span>{t(`membershipSvc.${cycle}`)}</span>
              {cycle === 'yearly' && (
                <Badge className="ml-1.5 text-[9px] px-1 h-4 bg-bullish/10 text-bullish border-bullish/20">
                  {t('membershipSvc.bestValue')}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Currency Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrency('usd')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currency === 'usd'
                ? 'bg-gold/10 text-gold border border-gold/30'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            <DollarSign className="size-3.5" />
            USD
          </button>
          <button
            onClick={() => setCurrency('usdc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currency === 'usdc'
                ? 'bg-gold/10 text-gold border border-gold/30'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            <Wallet className="size-3.5" />
            USDC
          </button>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingTiers.map((tier, idx) => {
          const Icon = tier.icon;
          const isCurrent = currentMembership === tier.key;
          const isPopular = tier.popular;
          const price = tier.prices[billingCycle][currency];
          const monthlyEquiv = getMonthlyEquivalent(tier);
          const savings = getSavingsLabel(tier);

          return (
            <motion.div
              key={tier.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.1 }}
            >
              <Card
                className={`relative flex flex-col h-full bg-card/50 backdrop-blur-sm transition-all hover:scale-[1.02] ${
                  isCurrent ? 'border-gold/50 ring-1 ring-gold/30' : tier.borderClass
                } ${tier.bgGlowClass}`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-[#0a0a0f] text-xs font-semibold px-4 hover:bg-gold">
                    <Star className="size-3 mr-1" />
                    {t('membershipSvc.mostPopular')}
                  </Badge>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <Badge
                    variant="outline"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 border-gold/50 text-gold text-xs font-semibold px-3 bg-[#12121a]"
                  >
                    {t('membershipSvc.currentPlan')}
                  </Badge>
                )}

                <CardContent className="p-6 flex flex-col flex-1">
                  {/* Icon + Name */}
                  <div className="flex flex-col items-center mb-6">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${
                        tier.key === 'free'
                          ? 'bg-white/5'
                          : tier.key === 'plus'
                          ? 'bg-gold/10'
                          : 'bg-amber-500/10'
                      }`}
                    >
                      <Icon className={`size-7 ${tier.accentClass}`} />
                    </div>
                    <h3 className={`text-xl font-bold ${tier.accentClass}`}>
                      {t(tier.nameKey)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {t(tier.descriptionKey)}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        {currency === 'usdc' ? '~' : ''}{price === 0 ? (currency === 'usdc' ? '$0' : '$0') : `$${price}`}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">{getPeriodLabel()}</span>

                    {/* Monthly equivalent for quarterly/yearly */}
                    {billingCycle !== 'monthly' && price > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-muted-foreground">
                          ≈ {monthlyEquiv}{t('membershipSvc.perMonth')}
                        </span>
                      </div>
                    )}

                    {/* Savings badge */}
                    {savings && (
                      <Badge variant="outline" className="mt-2 text-[10px] px-2 h-5 border-bullish/30 text-bullish bg-bullish/5">
                        {t('membershipSvc.save')} {savings}/{t('membershipSvc.yr')}
                      </Badge>
                    )}

                    {/* USDC note */}
                    {currency === 'usdc' && price > 0 && (
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                        {t('membershipSvc.usdcNote')}
                      </p>
                    )}
                  </div>

                  <Separator className="bg-border/40 mb-6" />

                  {/* Features */}
                  <div className="flex-1 mb-6">
                    <ul className="space-y-3">
                      {t(tier.featuresKey)
                        .split(', ')
                        .map((feature, i) => {
                          const FeatureIcon = tier.featureIcons[i] || Check;
                          return (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                              <FeatureIcon
                                className={`size-4 shrink-0 mt-0.5 ${
                                  tier.key === 'free' ? 'text-muted-foreground' : 'text-gold'
                                }`}
                              />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full border-white/10 text-muted-foreground cursor-default"
                      disabled
                    >
                      {t('membershipSvc.currentPlan')}
                    </Button>
                  ) : (
                    <Button
                      className={`w-full font-semibold group ${
                        tier.key === 'plus'
                          ? 'bg-gold hover:bg-gold/90 text-[#0a0a0f] shadow-lg shadow-gold/20'
                          : tier.key === 'pro'
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : 'bg-white/10 hover:bg-white/15 text-foreground'
                      }`}
                      onClick={() => {
                        if (!session?.user) {
                          setSignInOpen(true);
                        }
                      }}
                    >
                      {t(tier.ctaKey)}
                      <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="bg-card border-border/50 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-center">
              {t('membershipSvc.comparisonTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">{t('membershipSvc.feature')}</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('membershipSvc.tierFree')}</th>
                    <th className="text-center px-4 py-3 font-medium text-gold">{t('membershipSvc.tierPlus')}</th>
                    <th className="text-center px-4 py-3 font-medium text-amber-300">{t('membershipSvc.tierPro')}</th>
                  </tr>
                </thead>
                <tbody>
                  {t('membershipSvc.comparisonRows')
                    .split('|')
                    .map((row, i) => {
                      const cols = row.split(';');
                      if (cols.length < 4) return null;
                      return (
                        <tr key={i} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3 text-muted-foreground">{cols[0]}</td>
                          <td className="text-center px-4 py-3">{cols[1]}</td>
                          <td className="text-center px-4 py-3 text-gold">{cols[2]}</td>
                          <td className="text-center px-4 py-3 text-amber-300">{cols[3]}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ / Payment Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="size-5 text-gold" />
              <h3 className="text-sm font-semibold text-foreground">{t('membershipSvc.paymentMethods')}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('membershipSvc.paymentMethodsDesc')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="size-5 text-gold" />
              <h3 className="text-sm font-semibold text-foreground">{t('membershipSvc.refundPolicy')}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('membershipSvc.refundPolicyDesc')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="size-5 text-gold" />
              <h3 className="text-sm font-semibold text-foreground">{t('membershipSvc.whyChoose')}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('membershipSvc.whyChooseDesc')}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Market Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-center">
              {t('membershipSvc.marketCompareTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium">{t('membershipSvc.service')}</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">{t('membershipSvc.entryPrice')}</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">{t('membershipSvc.yearlyPrice')}</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">{t('membershipSvc.aiAnalysis')}</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">{t('membershipSvc.piaoshuStyle')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'driftcrypto', entry: '$19', yearly: '$149', ai: '✅', piao: '✅' },
                    { name: 'CoinGecko Premium', entry: '$10', yearly: '$99.90', ai: '❌', piao: '❌' },
                    { name: 'Token Metrics', entry: '$19', yearly: '~$137', ai: '✅', piao: '❌' },
                    { name: 'CoinGlass Prime', entry: '$28', yearly: '$268', ai: '❌', piao: '❌' },
                    { name: 'Santiment Pro', entry: '$49', yearly: '$529', ai: '❌', piao: '❌' },
                    { name: 'Nansen Pro', entry: '$69', yearly: '$588', ai: '✅', piao: '❌' },
                  ].map((row, i) => (
                    <tr key={i} className={`border-b border-border/30 ${i === 0 ? 'bg-gold/5' : 'hover:bg-white/[0.02]'} transition-colors`}>
                      <td className={`px-4 py-2 font-medium ${i === 0 ? 'text-gold' : 'text-foreground'}`}>{row.name}</td>
                      <td className="text-center px-3 py-2 text-muted-foreground">{row.entry}</td>
                      <td className="text-center px-3 py-2 text-muted-foreground">{row.yearly}</td>
                      <td className="text-center px-3 py-2">{row.ai}</td>
                      <td className="text-center px-3 py-2">{row.piao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/50 text-center max-w-2xl mx-auto">
        {t('membershipSvc.disclaimer')}
      </p>

      {/* Sign In Dialog */}
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
}
