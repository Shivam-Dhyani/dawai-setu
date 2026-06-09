import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useAvailableMedicinesQuery } from '../../../lib/medicines.api';
import { useCreatePatientCaseMutation, type DoseFrequency, type WhenToTake } from '../api/patient-cases.api';

const medicineSchema = z.object({
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
  dispensedQty: z.coerce.number().int().positive('Must be > 0'),
});

const schema = z.object({
  patientName: z.string().min(1, 'Required'),
  symptoms: z.string().optional(),
  diseases: z.string().optional(),
  remarks: z.string().optional(),
  medicines: z.array(medicineSchema).min(1, 'Add at least one medicine'),
});
type FormValues = z.infer<typeof schema>;

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

export default function NewPatientCasePage() {
  const navigate = useNavigate();
  const { data: medicines = [] } = useAvailableMedicinesQuery();
  const createCase = useCreatePatientCaseMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      medicines: [{ medicineId: '', dose: '', days: 1, frequency: 'ONCE_A_DAY', dispensedQty: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'medicines' });

  async function onSubmit(values: FormValues) {
    try {
      const result = await createCase.mutateAsync({
        patientName: values.patientName,
        symptoms: values.symptoms ? values.symptoms.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        diseases: values.diseases ? values.diseases.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        remarks: values.remarks || undefined,
        medicines: values.medicines.map((m) => ({
          medicineId: m.medicineId,
          dose: m.dose,
          days: m.days,
          frequency: m.frequency as DoseFrequency,
          whenToTake: m.whenToTake as WhenToTake | undefined,
          dispensedQty: m.dispensedQty,
        })),
      });
      toast.success('Patient case created successfully.');
      navigate(`/patients/${result.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create patient case.');
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/patients')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold">New Patient Case</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="bg-card border rounded-lg p-5 space-y-4">
          <h2 className="font-medium">Patient Details</h2>

          <Field label="Patient name" error={errors.patientName?.message}>
            <input {...register('patientName')} placeholder="Full name" className={inputCls} />
          </Field>

          <Field label="Symptoms (comma-separated)" error={errors.symptoms?.message}>
            <input {...register('symptoms')} placeholder="e.g. Fever, Headache" className={inputCls} />
          </Field>

          <Field label="Diagnoses (comma-separated)" error={errors.diseases?.message}>
            <input {...register('diseases')} placeholder="e.g. Malaria, Typhoid" className={inputCls} />
          </Field>

          <Field label="Remarks" error={errors.remarks?.message}>
            <textarea {...register('remarks')} rows={2} placeholder="Optional notes" className={`${inputCls} resize-none`} />
          </Field>
        </section>

        <section className="bg-card border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Medicines</h2>
            <button
              type="button"
              onClick={() =>
                append({ medicineId: '', dose: '', days: 1, frequency: 'ONCE_A_DAY', dispensedQty: 1 })
              }
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="h-4 w-4" /> Add medicine
            </button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-md p-4 space-y-3 relative">
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <Field label="Medicine" error={errors.medicines?.[index]?.medicineId?.message}>
                <select {...register(`medicines.${index}.medicineId`)} className={inputCls}>
                  <option value="">Select medicine…</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Dose" error={errors.medicines?.[index]?.dose?.message}>
                  <input {...register(`medicines.${index}.dose`)} placeholder="e.g. 1 tablet" className={inputCls} />
                </Field>
                <Field label="Days" error={errors.medicines?.[index]?.days?.message}>
                  <input {...register(`medicines.${index}.days`)} type="number" min={1} className={inputCls} />
                </Field>
                <Field label="Qty to dispense" error={errors.medicines?.[index]?.dispensedQty?.message}>
                  <input {...register(`medicines.${index}.dispensedQty`)} type="number" min={1} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Frequency" error={errors.medicines?.[index]?.frequency?.message}>
                  <select {...register(`medicines.${index}.frequency`)} className={inputCls}>
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="When to take (optional)">
                  <select {...register(`medicines.${index}.whenToTake`)} className={inputCls}>
                    <option value="">—</option>
                    {WHEN_TO_TAKE.map((w) => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          ))}

          {errors.medicines?.root && (
            <p className="text-xs text-destructive">{errors.medicines.root.message}</p>
          )}
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creating…' : 'Create patient case'}
          </button>
        </div>
      </form>
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
