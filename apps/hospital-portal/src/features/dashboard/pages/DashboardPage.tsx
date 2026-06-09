import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PeriodFilter } from '@dawai-setu/domain-ui';
import { useDashboardQuery } from '../api/dashboard.api';
import { useAuthStore } from '../../../store/auth.store';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('month');
  const { data, isLoading } = useDashboardQuery(period);
  const user = useAuthStore((s) => s.user);
  const isDoctor = user?.roleName === 'DOCTOR';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.firstName}
          </p>
        </div>
        <PeriodFilter value={period} onChange={(v) => setPeriod(v as Period)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : isDoctor ? (
        <DoctorStats data={data} />
      ) : (
        <PharmacistStats data={data} />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
    </div>
  );
}

function DoctorStats({ data }: { data?: ReturnType<typeof useDashboardQuery>['data'] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Patient Cases" value={data?.totalPatientCases} />
        <StatCard label="Cases Today" value={data?.casesToday} />
        <StatCard label="Medicines Dispensed" value={data?.medicinesDispensed} />
      </div>

      {data?.trend && data.trend.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-sm font-medium mb-3">Patient Cases Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.trend}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function PharmacistStats({ data }: { data?: ReturnType<typeof useDashboardQuery>['data'] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Orders" value={data?.totalOrders} />
      <StatCard label="Pending Orders" value={data?.pendingOrders} />
      <StatCard label="Ready Batches" value={data?.readyBatches} />
      <StatCard label="Near Expiry" value={data?.nearExpiryCount} />
    </div>
  );
}
