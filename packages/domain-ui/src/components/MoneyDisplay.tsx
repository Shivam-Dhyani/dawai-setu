import React from 'react';

// Single source of truth for money formatting across both portals (PRD §12).
// All monetary figures are display-only — no payment gateway, no PDF (PRD §3.2).

export function formatMoney(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num);
}

interface Props {
  amount: number | string;
  className?: string;
}

export function MoneyDisplay({ amount, className }: Props) {
  return <span className={className}>{formatMoney(amount)}</span>;
}
