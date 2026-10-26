import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';

export default function StatusBadge({ status }) {
  if (!status) return null;

  switch (status.toUpperCase()) {
    case 'COMPLETED':
    case 'APPROVED':
    case 'MET':
      return (
        <span className="badge badge-completed">
          <CheckCircle2 size={12} />
          {status}
        </span>
      );

    case 'ACTIVE':
    case 'SCHEDULED':
    case 'REVIEW_SCHEDULED':
      return (
        <span className="badge badge-active">
          <Clock size={12} />
          {status.replace(/_/g, ' ')}
        </span>
      );

    case 'ALLOCATED':
    case 'TASK_EXPLANATION_READY':
    case 'SUBMISSION_PENDING':
    case 'SUBMITTED':
    case 'HUMAN_REVIEW_PENDING':
    case 'AI_ANALYZED':
    case 'PENDING':
      return (
        <span className="badge badge-pending">
          <Clock size={12} />
          {status.replace(/_/g, ' ')}
        </span>
      );

    case 'REVISION_REQUESTED':
    case 'REVISION REQUIRED':
    case 'PARTIALLY MET':
      return (
        <span className="badge badge-revision">
          <RotateCcw size={12} />
          {status.replace(/_/g, ' ')}
        </span>
      );

    case 'INCOMPLETE_AT_END_DATE':
    case 'MISSING':
    case 'FAILED':
      return (
        <span className="badge badge-incomplete">
          <XCircle size={12} />
          {status.replace(/_/g, ' ')}
        </span>
      );

    default:
      return <span className="badge">{status}</span>;
  }
}
