import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { StatusBadge, MoneyDisplay } from '@dawai-setu/domain-ui';
import { usePatientCaseQuery } from '../api/patient-cases.api';

const FREQUENCY_LABELS: Record<string, string> = {
  ONCE_A_DAY: 'Once a day',
  TWICE_A_DAY: 'Twice a day',
  THRICE_A_DAY: 'Thrice a day',
  ONCE_IN_3_DAYS: 'Once in 3 days',
  ONCE_IN_4_DAYS: 'Once in 4 days',
  ONCE_A_WEEK: 'Once a week',
};

const WHEN_LABELS: Record<string, string> = {
  BEFORE_BREAKFAST: 'Before breakfast',
  AFTER_BREAKFAST: 'After breakfast',
  BEFORE_LUNCH: 'Before lunch',
  AFTER_LUNCH: 'After lunch',
  BEFORE_DINNER: 'Before dinner',
  AFTER_DINNER: 'After dinner',
};

export default function PatientCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: patientCase, isLoading } = usePatientCaseQuery(id ?? '');

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading…</div>;
  }

  if (!patientCase) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Patient case not found.</p>
        <Link to="/patients" className="mt-3 inline-block text-sm text-primary hover:underline">
          ← Back to cases
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/patients" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold">Patient Case</h1>
      </div>

      {/* Patient Info */}
      <div className="bg-card border rounded-lg p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{patientCase.patientName}</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(patientCase.createdAt), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>
          {patientCase.subOrder && (
            <StatusBadge status={patientCase.subOrder.status as Parameters<typeof StatusBadge>[0]['status']} />
          )}
        </div>

        {patientCase.symptoms.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Symptoms</span>
            <p className="text-sm">{patientCase.symptoms.join(', ')}</p>
          </div>
        )}

        {patientCase.diseases.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Diagnoses</span>
            <p className="text-sm">{patientCase.diseases.join(', ')}</p>
          </div>
        )}

        {patientCase.remarks && (
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Remarks</span>
            <p className="text-sm">{patientCase.remarks}</p>
          </div>
        )}
      </div>

      {/* Medicines */}
      <div className="bg-card border rounded-lg p-5 space-y-3">
        <h2 className="font-medium">Prescribed Medicines</h2>
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left">
              <th className="pb-2 font-medium text-muted-foreground">Medicine</th>
              <th className="pb-2 font-medium text-muted-foreground">Dose</th>
              <th className="pb-2 font-medium text-muted-foreground">Duration</th>
              <th className="pb-2 font-medium text-muted-foreground">Frequency</th>
              <th className="pb-2 font-medium text-muted-foreground">Qty</th>
              <th className="pb-2 font-medium text-muted-foreground text-right">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {patientCase.medicines.map((m) => (
              <tr key={m.id}>
                <td className="py-2">{m.medicine.name}</td>
                <td className="py-2 text-muted-foreground">{m.dose}</td>
                <td className="py-2 text-muted-foreground">{m.days}d</td>
                <td className="py-2 text-muted-foreground">
                  {FREQUENCY_LABELS[m.frequency] ?? m.frequency}
                  {m.whenToTake && <span className="text-xs block">{WHEN_LABELS[m.whenToTake]}</span>}
                </td>
                <td className="py-2 text-muted-foreground">{m.dispensedQty} {m.medicine.unit}</td>
                <td className="py-2 text-right">
                  <MoneyDisplay amount={m.medicineCost} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cost breakdown */}
      <div className="bg-card border rounded-lg p-5 space-y-2">
        <h2 className="font-medium mb-3">Cost Breakdown</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Medicine cost</span>
          <MoneyDisplay amount={patientCase.totalCost} />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Consultation fee</span>
          <MoneyDisplay amount={patientCase.consultationFee} />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <MoneyDisplay amount={patientCase.taxAmount} />
        </div>
        <div className="flex justify-between text-base font-semibold border-t pt-2">
          <span>Grand total</span>
          <MoneyDisplay amount={patientCase.grandTotal} />
        </div>
      </div>

      {/* Sub-order info */}
      {patientCase.subOrder && (
        <div className="bg-card border rounded-lg p-5">
          <h2 className="font-medium mb-2">Dispensing Order</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pharmacy</span>
            <span>{patientCase.subOrder.pharmacy?.name ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={patientCase.subOrder.status as Parameters<typeof StatusBadge>[0]['status']} />
          </div>
        </div>
      )}
    </div>
  );
}
