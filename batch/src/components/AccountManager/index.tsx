import React from "react";
import { Client, Wallet } from "xrpl";
import { Wallet as WalletIcon } from "lucide-react";
import GenerateAccounts from "./GenerateAccounts";
import ImportAccount from "./ImportAccount";
import AccountCard from "./AccountCard";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
  ious: any[];
  label?: string;
}

interface AccountManagerProps {
  client: Client | null;
  accounts: Account[];
  selectedAccount: Account | null;
  onAccountSelect: (account: Account) => void;
  onAccountAdd: (account: Account) => void;
  onAccountUpdate: (account: Account) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  faucetHost: string;
  faucetPath: string;
}

const AccountManager: React.FC<AccountManagerProps> = ({
  client,
  accounts,
  selectedAccount,
  onAccountSelect,
  onAccountAdd,
  onAccountUpdate,
  isLoading,
  setIsLoading,
  faucetHost,
  faucetPath,
}) => {
  const generateAccounts = async (count: number) => {
    if (!client) return;
    setIsLoading(true);
    try {
      const wallets = Array.from({ length: count }, () => Wallet.generate());
      await Promise.all(
        wallets.map(async (wallet) => {
          await client.fundWallet(wallet, { amount: "80", faucetHost, faucetPath });
          const { result } = await client.request({
            command: "account_info",
            account: wallet.address,
          });
          onAccountAdd({
            address: wallet.address,
            secret: wallet.seed || "",
            balance: (parseInt(result.account_data.Balance) / 1_000_000).toString(),
            mptokens: [],
            ious: [],
          });
        })
      );
    } catch (error) {
      console.error("Failed to generate accounts:", error);
      alert("Failed to generate account(s). Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const importAccount = async (seed: string): Promise<string | null> => {
    if (!client) return null;

    const wallet = (() => {
      try {
        return Wallet.fromSeed(seed);
      } catch {
        return null;
      }
    })();

    if (!wallet) return "Invalid seed. Please check and try again.";

    if (accounts.some((acc) => acc.address === wallet.address)) {
      return "This account is already imported";
    }

    setIsLoading(true);
    try {
      let balance = "0";
      try {
        const { result } = await client.request({
          command: "account_info",
          account: wallet.address,
        });
        balance = result.account_data.Balance;
      } catch {
        // Account not on ledger yet — that's fine
      }

      onAccountAdd({
        address: wallet.address,
        secret: wallet.seed || seed,
        balance: (parseInt(balance) / 1_000_000).toString(),
        mptokens: [],
        ious: [],
      });

      return null;
    } catch (error: any) {
      return error.message || "Failed to import account.";
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = async (account: Account) => {
    if (!client) return;
    try {
      const { result } = await client.request({
        command: "account_info",
        account: account.address,
      });
      onAccountUpdate({
        ...account,
        balance: (parseInt(result.account_data.Balance) / 1_000_000).toString(),
      });
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 mb-4">
        <WalletIcon className="w-5 h-5" />
        <span>Accounts</span>
      </h2>

      <div className="mb-4 space-y-2">
        <ImportAccount
          isLoading={isLoading}
          disabled={!client}
          onImport={importAccount}
        />
        <GenerateAccounts
          isLoading={isLoading}
          disabled={!client}
          onGenerate={generateAccounts}
        />
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <WalletIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No accounts yet. Generate one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.address}
              account={account}
              isSelected={selectedAccount?.address === account.address}
              onSelect={() => onAccountSelect(account)}
              onUpdate={onAccountUpdate}
              onRefreshBalance={() => refreshBalance(account)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountManager;
