import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil } from 'lucide-react';
import { useMedicinesQuery } from '../../../lib/medicines.api';
import { useDefaultRxQuery, useUpsertDefaultRxMutation, type DefaultRxEntry } from '../api/default-rx.api';
import type { DoseFrequency, WhenToTake } from '../../patient-cases/api/patient-cases.api';

const FREQUENCIES: { value: DoseFrequency; label: string }[] = [
  { value: 'ONCE_A_DAY', label: 'Once a day' },
  { value: 'TWICE_A_DAY', label: 'Twice a day' },
  { value: 'THRICE_A_DAY', label: 'Thrice a day' },
  { value: 'ONCE_IN_3_DAYS', label: 'Once in 3 days' },
  { value: 'ONCE_IN_4_DAYS', label: 'Once in 4 days' },
  { value: 'ONCE_A_WEEK', label: 'Once a week' },
];

const WHEN_TO_TAKE: { value: WhenToTake; label: string }[] = [
  { value: 'BEFORE_BREAKFAST', label: 'Before breakfast' },
  { value: 'AFTER_BREAKFAST', label: 'After breakfast' },
  { value: 'BEFORE_LUNCH', label: 'Before lunch' },
  { value: 'AFTER_LUNCH', label: 'After lunch' },
  { value: 'BEFORE_DINNER', label: 'Before dinner' },
  { value: 'AFTER_DINNER', label: 'After dinner' },
];

const schema = z.object({
  medicineId: z.string().min(1, 'Select a medicine'),
  dose: z.string().min(1, 'Required'),
  days: z.coerce.number().int().positive('Must be > 0'),
  frequency: z.enum([
    'ONCE_A_DAY', 'TWICE_A_DAY', 'THRICE_A_DAY',
    'ONCE_IN_3_DAYS', 'ONCE_IN_4_DAYS', 'ONCE_A_WEEK',
  ]),
  whenToTake: z.enum([
    'BEFORE_BREAKFAST', 'AFTER_BREAKFAST', 'BEFORE_LUNCH',
    'AFTER_LUNCH', 'BEFORE_DINNER', 'AFTER_DINNER',
  ]).optional(),
  defaultQty: z.coerce.number().int().positive('Must be > 0'),
});
type FormValues = z.infer<typeof schema>;

export default function DefaultRxPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DefaultRxEntry | null>(null);

  const { data: medicines = [] } = useMedicinesQuery();
  const { data: defaults = [], isLoading } = useDefaultRxQuery();
  const upsert = useUpsertDefaultRxMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function openAdd() {
    setEditing(null);
    reset({ frequency: 'ONCE_A_DAY', days: 7, defaultQty: 1 });
    setShowForm(true);
  }

  function openEdit(entry: DefaultRxEntry) {
    setEditing(entry);
    reset({
      medicineId: entry.medicineId,
      dose: entry.dose,
      days: entry.days,
      frequency: entry.frequency,
      whenToTake: entry.whenToTake,
      defaultQty: entry.defaultQty,
    });
    setShowForm(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      await upsert.mutateAsync({
        medicineId: values.medicineId,
        payload: {
          dose: values.dose,
          days: values.days,
          frequency: values.frequency as DoseFrequency,
          whenToTake: values.whenToTake as WhenToTake | undefined,
          defaultQty: values.defaultQty,
        },
      });
      toast.success('Default prescription saved.');
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to save.');
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Default Prescriptions</h1>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add default
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <h2 className="font-medium">{editing ? 'Edit Default Prescription' : 'Add Default Prescription'}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Medicine" error={errors.medicineId?.message}>
              <select
                {...register('medicineId')}
                disabled={!!editing}
                className={inputCls}
              >
                <option value="">Select medicine…</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Dose" error={errors.dose?.message}>
                <input {...register('dose')} placeholder="e.g. 1 tablet" className={inputCls} />
              </Field>
              <Field label="Days" error={errors.days?.message}>
                <input {...register('days')} type="number" min={1} className={inputCls} />
              </Field>
              <Field label="Default qty" error={errors.defaultQty?.message}>
                <input {...register('defaultQty')} type="number" min={1} className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Frequency" error={errors.frequency?.message}>
                <select {...register('frequency')} className={inputCls}>
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="When to take">
                <select {...register('whenToTake')} className={inputCls}>
                  <option value="">—</option>
                  {WHEN_TO_TAKE.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="bg-card border rounded-lg p-8 animate-pulse text-center text-muted-foreground">
          Loading…
        </div>
      ) : defaults.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No default prescriptions set.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                {['Medicine', 'Dose', 'Days', 'Frequency', 'Default Qty', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {defaults.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{entry.medicine.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.dose}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.days}d</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {FREQUENCIES.find((f) => f.value === entry.frequency)?.label ?? entry.frequency}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.defaultQty} {entry.medicine.unit}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(entry)}
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
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

const inputCls =
  'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
