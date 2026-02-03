import { motion } from "framer-motion";
import { Copy, Trash2, Check, Wallet, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Client } from "xrpl";
import { type XRPLAccount } from "../types/account";
import { shortenAddress } from "../utils/xrpl";
import { useAccountInfo } from "../hooks/useAccountInfo";

interface AccountCardProps {
  account: XRPLAccount;
  client: Client;
  onDelete: (address: string) => void;
  onBalanceUpdate?: (address: string, balance: string, sequence: number) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const AccountCard = ({
  account,
  client,
  onDelete,
  onBalanceUpdate,
  isSelected,
  onSelect,
}: AccountCardProps) => {
  const [copied, setCopied] = useState(false);

  const { data: accountInfo, isLoading, isFetching, refetch } = useAccountInfo(
    client,
    account.address
  );

  // Use the latest data from the query, or fall back to the stored account data
  const displayBalance = accountInfo?.balance ?? account.balance;
  const displaySequence = accountInfo?.sequence ?? account.sequence;

  // Update parent component when fresh data arrives
  useEffect(() => {
    if (accountInfo && onBalanceUpdate) {
      onBalanceUpdate(account.address, accountInfo.balance, accountInfo.sequence);
    }
  }, [accountInfo, onBalanceUpdate, account.address]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`cyber-card p-6 transition-all ${
        isSelected
          ? "ring-2 ring-cyber-blue shadow-lg shadow-cyber-blue/20"
          : ""
      }`}
      style={{ cursor: 'pointer' }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <div className="scan-line" />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-cyber-blue/20 to-cyber-purple/20 rounded-lg">
            <Wallet className="w-6 h-6 text-cyber-blue" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-display text-gray-400 uppercase tracking-wider">
                Account
              </span>
              {isSelected && (
                <span className="px-2 py-0.5 bg-cyber-blue/20 text-cyber-blue text-xs rounded-full font-display">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm font-display text-gray-200">
                {shortenAddress(account.address, 6)}
              </code>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(account.address);
                }}
                className="relative z-10 p-1.5 hover:bg-cyber-blue/10 rounded transition-colors cursor-pointer border border-transparent hover:border-cyber-blue/30"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-cyber-green" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400 hover:text-cyber-blue" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              refetch();
            }}
            disabled={isFetching}
            className="relative z-10 p-2 hover:bg-cyber-blue/10 rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-cyber-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh account data"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-400 group-hover:text-cyber-blue ${
                isFetching ? "animate-spin" : ""
              }`}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(account.address);
            }}
            className="relative z-10 p-2 hover:bg-red-500/10 rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-red-500/30"
            title="Delete account"
          >
            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-display">
            Balance
          </span>
          <div className="text-right">
            <div className={`text-2xl font-display font-bold glow-text ${isLoading ? 'animate-pulse' : ''}`}>
              {parseFloat(displayBalance).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 font-display">XRP</div>
          </div>
        </div>

        {displaySequence !== undefined && (
          <div className="flex items-center justify-between pt-3 border-t border-cyber-blue/10">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-display">
              Sequence
            </span>
            <span className={`text-sm font-display text-gray-300 ${isLoading ? 'animate-pulse' : ''}`}>
              #{displaySequence}
            </span>
          </div>
        )}

        {accountInfo?.ownerCount !== undefined && (
          <div className="flex items-center justify-between pt-3 border-t border-cyber-blue/10">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-display">
              Objects Owned
            </span>
            <span className="text-sm font-display text-gray-300">
              {accountInfo.ownerCount}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-cyber-blue/10">
        <div className="text-xs text-gray-500 font-display">
          Created {new Date(account.createdAt).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
};
