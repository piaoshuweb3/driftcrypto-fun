'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: 'free' | 'plus' | 'pro';
}

// ---------------------------------------------------------------------------
// Tier data
// ---------------------------------------------------------------------------
interface TierInfo {
  key: 'free' | 'plus' | 'pro';
  nameKey: string;
  price: number;
  featuresKey: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  borderClass: string;
  bgGlowClass: string;
  popular?: boolean;
}

const tiers: TierInfo[] = [
  {
    key: 'free',
    nameKey: 'membership.free',
    price: 0,
    featuresKey: 'membership.freeFeatures',
    icon: Zap,
    accentClass: 'text-muted-foreground',
    borderClass: 'border-white/10',
    bgGlowClass: '',
  },
  {
    key: 'plus',
    nameKey: 'membership.plus',
    price: 9.99,
    featuresKey: 'membership.plusFeatures',
    icon: Zap,
    accentClass: 'text-gold',
    borderClass: 'border-gold/40',
    bgGlowClass: 'shadow-lg shadow-gold/10',
    popular: true,
  },
  {
    key: 'pro',
    nameKey: 'membership.pro',
    price: 29.99,
    featuresKey: 'membership.proFeatures',
    icon: Crown,
    accentClass: 'text-amber-300',
    borderClass: 'border-amber-400/40',
    bgGlowClass: 'shadow-lg shadow-amber-500/10',
  },
];

// ---------------------------------------------------------------------------
// MembershipDialog Component
// ---------------------------------------------------------------------------
export default function MembershipDialog({
  open,
  onOpenChange,
  currentPlan = 'free',
}: MembershipDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl bg-[#12121a]/95 backdrop-blur-xl border-white/10 text-foreground"
        showCloseButton
      >
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-2xl font-bold">
            <span className="gradient-text">{t('membership.title')}</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('membership.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {tiers.map((tier, idx) => {
            const Icon = tier.icon;
            const isCurrent = currentPlan === tier.key;
            const isPopular = tier.popular;

            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className={`relative flex flex-col rounded-xl border p-6 bg-card/50 backdrop-blur-sm transition-all ${
                  isCurrent
                    ? 'border-gold/50 ring-1 ring-gold/30'
                    : tier.borderClass
                } ${tier.bgGlowClass}`}
              >
                {/* Most Popular badge */}
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-[#0a0a0f] text-xs font-semibold px-3 hover:bg-gold">
                    {t('membership.mostPopular')}
                  </Badge>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <Badge
                    variant="outline"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 border-gold/50 text-gold text-xs font-semibold px-3 bg-[#12121a]"
                  >
                    {t('membership.currentPlan')}
                  </Badge>
                )}

                {/* Icon */}
                <div className="flex items-center justify-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      tier.key === 'free'
                        ? 'bg-white/5'
                        : tier.key === 'plus'
                        ? 'bg-gold/10'
                        : 'bg-amber-500/10'
                    }`}
                  >
                    <Icon className={`size-6 ${tier.accentClass}`} />
                  </div>
                </div>

                {/* Tier name */}
                <h3 className={`text-lg font-bold text-center ${tier.accentClass}`}>
                  {t(tier.nameKey)}
                </h3>

                {/* Price */}
                <div className="text-center mt-2 mb-4">
                  <span className="text-3xl font-bold text-foreground">
                    {tier.price === 0 ? '$0' : `$${tier.price}`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t('membership.perMonth')}
                  </span>
                </div>

                {/* Features list */}
                <div className="flex-1 mb-6">
                  <ul className="space-y-2.5">
                    {t(tier.featuresKey)
                      .split(', ')
                      .map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check
                            className={`size-4 shrink-0 mt-0.5 ${
                              tier.key === 'free'
                                ? 'text-muted-foreground'
                                : 'text-gold'
                            }`}
                          />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Action button */}
                {isCurrent ? (
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-muted-foreground cursor-default"
                    disabled
                  >
                    {t('membership.currentPlan')}
                  </Button>
                ) : (
                  <Button
                    className={`w-full font-semibold ${
                      tier.key === 'plus'
                        ? 'bg-gold hover:bg-gold/90 text-[#0a0a0f] shadow-lg shadow-gold/20'
                        : tier.key === 'pro'
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-white/10 hover:bg-white/15 text-foreground'
                    }`}
                  >
                    {t('membership.upgrade')}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
