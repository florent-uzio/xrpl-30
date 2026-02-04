import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { Client, dropsToXrp } from "xrpl";
import type { AccountObjectsResponse } from "xrpl/dist/npm/models/methods/accountObjects";
import type { AccountInfoResponse } from "xrpl/dist/npm/models/methods/accountInfo";

/**
 * Fetch account information
 */
export const fetchAccountInfo = async (
  client: Client,
  accountAddress: string,
): Promise<AccountInfoResponse["result"]> => {
  if (!client.isConnected()) {
    await client.connect();
  }

  const response = await client.request({
    command: "account_info",
    account: accountAddress,
    ledger_index: "validated",
  });

  return response.result;
};

/**
 * Hook to fetch account information
 */
export const useAccountInfo = (
  client: Client | null,
  accountAddress: string | undefined,
  options?: Omit<
    UseQueryOptions<AccountInfoResponse["result"], Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["account", accountAddress],
    queryFn: () => {
      if (!client || !accountAddress) {
        throw new Error("Client or accountAddress not provided");
      }
      return fetchAccountInfo(client, accountAddress);
    },
    enabled: !!client && !!accountAddress && client.isConnected(),
    staleTime: 10000, // 10 seconds
    retry: (failureCount, error) => {
      // Don't retry if account not found
      if (error.message.includes("actNotFound")) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};

/**
 * Fetch account objects with optional type filter
 */
export const fetchAccountObjects = async (
  client: Client,
  accountAddress: string,
  type?: string,
): Promise<AccountObjectsResponse["result"]> => {
  if (!client.isConnected()) {
    await client.connect();
  }

  const response = await client.request({
    command: "account_objects",
    account: accountAddress,
    ...(type && { type }),
  });

  return response.result;
};

/**
 * Hook to fetch account objects
 */
export const useAccountObjects = (
  client: Client | null,
  accountAddress: string | undefined,
  type?: string,
  options?: Omit<
    UseQueryOptions<AccountObjectsResponse["result"], Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["account-objects", accountAddress, type],
    queryFn: () => {
      if (!client || !accountAddress) {
        throw new Error("Client or accountAddress not provided");
      }
      return fetchAccountObjects(client, accountAddress, type);
    },
    enabled: !!client && !!accountAddress && client.isConnected(),
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry if account not found
      if (error.message.includes("actNotFound")) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};

/**
 * Helper hook to get account balance
 */
export const useAccountBalance = (
  client: Client | null,
  accountAddress: string | undefined,
) => {
  const { data, ...rest } = useAccountInfo(client, accountAddress);

  return {
    balance: data ? dropsToXrp(data.account_data.Balance).toString() : null,
    sequence: data?.account_data.Sequence,
    ...rest,
  };
};
