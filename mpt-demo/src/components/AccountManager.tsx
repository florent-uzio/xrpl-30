import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Client, Wallet } from "xrpl";
import {
  Wallet as WalletIcon,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
}

interface CreatedMPT {
  mptIssuanceId: string;
  issuer: string;
  name: string;
  ticker: string;
  createdAt: Date;
}

interface AccountManagerProps {
  client: Client | null;
  accounts: Account[];
  selectedAccount: Account | null;
  createdMPTs: CreatedMPT[];
  onAccountSelect: (account: Account) => void;
  onAccountAdd: (account: Account) => void;
  onAccountUpdate: (account: Account) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AccountManager: React.FC<AccountManagerProps> = ({
  client,
  accounts,
  selectedAccount,
  createdMPTs,
  onAccountSelect,
  onAccountAdd,
  onAccountUpdate,
  isLoading,
  setIsLoading,
}) => {
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const generateAccount = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      // Generate a new wallet
      const wallet = Wallet.generate();

      // Fund the wallet using the testnet faucet
      await client.fundWallet(wallet);

      // Get account info
      const accountInfo = await client.request({
        command: "account_info",
        account: wallet.address,
      });
      const balance = accountInfo.result.account_data.Balance;

      const newAccount: Account = {
        address: wallet.address,
        secret: wallet.seed || "",
        balance: (parseInt(balance) / 1000000).toString(), // Convert drops to XRP
        mptokens: [],
      };

      onAccountAdd(newAccount);

      // Show success notification
      setTimeout(() => {
        // You could add a toast notification here
      }, 100);
    } catch (error) {
      console.error("Failed to generate account:", error);
      // You could add an error notification here
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = async (account: Account) => {
    if (!client) return;

    try {
      const accountInfo = await client.request({
        command: "account_info",
        account: account.address,
      });
      const balance = accountInfo.result.account_data.Balance;

      const updatedAccount = {
        ...account,
        balance: (parseInt(balance) / 1000000).toString(),
      };

      onAccountUpdate(updatedAccount);
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  };

  const copyToClipboard = async (text: string, type: "address" | "secret") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "address") {
        setCopiedAddress(text);
        setTimeout(() => setCopiedAddress(null), 2000);
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const toggleSecretVisibility = (address: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [address]: !prev[address],
    }));
  };

  const removeAccount = (address: string) => {
    // In a real app, you might want to confirm this action
    if (selectedAccount?.address === address) {
      const remainingAccounts = accounts.filter(
        (acc) => acc.address !== address
      );
      onAccountSelect(remainingAccounts[0] || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <WalletIcon className="w-6 h-6 text-blue-600" />
            <span>Accounts</span>
          </h2>
          <button
            onClick={generateAccount}
            disabled={!client || isLoading}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 px-4 py-2 rounded-full cursor-pointer"
          >
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Generate</span>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Generate devnet accounts with XRP from the faucet to manage MPTs.
        </p>

        {createdMPTs.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <p className="text-green-800 text-sm">
              <strong>Global MPTs:</strong> {createdMPTs.length} MPT(s) created
              in this session
            </p>
          </div>
        )}
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        <AnimatePresence>
          {accounts.map((account, index) => (
            <motion.div
              key={account.address}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`card cursor-pointer transition-all duration-200 ${
                selectedAccount?.address === account.address
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:shadow-lg"
              }`}
              onClick={() => onAccountSelect(account)}
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {account.address.slice(-2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {account.address}
                      </p>
                      <p className="text-sm text-gray-500">
                        {account.balance} XRP
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshBalance(account);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Refresh balance"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(account.address, "address");
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Copy address"
                  >
                    {copiedAddress === account.address ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAccount(account.address);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Secret Key (Collapsible) */}
              <div className="mt-3 pt-3 border-t border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Secret Key:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSecretVisibility(account.address);
                    }}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showSecrets[account.address] ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>

                {showSecrets[account.address] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-xs bg-gray-100 p-2 rounded font-mono break-all text-gray-700">
                        {account.secret}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(account.secret, "secret");
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copy secret"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {accounts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-8"
          >
            <WalletIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No accounts generated yet</p>
            <p className="text-sm text-gray-400">
              Click "Generate" to create your first testnet account
            </p>
          </motion.div>
        )}
      </div>

      {/* Selected Account Info */}
      {selectedAccount && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Selected Account</h3>
          <div className="space-y-2 text-sm p-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <code className="text-blue-600 font-mono">
                {selectedAccount.address.slice(0, 8)}...
                {selectedAccount.address.slice(-8)}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Balance:</span>
              <span className="font-semibold text-green-600">
                {selectedAccount.balance} XRP
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MP Tokens:</span>
              <span className="font-semibold text-purple-600">
                {selectedAccount.mptokens.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created MPTs:</span>
              <span className="font-semibold text-green-600">
                {
                  createdMPTs.filter(
                    (mpt) => mpt.issuer === selectedAccount.address
                  ).length
                }
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AccountManager;
