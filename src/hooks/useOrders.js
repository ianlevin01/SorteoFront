import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ raffleId, tierId, numbers }) =>
      api('/orders', { method: 'POST', body: { raffleId, tierId, numbers } }),
    onSuccess: (_data, { raffleId }) => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['raffles'] });
      if (raffleId) qc.invalidateQueries({ queryKey: ['raffle-numbers', raffleId] });
    },
  });
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, file }) => {
      const fd = new FormData();
      fd.append('receipt', file);
      return api(`/orders/${orderId}/receipt`, { method: 'POST', body: fd, form: true });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useRequestReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, note }) =>
      api(`/orders/${orderId}/request-review`, { method: 'POST', body: { note } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useMyOrder(orderId) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['me', 'order', orderId],
    queryFn: () => api(`/me/orders/${orderId}`),
    enabled: isAuthenticated && Boolean(orderId),
    // Mientras un pedido "elegí tu número" espera el pago, lo repreguntamos
    // solo para detectar apenas se vence el tiempo de reserva (el server lo
    // resuelve de forma perezosa al consultarlo) y pasar a avisarle al
    // usuario en cuanto pasa.
    refetchInterval: (query) => {
      const d = query.state.data;
      return d && d.mode === 'pick' && d.status === 'pending_payment' ? 5000 : false;
    },
  });
}

export function useMyNumberGroups() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['me', 'numbers'],
    queryFn: () => api('/me/numbers'),
    enabled: isAuthenticated,
  });
}

export function useMyRaffleTickets(raffleId) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['me', 'numbers', raffleId],
    queryFn: () => api(`/me/numbers/${raffleId}`),
    enabled: isAuthenticated && Boolean(raffleId),
  });
}

export function usePaymentInfo() {
  return useQuery({
    queryKey: ['payment-info'],
    queryFn: () => api('/payment-info', { auth: false }),
    staleTime: 5 * 60_000,
  });
}
