import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Client, isMPTAmount } from "xrpl";
import type Vault from "xrpl/dist/npm/models/ledger/Vault";
import { motion } from "framer-motion";
import {
  Vault as VaultIcon,
  Coins,
  TrendingUp,
  Lock,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { type XRPLAccount } from "../types/account";
import { isIssuedCurrencyAmount } from "xrpl/dist/npm/models/transactions/common";
import { useAccountVaults } from "../api";

interface VaultListProps {
  client: Client;
  account: XRPLAccount | null;
}

export function VaultList({ client, account }: VaultListProps) {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Use React Query hook for vaults
  const {
    data: vaults = [],
    isLoading,
    error,
    refetch,
  } = useAccountVaults(client, account?.address);

  const formatAsset = (asset: Vault["Asset"]): string => {
    if (isMPTAmount(asset)) {
      return `${asset.mpt_issuance_id.slice(0, 8)}...`;
    } else if (isIssuedCurrencyAmount(asset)) {
      return `${asset.currency}${asset.issuer ? ` (${asset.issuer.slice(0, 8)}...)` : ""}`;
    }

    // IOU or MPT format
    return "XRP";
  };

  const handleCopyVaultId = async (
    vaultId: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation(); // Prevent navigation when clicking copy button
    try {
      await navigator.clipboard.writeText(vaultId);
      setCopiedId(vaultId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy vault ID:", err);
    }
  };

  if (!account) {
    return (
      <div className="cyber-card p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-display font-medium text-gray-300 mb-2">
          No Account Selected
        </h3>
        <p className="text-sm text-gray-500 font-display">
          Please select an account to view vaults
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="cyber-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-cyber-blue/30 border-t-cyber-blue rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400 font-display">Loading vaults...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cyber-card p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-display font-medium text-gray-300 mb-2">
          Error Loading Vaults
        </h3>
        <p className="text-sm text-gray-500 font-display mb-4">
          {error instanceof Error ? error.message : "Failed to load vaults"}
        </p>
        <button
          onClick={() => refetch()}
          className="cyber-button text-sm px-4 py-2 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (vaults.length === 0) {
    return (
      <div className="cyber-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyber-blue/10 flex items-center justify-center">
          <VaultIcon className="w-8 h-8 text-cyber-blue/50" />
        </div>
        <h3 className="text-lg font-display font-medium text-gray-300 mb-2">
          No Vaults Found
        </h3>
        <p className="text-sm text-gray-500 font-display max-w-sm mx-auto mb-6">
          You haven't created any vaults yet. Create your first vault to start
          managing assets.
        </p>
        <button
          onClick={() => refetch()}
          className="text-sm font-display text-cyber-blue hover:text-cyber-purple transition-all cursor-pointer hover:scale-110"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-200">
            My Vaults
          </h2>
          <p className="text-sm text-gray-500 font-display mt-1">
            {vaults.length} {vaults.length === 1 ? "vault" : "vaults"} found
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="cyber-button text-sm px-4 py-2 cursor-pointer"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vaults.map((vault, index) => {
          const isPrivate = !!(vault.Flags & 0x00010000);

          return (
            <motion.div
              key={vault.index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/vaults/${vault.index}`)}
              className="cyber-card p-6 hover:scale-[1.02] transition-all cursor-pointer hover:shadow-xl hover:shadow-cyber-blue/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-cyber-blue/20 rounded-lg">
                  <VaultIcon className="w-5 h-5 text-cyber-blue" />
                </div>
                <div className="flex gap-2">
                  {isPrivate && (
                    <div
                      className="p-1.5 bg-cyber-purple/20 rounded"
                      title="Private Vault"
                    >
                      <Lock className="w-3 h-3 text-cyber-purple" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 font-display mb-1">
                    Asset
                  </div>
                  <div className="text-sm font-display font-semibold text-gray-200 mono-text">
                    {formatAsset(vault.Asset)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 font-display mb-1 flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      Available
                    </div>
                    <div className="text-sm font-display font-bold text-cyber-green mono-text">
                      {vault.AssetsAvailable || "0"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-display mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Total
                    </div>
                    <div className="text-sm font-display font-bold text-cyber-blue mono-text">
                      {vault.AssetsTotal || "0"}
                    </div>
                  </div>
                </div>

                {vault.AssetsMaximum && vault.AssetsMaximum !== "0" && (
                  <div className="pt-3 border-t border-cyber-blue/20">
                    <div className="text-xs text-gray-500 font-display mb-1">
                      Max Capacity
                    </div>
                    <div className="text-xs font-display text-gray-400 mono-text">
                      {vault.AssetsMaximum}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <div className="text-xs text-gray-500 font-display mb-2">
                    Vault ID
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-cyber-darker/50 border border-cyber-blue/20 rounded group">
                    <div className="text-xs font-display text-gray-400 mono-text break-all flex-1">
                      {vault.index}
                    </div>
                    <button
                      onClick={(e) => handleCopyVaultId(vault.LedgerIndex, e)}
                      className="p-1 hover:bg-cyber-blue/10 rounded transition-colors flex-0"
                      title="Copy Vault ID"
                    >
                      {copiedId === vault.LedgerIndex ? (
                        <Check className="w-3 h-3 text-cyber-green" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-500 group-hover:text-cyber-blue transition-colors" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
