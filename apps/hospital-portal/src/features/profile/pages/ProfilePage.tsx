import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { StateCityPicker, StatusBadge } from '@dawai-setu/domain-ui';
import { useProfileQuery, useUpdateProfileMutation } from '../api/profile.api';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().min(10, 'Invalid phone'),
  state: z.string().min(1, 'Required'),
  city: z.string().min(1, 'Required'),
  address: z.string().min(1, 'Required'),
  pincode: z.string().length(6, 'Must be 6 digits'),
});
type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const state = watch('state');

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        state: profile.state ?? '',
        city: profile.city ?? '',
        address: profile.address ?? '',
        pincode: profile.pincode ?? '',
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await updateProfile.mutateAsync(values);
      toast.success('Profile updated.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to update profile.');
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading…</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profile</h1>
        {profile?.status && (
          <StatusBadge status={profile.status as Parameters<typeof StatusBadge>[0]['status']} />
        )}
      </div>

      <div className="bg-card border rounded-lg p-5">
        <p className="text-sm text-muted-foreground mb-1">Email</p>
        <p className="font-medium">{profile?.email}</p>

        {profile?.specializations && profile.specializations.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground mb-1">Specializations</p>
            <div className="flex flex-wrap gap-1">
              {profile.specializations.map((s) => (
                <span
                  key={s.name}
                  className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-medium">Edit Profile</h2>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={errors.firstName?.message}>
            <input {...register('firstName')} className={inputCls} />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <input {...register('lastName')} className={inputCls} />
          </Field>
        </div>

        <Field label="Phone" error={errors.phone?.message}>
          <input {...register('phone')} className={inputCls} />
        </Field>

        <StateCityPicker
          stateValue={state}
          cityValue={watch('city')}
          onStateChange={(v) => { setValue('state', v, { shouldDirty: true }); setValue('city', ''); }}
          onCityChange={(v) => setValue('city', v, { shouldDirty: true })}
          stateError={errors.state?.message}
          cityError={errors.city?.message}
        />

        <Field label="Address" error={errors.address?.message}>
          <input {...register('address')} className={inputCls} />
        </Field>

        <Field label="Pincode" error={errors.pincode?.message}>
          <input {...register('pincode')} className={inputCls} />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
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
