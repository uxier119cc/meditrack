import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

/**
 * Custom hook for handling API requests with React Query
 */
export const useApi = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Fetch data from the API with automatic error handling
   */
  const fetchData = <T>(
    queryKey: string[],
    fetchFn: () => Promise<T>,
    options = {}
  ) => {
    return useQuery({
      queryKey,
      queryFn: async () => {
        try {
          return await fetchFn();
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'An error occurred while fetching data';
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
          throw error;
        }
      },
      ...options,
    });
  };

  /**
   * Mutate data with automatic error handling and success messages
   */
  const mutateData = <T, V>(
    mutationFn: (data: V) => Promise<T>,
    options: {
      onSuccess?: (data: T) => void;
      onError?: (error: any) => void;
      invalidateQueries?: string[];
      successMessage?: string;
    } = {}
  ) => {
    const { onSuccess, onError, invalidateQueries, successMessage } = options;

    return useMutation({
      mutationFn,
      onSuccess: (data) => {
        if (successMessage) {
          toast({
            title: 'Success',
            description: successMessage,
          });
        }

        if (invalidateQueries) {
          invalidateQueries.forEach((query) => {
            queryClient.invalidateQueries({ queryKey: [query] });
          });
        }

        if (onSuccess) {
          onSuccess(data);
        }
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'An error occurred';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        if (onError) {
          onError(error);
        }
      },
    });
  };

  return {
    fetchData,
    mutateData,
  };
};
