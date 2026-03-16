import { useQuery } from "@tanstack/react-query";
import { Client } from "xrpl";

export interface MPToken {
  LedgerEntryType: "MPToken";
  Account: string;
  MPTokenIssuanceID: string;
  MPTAmount?: string; // hex string, absent means 0
  Flags: number;
}

export const useAccountObjects = (client: Client | null, address: string) => {
  return useQuery({
    queryKey: ["accountObjects", "mptoken", address],
    queryFn: async (): Promise<MPToken[]> => {
      const { result } = await client!.request({
        command: "account_objects",
        account: address,
        type: "mptoken",
      });
      return result.account_objects as unknown as MPToken[];
    },
    enabled: !!client && !!address,
    staleTime: 30_000,
    refetchInterval: 5000,
    retry: 1,
  });
};
