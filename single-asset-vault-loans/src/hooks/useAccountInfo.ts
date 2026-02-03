import { useQuery } from '@tanstack/react-query';
import { Client, dropsToXrp } from 'xrpl';

interface AccountInfoData {
  address: string;
  balance: string;
  sequence: number;
  ownerCount: number;
  previousTxnID: string;
  previousTxnLgrSeq: number;
}

interface UseAccountInfoOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export const useAccountInfo = (
  client: Client,
  address: string | null | undefined,
  options: UseAccountInfoOptions = {}
) => {
  return useQuery({
    queryKey: ['accountInfo', address],
    queryFn: async (): Promise<AccountInfoData> => {
      if (!address) {
        throw new Error('Address is required');
      }

      // Ensure client is connected
      if (!client.isConnected()) {
        await client.connect();
      }

      const response = await client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated',
      });

      const accountData = response.result.account_data;

      return {
        address: accountData.Account,
        balance: dropsToXrp(accountData.Balance).toString(),
        sequence: accountData.Sequence,
        ownerCount: accountData.OwnerCount,
        previousTxnID: accountData.PreviousTxnID,
        previousTxnLgrSeq: accountData.PreviousTxnLgrSeq,
      };
    },
    enabled: !!address && options.enabled !== false,
    refetchInterval: options.refetchInterval,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
};
