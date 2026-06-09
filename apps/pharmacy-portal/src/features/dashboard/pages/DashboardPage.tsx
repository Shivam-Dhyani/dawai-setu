import React, { useState } from 'react';
import { PeriodFilter } from '@dawai-setu/domain-ui';
import { useDashboardQuery } from '../api/dashboard.api';
import { useAuthStore } from '../../../store/auth.store';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('month');
  const { data, isLoading } = useDashboardQuery(period);
  const pharmacy = useAuthStore((s) => s.pharmacy);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome, {pharmacy?.name}</p>
        </div>
        <PeriodFilter value={period} onChange={(v) => setPeriod(v as Period)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending Orders" value={data?.pendingSubOrders} />
          <StatCard label="Accepted" value={data?.acceptedSubOrders} />
          <StatCard label="Completed" value={data?.completedSubOrders} />
          <StatCard label="Rejected" value={data?.rejectedSubOrders} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
    </div>
  );
}
