import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { PeriodFilter, StatusBadge } from '@dawai-setu/domain-ui';
import { usePatientCasesQuery, type PatientCase } from '../api/patient-cases.api';
import { formatMoney } from '@dawai-setu/domain-ui';
import { format } from 'date-fns';

type Period = 'day' | 'week' | 'month' | 'year';

const col = createColumnHelper<PatientCase>();

const columns = [
  col.accessor('patientName', { header: 'Patient' }),
  col.accessor('createdAt', {
    header: 'Date',
    cell: (info) => format(new Date(info.getValue()), 'dd MMM yyyy'),
  }),
  col.accessor('diseases', {
    header: 'Diagnoses',
    cell: (info) => info.getValue()?.join(', ') || '—',
  }),
  col.accessor('grandTotal', {
    header: 'Total Cost',
    cell: (info) => formatMoney(info.getValue()),
  }),
  col.accessor('subOrder', {
    header: 'Sub-order Status',
    cell: (info) => {
      const sub = info.getValue();
      return sub ? <StatusBadge status={sub.status as Parameters<typeof StatusBadge>[0]['status']} /> : '—';
    },
  }),
  col.display({
    id: 'actions',
    cell: (info) => (
      <Link
        to={`/patients/${info.row.original.id}`}
        className="text-sm text-primary hover:underline"
      >
        View
      </Link>
    ),
  }),
];

export default function PatientCasesPage() {
  const [period, setPeriod] = useState<Period>('month');
  const { data = [], isLoading } = usePatientCasesQuery(period);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Patient Cases</h1>
        <div className="flex items-center gap-3">
          <PeriodFilter
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            periods={['day', 'week', 'month', 'year']}
          />
          <Link
            to="/patients/new"
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New case
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground animate-pulse">
          Loading…
        </div>
      ) : data.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No patient cases for this period.</p>
          <Link to="/patients/new" className="mt-3 inline-block text-sm text-primary hover:underline">
            Create the first case →
          </Link>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                {columns.map((c) => (
                  <th key={c.id} className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {'header' in c && typeof c.header === 'string' ? c.header : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{row.patientName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(row.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.diseases?.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">{formatMoney(row.grandTotal)}</td>
                  <td className="px-4 py-3">
                    {row.subOrder ? (
                      <StatusBadge status={row.subOrder.status as Parameters<typeof StatusBadge>[0]['status']} />
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/patients/${row.id}`} className="text-primary hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
