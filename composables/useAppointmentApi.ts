import { ref } from 'vue';
import { useApi } from '@/composables/useApi';
import type { Appointment } from '@/components/appointments/data/schema';

export function useAppointmentApi() {
  const api = useApi();
  const appointments = ref<Appointment[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  async function fetchAppointments(params: Record<string, any> = {}) {
    isLoading.value = true;
    error.value = null;
    try {
      const response: any = await api('/appointments', { params });
      // The API structure seems to be { data: [...], meta: { ... } } or just the data
      if (response.data) {
        appointments.value = response.data;
        return response;
      } else {
        appointments.value = response;
        return { data: response };
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      error.value = err.response?.data?.message || err.message || 'Network error occurred';
      appointments.value = [];
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function getAppointment(id: string) {
    isLoading.value = true;
    try {
      const response: any = await api(`/appointments/${id}`);
      return response;
    } catch (err: any) {
      console.error(`Error fetching appointment ${id}:`, err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function createAppointment(data: any) {
    isSaving.value = true;
    try {
      const response: any = await api('/appointments', {
        method: 'POST',
        body: data,
      });
      return response;
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      throw err;
    } finally {
      isSaving.value = false;
    }
  }

  async function updateAppointment(id: string, data: any) {
    isSaving.value = true;
    try {
      // Use POST with _method: PUT if needed, or just PUT
      // Based on usePaymentMethodApi, it uses POST with _method: PUT
      const response: any = await api(`/appointments/${id}`, {
        method: 'POST',
        body: {
          ...data,
          _method: 'PUT',
        },
      });
      return response;
    } catch (err: any) {
      console.error(`Error updating appointment ${id}:`, err);
      throw err;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteAppointment(id: string) {
    isSaving.value = true;
    try {
      const response: any = await api(`/appointments/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (err: any) {
      console.error(`Error deleting appointment ${id}:`, err);
      throw err;
    } finally {
      isSaving.value = false;
    }
  }

  async function updateStatus(id: string, status: string, extraData: any = {}) {
    return updateAppointment(id, { status, ...extraData });
  }

  return {
    appointments,
    isLoading,
    isSaving,
    error,
    fetchAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus,
  };
}
