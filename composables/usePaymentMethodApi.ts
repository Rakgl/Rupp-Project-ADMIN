import type { PaymentMethod } from '@/types';
import { ref } from 'vue';
import { useApi } from '@/composables/useApi';

export function usePaymentMethodApi() {
  const api = useApi();
  const paymentMethods = ref<PaymentMethod[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  function mapApiResponse(data: any): PaymentMethod {
    return {
      ...data,
    };
  }

  async function fetchPaymentMethods() {
    isLoading.value = true;
    error.value = null;
    try {
      const response: any = await api('/payment-methods');
      if (response.success) {
        paymentMethods.value = response.data.data.map(mapApiResponse);
      } else {
        throw new Error(response.message || 'Failed to fetch payment methods.');
      }
    } catch (err: any) {
      console.error('Error fetching payment methods:', err);
      error.value = err.response?.data?.message || err.message || 'Network error occurred';
      paymentMethods.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function createPaymentMethod(methodData: Partial<PaymentMethod> | FormData) {
    isSaving.value = true;
    try {
      const options: any = { method: 'POST' };

      if (methodData instanceof FormData) {
        options.body = methodData;
      } else {
        options.body = methodData;
      }

      const response: any = await api('/payment-methods', options);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create payment method.');
      }
      await fetchPaymentMethods();
      return mapApiResponse(response.data);
    } catch (err: any) {
      console.error('Error creating payment method:', err);
      const errorMessage = err.response?.data?.message_details
        ? Object.values(err.response.data.message_details).flat().join(', ')
        : err.response?.data?.message || err.message || 'Failed to create payment method';
      throw new Error(errorMessage);
    } finally {
      isSaving.value = false;
    }
  }

  async function updatePaymentMethod(id: string, methodData: Partial<PaymentMethod> | FormData) {
    isSaving.value = true;
    try {
      const options: any = { method: 'POST' };

      if (methodData instanceof FormData) {
        methodData.append('_method', 'PUT');
        options.body = methodData;
      } else {
        options.body = {
          ...methodData,
          _method: 'PUT',
        };
      }

      const response: any = await api(`/payment-methods/${id}`, options);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update payment method.');
      }
      await fetchPaymentMethods();
      return mapApiResponse(response.data || {});
    } catch (err: any) {
      console.error('Error updating payment method:', err);
      const errorMessage = err.response?.data?.message_details
        ? Object.values(err.response.data.message_details).flat().join(', ')
        : err.response?.data?.message || err.message || 'Failed to update payment method';
      throw new Error(errorMessage);
    } finally {
      isSaving.value = false;
    }
  }

  async function deletePaymentMethod(id: string) {
    isSaving.value = true;
    try {
      const response: any = await api(`/payment-methods/${id}`, {
        method: 'DELETE',
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete payment method.');
      }
      await fetchPaymentMethods();
    } catch (err: any) {
      console.error('Error deleting payment method:', err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to delete payment method';
      throw new Error(errorMessage);
    } finally {
      isSaving.value = false;
    }
  }

  return {
    paymentMethods,
    isLoading,
    isSaving,
    error,
    fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  };
}
