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
  Download,
  X,
  Edit2,
  Save,
} from "lucide-react";

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
}) => {
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importSeed, setImportSeed] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState<string>("");

  const generateAccount = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      const wallet = Wallet.generate();
      await client.fundWallet(wallet, { amount: "10" });

      const accountInfo = await client.request({
        command: "account_info",
        account: wallet.address,
      });
      const balance = accountInfo.result.account_data.Balance;

      const newAccount: Account = {
        address: wallet.address,
        secret: wallet.seed || "",
        balance: (parseInt(balance) / 1000000).toString(),
        mptokens: [],
        ious: [],
      };

      onAccountAdd(newAccount);
    } catch (error) {
      console.error("Failed to generate account:", error);
      alert("Failed to generate account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const importAccount = async () => {
    if (!client) return;

    setImportError(null);

    if (!importSeed.trim()) {
      setImportError("Please enter a seed");
      return;
    }

    setIsLoading(true);
    try {
      // Validate seed and create wallet
      const wallet = Wallet.fromSeed(importSeed.trim());

      // Check if account already exists
      const accountExists = accounts.some(
        (acc) => acc.address === wallet.address
      );

      if (accountExists) {
        setImportError("This account is already imported");
        setIsLoading(false);
        return;
      }

      // Get account info (account might not exist on ledger yet)
      let balance = "0";
      try {
        const accountInfo = await client.request({
          command: "account_info",
          account: wallet.address,
        });
        balance = accountInfo.result.account_data.Balance;
      } catch (error: any) {
        // Account doesn't exist on ledger yet, that's okay
        console.log("Account not found on ledger:", error.message);
      }

      const newAccount: Account = {
        address: wallet.address,
        secret: wallet.seed || importSeed.trim(),
        balance: (parseInt(balance) / 1000000).toString(),
        mptokens: [],
        ious: [],
      };

      onAccountAdd(newAccount);

      // Reset form
      setImportSeed("");
      setShowImportForm(false);
      setImportError(null);
    } catch (error: any) {
      console.error("Failed to import account:", error);
      setImportError(
        error.message || "Invalid seed. Please check and try again."
      );
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

  const copyToClipboard = (text: string, type: "address" | "secret") => {
    navigator.clipboard.writeText(text);
    if (type === "address") {
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  const toggleSecretVisibility = (address: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [address]: !prev[address],
    }));
  };

  const startEditingLabel = (account: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLabel(account.address);
    setLabelValue(account.label || "");
  };

  const saveLabel = (account: Account, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedAccount = {
      ...account,
      label: labelValue.trim() || undefined,
    };
    onAccountUpdate(updatedAccount);
    setEditingLabel(null);
    setLabelValue("");
  };

  const cancelEditingLabel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingLabel(null);
    setLabelValue("");
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 mb-4">
          <WalletIcon className="w-5 h-5" />
          <span>Accounts</span>
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportForm(!showImportForm)}
            disabled={isLoading || !client}
            className="flex items-center space-x-2 px-2 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            onClick={generateAccount}
            disabled={isLoading || !client}
            className="flex items-center space-x-2 px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Import Form */}
      <AnimatePresence>
        {showImportForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Import Wallet from Seed
              </h3>
              <button
                onClick={() => {
                  setShowImportForm(false);
                  setImportSeed("");
                  setImportError(null);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Seed (Secret)
                </label>
                <input
                  type="password"
                  value={importSeed}
                  onChange={(e) => {
                    setImportSeed(e.target.value);
                    setImportError(null);
                  }}
                  placeholder="s..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      importAccount();
                    }
                  }}
                />
                {importError && (
                  <p className="text-red-500 text-xs mt-1">{importError}</p>
                )}
              </div>
              <button
                onClick={importAccount}
                disabled={isLoading || !client || !importSeed.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isLoading ? "Importing..." : "Import Account"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <WalletIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No accounts yet. Generate one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <motion.div
              key={account.address}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedAccount?.address === account.address
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => onAccountSelect(account)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {editingLabel === account.address ? (
                      <div className="flex items-center space-x-1 flex-1">
                        <input
                          type="text"
                          value={labelValue}
                          onChange={(e) => setLabelValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveLabel(account);
                            } else if (e.key === "Escape") {
                              cancelEditingLabel();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Account label"
                          className="text-sm px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1"
                          autoFocus
                        />
                        <button
                          onClick={(e) => saveLabel(account, e)}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="Save label"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => cancelEditingLabel(e)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {account.label ? (
                          <span className="text-sm font-semibold text-blue-600">
                            {account.label}
                          </span>
                        ) : null}
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {account.address.slice(0, 8)}...
                          {account.address.slice(-6)}
                        </span>
                        <button
                          onClick={(e) => startEditingLabel(account, e)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit label"
                        >
                          <Edit2 className="w-3 h-3 text-gray-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(account.address, "address");
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {copiedAddress === account.address ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-500" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{account.balance} XRP</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshBalance(account);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Secret:</span>
                  <div className="flex items-center space-x-1">
                    <input
                      type={showSecrets[account.address] ? "text" : "password"}
                      value={account.secret}
                      readOnly
                      className="text-xs font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200 flex-1 min-w-0 max-w-[120px]"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSecretVisibility(account.address);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {showSecrets[account.address] ? (
                        <EyeOff className="w-3 h-3 text-gray-500" />
                      ) : (
                        <Eye className="w-3 h-3 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(account.secret, "secret");
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountManager;
