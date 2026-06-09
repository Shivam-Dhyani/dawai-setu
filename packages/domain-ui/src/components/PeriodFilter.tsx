import React from 'react';

export type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

// Note: dashboard uses day/week/month/quarter/year (PRD §10.3, §11.3).
// Patient case list uses day/week/month/year (no quarter — PRD §10.4).
// Pass the `periods` prop to control which options appear.

const ALL_PERIODS: { value: Period; label: string }[] = [
  { value: 'day',     label: 'Day' },
  { value: 'week',    label: 'Week' },
  { value: 'month',   label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year',    label: 'Year' },
];

interface Props {
  value: Period;
  onChange: (period: Period) => void;
  periods?: Period[];
}

export function PeriodFilter({ value, onChange, periods }: Props) {
  const options = periods
    ? ALL_PERIODS.filter((p) => periods.includes(p.value))
    : ALL_PERIODS;

  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {options.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === p.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
