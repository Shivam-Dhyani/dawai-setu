import React from 'react';

type Status =
  | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  | 'RECEIVED_PENDING' | 'READY_TO_USE' | 'NEAR_EXPIRY' | 'EXPIRED'
  | 'ACTIVE' | 'INACTIVE';

const STYLE: Record<Status, string> = {
  PENDING:          'bg-yellow-100 text-yellow-800',
  ACCEPTED:         'bg-blue-100 text-blue-800',
  COMPLETED:        'bg-green-100 text-green-800',
  REJECTED:         'bg-red-100 text-red-800',
  CANCELLED:        'bg-gray-100 text-gray-600',
  RECEIVED_PENDING: 'bg-orange-100 text-orange-800',
  READY_TO_USE:     'bg-green-100 text-green-800',
  NEAR_EXPIRY:      'bg-yellow-100 text-yellow-800',
  EXPIRED:          'bg-red-100 text-red-800',
  ACTIVE:           'bg-green-100 text-green-800',
  INACTIVE:         'bg-gray-100 text-gray-600',
};

const LABEL: Record<Status, string> = {
  PENDING:          'Pending',
  ACCEPTED:         'Accepted',
  COMPLETED:        'Completed',
  REJECTED:         'Rejected',
  CANCELLED:        'Cancelled',
  RECEIVED_PENDING: 'Pending Receipt',
  READY_TO_USE:     'Ready to Use',
  NEAR_EXPIRY:      'Near Expiry',
  EXPIRED:          'Expired',
  ACTIVE:           'Active',
  INACTIVE:         'Inactive',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLE[status]}`}>
      {LABEL[status]}
    </span>
  );
}
