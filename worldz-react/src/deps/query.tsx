import {
  QueryClient,
  QueryClientProvider,
  useQuery as use_query,
  useQueryClient as use_query_client,
  useIsFetching as use_is_fetching,
  useIsMutating as use_is_mutating,
  useMutation as use_mutation,
} from "@tanstack/react-query";

const query_client = new QueryClient();

export {
  query_client,
  QueryClientProvider,
  use_query,
  use_query_client,
  use_is_fetching,
  use_is_mutating,
  use_mutation,
};

export type { QueryClient };
