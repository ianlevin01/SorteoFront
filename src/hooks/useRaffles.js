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
  // Si ya se cargó el número ganador, tratalo como terminado en toda la UI
  // (tarjetas del listado, kicker, selector de compra) sin importar qué
  // `status` tenga puesto todavía el sorteo.
  if (raffle.winner) return 'finished';
  if (raffle.status === 'finished') return 'finished';
  if (raffle.status === 'paused') return 'paused';
  // `closesAt` siempre viaja como ISO con 'Z' (instante UTC real), así que
  // compararlo con `new Date()` es seguro sin importar el huso horario del
  // navegador: los dos lados son instantes absolutos, no horas "sueltas".
  if (raffle.closesAt && new Date() >= new Date(raffle.closesAt)) return 'closed';
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
