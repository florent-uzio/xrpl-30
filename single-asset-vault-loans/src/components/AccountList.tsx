import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Edit2,
  Trash2,
  Check,
  X,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { type XRPLAccount } from "../types/account";
import { shortenAddress } from "../utils/xrpl";

interface AccountListProps {
  accounts: XRPLAccount[];
  selectedAccount: XRPLAccount | null;
  onSelect: (account: XRPLAccount) => void;
  onUpdateLabel: (address: string, label: string) => void;
  onDelete: (address: string) => void;
}

export const AccountList = ({
  accounts,
  selectedAccount,
  onSelect,
  onUpdateLabel,
  onDelete,
}: AccountListProps) => {
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleStartEdit = (account: XRPLAccount) => {
    setEditingAddress(account.address);
    setEditLabel(account.label || "");
  };

  const handleSaveLabel = (address: string) => {
    onUpdateLabel(address, editLabel.trim());
    setEditingAddress(null);
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setEditLabel("");
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 font-display text-sm">
        No accounts yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {accounts.map((account, index) => (
          <motion.div
            key={account.address}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05 }}
            className={`cyber-card p-3 transition-all ${
              selectedAccount?.address === account.address
                ? "border-cyber-blue/50 bg-cyber-blue/5"
                : "hover:border-cyber-blue/30"
            }`}
          >
            {editingAddress === account.address ? (
              // Edit Mode
              <div className="space-y-2">
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Account label"
                  className="w-full cyber-input text-xs py-1.5 px-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveLabel(account.address);
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveLabel(account.address)}
                    className="flex-1 px-2 py-1.5 bg-cyber-green/20 hover:bg-cyber-green/30 text-cyber-green rounded text-xs font-display flex items-center justify-center gap-1 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-2 py-1.5 bg-cyber-darker hover:bg-gray-800 text-gray-400 rounded text-xs font-display flex items-center justify-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex items-start justify-between mb-2">
                  <button
                    onClick={() => onSelect(account)}
                    className="flex-1 flex items-start gap-2 text-left group"
                  >
                    <div
                      className={`p-1.5 rounded transition-all ${
                        selectedAccount?.address === account.address
                          ? "bg-cyber-blue/20"
                          : "bg-cyber-darker group-hover:bg-cyber-blue/10"
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5 text-cyber-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-display text-gray-300 truncate">
                        {account.label || shortenAddress(account.address, 8)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-display mono-text">
                        {account.label && shortenAddress(account.address, 6)}
                      </div>
                    </div>
                  </button>

                  {selectedAccount?.address === account.address && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-display">
                  <span className="text-gray-500">
                    {parseFloat(account.balance).toFixed(2)} XRP
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyAddress(account.address)}
                      className="p-1 hover:bg-cyber-blue/10 rounded transition-colors group"
                      title="Copy address"
                    >
                      {copiedAddress === account.address ? (
                        <CheckCircle2 className="w-3 h-3 text-cyber-green" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-500 group-hover:text-cyber-blue" />
                      )}
                    </button>
                    <button
                      onClick={() => handleStartEdit(account)}
                      className="p-1 hover:bg-cyber-blue/10 rounded transition-colors group"
                      title="Edit label"
                    >
                      <Edit2 className="w-3 h-3 text-gray-500 group-hover:text-cyber-blue" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delete account ${account.label || shortenAddress(account.address)}?`,
                          )
                        ) {
                          onDelete(account.address);
                        }
                      }}
                      className="p-1 hover:bg-red-500/10 rounded transition-colors group"
                      title="Delete account"
                    >
                      <Trash2 className="w-3 h-3 text-gray-500 group-hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
