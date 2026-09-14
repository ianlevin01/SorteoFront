import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Disponibilidad de un rango de números de un sorteo "elegí tu número".
 * Se refresca solo cada tanto: si otra persona toma un número no nos
 * enteramos al instante, pero el server siempre corta la carrera real
 * cuando alguien efectivamente intenta reservarlo.
 */
export function useNumberAvailability(raffleId, from, to) {
  return useQuery({
    queryKey: ['raffle-numbers', raffleId, from, to],
    queryFn: () => api(`/raffles/${raffleId}/numbers?from=${from}&to=${to}`, { auth: false }),
    enabled: Boolean(raffleId),
    staleTime: 8000,
    refetchInterval: 15000,
  });
}

/** Números que ya tengo reservados (sin orden todavía) en este sorteo. */
export function useMySelection(raffleId) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['raffle-numbers', raffleId, 'mine'],
    queryFn: () => api(`/raffles/${raffleId}/numbers/mine`),
    enabled: isAuthenticated && Boolean(raffleId),
    staleTime: 0,
  });
}

export function useReserveNumber(raffleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (number) => api(`/raffles/${raffleId}/numbers/${number}/reserve`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['raffle-numbers', raffleId] });
    },
  });
}

export function useReserveRandomNumbers(raffleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (count) => api(`/raffles/${raffleId}/numbers/random`, { method: 'POST', body: { count } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['raffle-numbers', raffleId] });
    },
  });
}

export function useReleaseNumber(raffleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (number) =>
      api(`/raffles/${raffleId}/numbers/${number}/reserve`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['raffle-numbers', raffleId] });
    },
  });
}
