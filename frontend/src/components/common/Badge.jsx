import React from 'react';
import { useApp } from '../../context/AppContext';

export const StatusBadge = ({ status }) => {
  const { t } = useApp();

  const config = {
    new: {
      label: t('statusNew'),
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      dot: 'bg-blue-400'
    },
    in_progress: {
      label: t('statusInProgress'),
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400'
    },
    pending_approval: {
      label: t('statusPendingApproval'),
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      dot: 'bg-purple-400'
    },
    completed: {
      label: t('statusCompleted'),
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400'
    },
    archived: {
      label: t('statusArchived'),
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      dot: 'bg-slate-400'
    },
    rejected: {
      label: t('statusRejected'),
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400'
    },
    cancelled: {
      label: t('statusCancelled'),
      bg: 'bg-red-500/10 text-red-400 border-red-500/30',
      dot: 'bg-red-400'
    }
  }[status] || {
    label: status,
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  );
};

export const ConfidentialityBadge = ({ level }) => {
  const { t } = useApp();

  const config = {
    public: {
      label: t('confPublic'),
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    internal: {
      label: t('confInternal'),
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    },
    confidential: {
      label: t('confConfidential'),
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
    highly_confidential: {
      label: t('confHighlyConfidential'),
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    }
  }[level] || {
    label: level,
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${config.bg}`}>
      🔒 {config.label}
    </span>
  );
};
