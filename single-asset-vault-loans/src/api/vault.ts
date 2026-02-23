import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { Client, Wallet, validate, type VaultDelete } from "xrpl";
import type { VaultInfoResponse } from "xrpl/dist/npm/models/methods/vaultInfo";
import type Vault from "xrpl/dist/npm/models/ledger/Vault";
import type { XRPLAccount } from "../types/account";

/**
 * Fetch vault information by vault ID
 */
export const fetchVaultInfo = async (
  client: Client,
  vaultId: string,
): Promise<VaultInfoResponse["result"]> => {
  if (!client.isConnected()) {
    await client.connect();
  }

  const response = await client.request({
    command: "vault_info",
    vault_id: vaultId,
  });

  return response.result;
};

/**
 * Hook to fetch vault information
 */
export const useVaultInfo = (
  client: Client | null,
  vaultId: string | undefined,
  options?: Omit<
    UseQueryOptions<VaultInfoResponse["result"], Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["vault", vaultId],
    queryFn: () => {
      if (!client || !vaultId) {
        throw new Error("Client or vaultId not provided");
      }
      return fetchVaultInfo(client, vaultId);
    },
    enabled: !!client && !!vaultId && client.isConnected(),
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

/**
 * Fetch vaults for an account using account_objects
 */
export const fetchAccountVaults = async (
  client: Client,
  accountAddress: string,
): Promise<Vault[]> => {
  if (!client.isConnected()) {
    await client.connect();
  }

  const response = await client.request({
    command: "account_objects",
    account: accountAddress,
    type: "vault",
  });

  // Filter for Vault ledger entries
  const vaultObjects = response.result.account_objects.filter(
    (obj): obj is Vault => obj.LedgerEntryType === "Vault",
  );

  return vaultObjects;
};

/**
 * Hook to fetch all vaults for an account
 */
export const useAccountVaults = (
  client: Client | null,
  accountAddress: string | undefined,
  options?: Omit<UseQueryOptions<Vault[], Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: ["vaults", accountAddress],
    queryFn: () => {
      if (!client || !accountAddress) {
        throw new Error("Client or accountAddress not provided");
      }
      return fetchAccountVaults(client, accountAddress);
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
 * Mutation hook to delete a vault
 */
export const useDeleteVault = (
  client: Client | null,
  account: XRPLAccount | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vaultId: string) => {
      if (!client || !account) throw new Error("Client or account not provided");
      if (!account.seed) throw new Error("Account seed not found");

      const tx: VaultDelete = {
        TransactionType: "VaultDelete",
        Account: account.address,
        VaultID: vaultId,
      };

      validate(tx);

      const wallet = Wallet.fromSeed(account.seed);
      return client.submitAndWait(tx, { autofill: true, wallet });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaults", account?.address] });
    },
  });
};
