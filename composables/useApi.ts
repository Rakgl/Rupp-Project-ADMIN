// import { useAuth } from '#auth'
export function useApi() {
  const config = useRuntimeConfig();
  const apiURL = config.public.apiURL;
  const { token } = useAuth();

  return $fetch.create({
    baseURL: apiURL,
    async onRequest({ options }) {
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `${token.value}`,
        };
      }
    },
  });
}
