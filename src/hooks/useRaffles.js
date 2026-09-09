import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function useRaffles({ all = false } = {}) {
  return useQuery({
    queryKey: ['raffles', { all }],
    queryFn: () => api(`/raffles${all ? '?status=all' : ''}`, { auth: false }),
  });
}

export function useRaffle(raffleId) {
  return useQuery({
    queryKey: ['raffle', raffleId],
    queryFn: () => api(`/raffles/${raffleId}`, { auth: false }),
    enabled: Boolean(raffleId),
  });
}

/** Deriva el estado de presentación de un sorteo. */
export function raffleState(raffle) {
  if (!raffle) return 'finished';
  if (raffle.status === 'finished') return 'finished';
  if (raffle.status === 'paused') return 'paused';
  if (
    raffle.totalNumbers != null &&
    raffle.numbersAssigned != null &&
    raffle.numbersAssigned >= raffle.totalNumbers
  ) {
    return 'soldout';
  }
  return 'active';
}

export function raffleProgress(raffle) {
  if (!raffle || !raffle.totalNumbers) return 0;
  return Math.min(100, Math.round(((raffle.numbersAssigned || 0) / raffle.totalNumbers) * 100));
}
