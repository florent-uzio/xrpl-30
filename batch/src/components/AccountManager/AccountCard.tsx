import React, { useState } from "react";
import { motion } from "framer-motion";
import { Client } from "xrpl";
import {
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { useAccountObjects } from "../../api/queries/useAccountObjects";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
  ious: any[];
  label?: string;
}

interface CreatedToken {
  mptIssuanceId?: string;
  currency: string;
  name?: string;
  type: "MPT" | "IOU";
}

interface AccountCardProps {
  account: Account;
  client: Client | null;
  createdTokens: CreatedToken[];
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (account: Account) => void;
  onRefreshBalance: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  client,
  createdTokens,
  isSelected,
  onSelect,
  onUpdate,
  onRefreshBalance,
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState("");

  const {
    data: mpTokens = [],
    isLoading: mpLoading,
    isFetching: mpFetching,
    isError: mpError,
    refetch: refetchMPT,
  } = useAccountObjects(client, account.address);

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copySecret = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(account.secret);
  };

  const startEditLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLabelValue(account.label || "");
    setEditingLabel(true);
  };

  const saveLabel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onUpdate({ ...account, label: labelValue.trim() || undefined });
    setEditingLabel(false);
  };

  const cancelLabel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingLabel(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onSelect}
    >
      {/* Address row */}
      <div className="flex items-center space-x-2 mb-1 flex-wrap">
        {editingLabel ? (
          <div className="flex items-center space-x-1 flex-1">
            <input
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveLabel();
                else if (e.key === "Escape") cancelLabel();
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Account label"
              className="text-sm px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 flex-1"
              autoFocus
            />
            <button
              onClick={saveLabel}
              className="p-1 hover:bg-green-100 rounded text-green-600"
              title="Save"
            >
              <Save className="w-3 h-3" />
            </button>
            <button
              onClick={cancelLabel}
              className="p-1 hover:bg-red-100 rounded text-red-600"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            {account.label && (
              <span className="text-sm font-semibold text-blue-600">
                {account.label}
              </span>
            )}
            <span className="text-sm font-semibold text-gray-900 truncate">
              {account.address.slice(0, 8)}...{account.address.slice(-6)}
            </span>
            <button
              onClick={startEditLabel}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit label"
            >
              <Edit2 className="w-3 h-3 text-gray-500" />
            </button>
            <button
              onClick={copyAddress}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 text-gray-500" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Balance row */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>{account.balance} XRP</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRefreshBalance();
            refetchMPT();
          }}
          className="p-1 hover:bg-gray-100 rounded"
          title="Refresh balances"
        >
          <RefreshCw
            className={`w-3 h-3 ${mpFetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* MPT section */}
      {(mpLoading || mpTokens.length > 0 || mpError) && (
        <div className="mt-2">
          <div className="flex items-center space-x-1 mb-1">
            <span className="text-xs font-medium text-indigo-600">MPTs</span>
          </div>

          {mpLoading && (
            <div className="flex space-x-1">
              <div className="h-5 w-24 bg-indigo-100 rounded animate-pulse" />
              <div className="h-5 w-20 bg-indigo-100 rounded animate-pulse" />
            </div>
          )}

          {mpError && !mpLoading && (
            <span className="text-xs text-amber-600">
              Failed to load MPTokens
            </span>
          )}

          {!mpLoading && !mpError && mpTokens.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {mpTokens.map((token) => {
                const meta = createdTokens.find(
                  (t) =>
                    t.type === "MPT" &&
                    t.mptIssuanceId === token.MPTokenIssuanceID,
                );
                const label = meta
                  ? meta.name || meta.currency
                  : `${token.MPTokenIssuanceID.slice(0, 8)}…${token.MPTokenIssuanceID.slice(-4)}`;
                return (
                  <span
                    key={token.MPTokenIssuanceID}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 border border-indigo-200"
                    title={token.MPTokenIssuanceID}
                  >
                    <span className={meta ? undefined : "font-mono"}>
                      {label}
                    </span>
                    <span className="text-indigo-400">·</span>
                    <span>{token.MPTAmount ?? 0}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Secret row */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Secret:</span>
          <div className="flex items-center space-x-1">
            <input
              type={showSecret ? "text" : "password"}
              value={account.secret}
              readOnly
              className="text-xs font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200 flex-1 min-w-0 max-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSecret((v) => !v);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {showSecret ? (
                <EyeOff className="w-3 h-3 text-gray-500" />
              ) : (
                <Eye className="w-3 h-3 text-gray-500" />
              )}
            </button>
            <button
              onClick={copySecret}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Copy className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AccountCard;
