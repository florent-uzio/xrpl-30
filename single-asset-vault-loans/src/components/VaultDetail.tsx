import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Client, isMPTAmount } from "xrpl";
import { motion } from "framer-motion";
import { useVaultInfo } from "../api";
import {
  ArrowLeft,
  Vault as VaultIcon,
  Coins,
  TrendingUp,
  Lock,
  AlertCircle,
  Info,
  Shield,
  Hash,
  User,
  BarChart3,
  Database,
  Copy,
  Check,
  Edit,
} from "lucide-react";
import { type XRPLAccount } from "../types/account";
import { isIssuedCurrencyAmount } from "xrpl/dist/npm/models/transactions/common";

interface VaultDetailProps {
  client: Client;
  account: XRPLAccount | null;
}

export function VaultDetail({ client }: VaultDetailProps) {
  const { vaultId } = useParams<{ vaultId: string }>();
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Use React Query hook for vault info
  const {
    data: vaultData,
    isLoading,
    error,
  } = useVaultInfo(client, vaultId);

  const formatAsset = (asset: any): string => {
    if (isMPTAmount(asset)) {
      return `${asset.mpt_issuance_id.slice(0, 8)}...`;
    } else if (isIssuedCurrencyAmount(asset)) {
      return `${asset.currency}${asset.issuer ? ` (${asset.issuer.slice(0, 8)}...)` : ""}`;
    }
    return "XRP";
  };

  const formatWithdrawalPolicy = (policy: number | undefined): string => {
    if (!policy) return "Not Set";

    const policies: Record<number, string> = {
      1: "First Come First Serve",
      // Future policies can be added here
      // 2: "Pro Rata",
      // 3: "Priority Based",
    };

    return policies[policy] || `Unknown (${policy})`;
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="cyber-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-cyber-blue/30 border-t-cyber-blue rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400 font-display">
          Loading vault details...
        </p>
      </div>
    );
  }

  if (error || !vaultData) {
    return (
      <div className="cyber-card p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-display font-medium text-gray-300 mb-2">
          Error Loading Vault
        </h3>
        <p className="text-sm text-gray-500 font-display mb-6">
          {error instanceof Error ? error.message : "Vault not found"}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/vaults")}
            className="cyber-button text-sm px-4 py-2 cursor-pointer"
          >
            Back to Vaults
          </button>
          <button
            onClick={() => window.location.reload()}
            className="cyber-button-secondary text-sm px-4 py-2 cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const { vault } = vaultData;
  const isPrivate = !!(vault.Flags && vault.Flags & 0x00010000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/vaults")}
          className="p-2 hover:bg-cyber-blue/10 rounded-lg transition-all cursor-pointer hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold text-gray-200">
            Vault Details
          </h2>
          <p className="text-sm text-gray-500 font-display mt-1">
            Comprehensive view of vault state and configuration
          </p>
        </div>
        <button
          onClick={() => navigate(`/vaults/${vaultId}/edit`)}
          className="cyber-button flex items-center gap-2 px-4 py-2 cursor-pointer"
        >
          <Edit className="w-4 h-4" />
          <span>Edit Vault</span>
        </button>
      </div>

      {/* Vault ID Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="cyber-card p-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <Hash className="w-5 h-5 text-cyber-blue" />
          <h3 className="text-sm font-display font-semibold text-gray-400 uppercase tracking-wider">
            Vault ID
          </h3>
        </div>
        <div className="flex items-center gap-3 p-4 bg-cyber-darker/50 border border-cyber-blue/30 rounded-lg group hover:border-cyber-blue/50 transition-colors">
          <div className="text-lg font-display text-gray-200 mono-text break-all flex-1">
            {vault.index}
          </div>
          <button
            onClick={() => handleCopy(vault.index, "vaultId")}
            className="p-2 hover:bg-cyber-blue/10 rounded-lg transition-all flex-shrink-0 hover:scale-110"
            title="Copy Vault ID"
          >
            {copiedField === "vaultId" ? (
              <Check className="w-5 h-5 text-cyber-green" />
            ) : (
              <Copy className="w-5 h-5 text-gray-500 group-hover:text-cyber-blue transition-colors" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Main Vault Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="cyber-card p-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-xl">
              <VaultIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-gray-200">
                {formatAsset(vault.Asset)} Vault
              </h3>
              <p className="text-sm text-gray-500 font-display">
                Sequence #{vault.Sequence}
              </p>
            </div>
          </div>
          {isPrivate && (
            <div className="flex items-center gap-2 px-3 py-2 bg-cyber-purple/20 border border-cyber-purple/50 rounded-lg">
              <Lock className="w-4 h-4 text-cyber-purple" />
              <span className="text-sm font-display text-cyber-purple font-semibold">
                Private
              </span>
            </div>
          )}
        </div>

        {/* Assets Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-cyber-darker/50 border border-cyber-blue/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-cyber-green" />
              <span className="text-xs text-gray-500 font-display">
                Available Assets
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-cyber-green mono-text">
              {vault.AssetsAvailable || "0"}
            </div>
          </div>

          <div className="p-4 bg-cyber-darker/50 border border-cyber-blue/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-cyber-blue" />
              <span className="text-xs text-gray-500 font-display">
                Total Assets
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-cyber-blue mono-text">
              {vault.AssetsTotal || "0"}
            </div>
          </div>

          <div className="p-4 bg-cyber-darker/50 border border-cyber-blue/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-cyber-purple" />
              <span className="text-xs text-gray-500 font-display">
                Outstanding Shares
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-cyber-purple mono-text">
              {vault.shares?.OutstandingAmount || "0"}
            </div>
          </div>
        </div>

        {/* Unrealized Loss */}
        {vault.LossUnrealized && vault.LossUnrealized !== "0" && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400 font-display">
                Unrealized Loss
              </span>
            </div>
            <div className="text-xl font-display font-bold text-red-400 mono-text">
              {vault.LossUnrealized}
            </div>
          </div>
        )}

        {/* Detailed Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-display font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4" />
            Vault Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CopyableInfoField
              icon={<Hash className="w-4 h-4" />}
              label="Vault Account"
              value={vault.Account}
              fieldName="vaultAccount"
              copiedField={copiedField}
              onCopy={handleCopy}
              mono
            />
            <CopyableInfoField
              icon={<User className="w-4 h-4" />}
              label="Owner"
              value={vault.Owner}
              fieldName="owner"
              copiedField={copiedField}
              onCopy={handleCopy}
              mono
            />
            <CopyableInfoField
              icon={<Shield className="w-4 h-4" />}
              label="Share Token ID"
              value={vault.ShareMPTID || "N/A"}
              fieldName="shareMPTID"
              copiedField={copiedField}
              onCopy={handleCopy}
              mono
            />
            <InfoField
              icon={<BarChart3 className="w-4 h-4" />}
              label="Withdrawal Policy"
              value={formatWithdrawalPolicy(vault.WithdrawalPolicy)}
            />
          </div>
        </div>

        {/* Share Details */}
        {vault.shares && (
          <div className="mt-6 pt-6 border-t border-cyber-blue/20 space-y-4">
            <h4 className="text-sm font-display font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Share Issuance Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CopyableInfoField
                icon={<Hash className="w-4 h-4" />}
                label="Issuer"
                value={vault.shares.Issuer}
                fieldName="shareIssuer"
                copiedField={copiedField}
                onCopy={handleCopy}
                mono
              />
              <InfoField
                icon={<Database className="w-4 h-4" />}
                label="Ledger Entry Type"
                value={vault.shares.LedgerEntryType}
              />
              <CopyableInfoField
                icon={<Hash className="w-4 h-4" />}
                label="Share Index"
                value={vault.shares.index}
                fieldName="shareIndex"
                copiedField={copiedField}
                onCopy={handleCopy}
                mono
              />
              <InfoField
                icon={<BarChart3 className="w-4 h-4" />}
                label="Sequence"
                value={vault.shares.Sequence.toString()}
              />
            </div>
          </div>
        )}

        {/* Ledger Information */}
        <div className="mt-6 pt-6 border-t border-cyber-blue/20 space-y-4">
          <h4 className="text-sm font-display font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4" />
            Ledger Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CopyableInfoField
              icon={<Hash className="w-4 h-4" />}
              label="Previous Transaction"
              value={vault.PreviousTxnID}
              fieldName="prevTxnID"
              copiedField={copiedField}
              onCopy={handleCopy}
              mono
            />
            <InfoField
              icon={<BarChart3 className="w-4 h-4" />}
              label="Ledger Sequence"
              value={vault.PreviousTxnLgrSeq.toString()}
            />
            {vaultData.ledger_index && (
              <InfoField
                icon={<BarChart3 className="w-4 h-4" />}
                label="Current Ledger"
                value={vaultData.ledger_index.toString()}
              />
            )}
            {vaultData.validated !== undefined && (
              <InfoField
                icon={<Shield className="w-4 h-4" />}
                label="Validated"
                value={vaultData.validated ? "Yes" : "No"}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}

function InfoField({ icon, label, value, mono }: InfoFieldProps) {
  return (
    <div className="p-3 bg-cyber-darker/30 border border-cyber-blue/10 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-gray-500">{icon}</div>
        <span className="text-xs text-gray-500 font-display">{label}</span>
      </div>
      <div
        className={`text-sm font-display text-gray-300 break-all ${mono ? "mono-text" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

interface CopyableInfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  fieldName: string;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
  mono?: boolean;
}

function CopyableInfoField({
  icon,
  label,
  value,
  fieldName,
  copiedField,
  onCopy,
  mono,
}: CopyableInfoFieldProps) {
  return (
    <div className="p-3 bg-cyber-darker/30 border border-cyber-blue/10 rounded-lg hover:border-cyber-blue/30 transition-colors group">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-gray-500">{icon}</div>
        <span className="text-xs text-gray-500 font-display">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`text-sm font-display text-gray-300 break-all flex-1 ${mono ? "mono-text" : ""}`}
        >
          {value}
        </div>
        <button
          onClick={() => onCopy(value, fieldName)}
          className="p-1 hover:bg-cyber-blue/10 rounded transition-all flex-shrink-0 hover:scale-110"
          title={`Copy ${label}`}
        >
          {copiedField === fieldName ? (
            <Check className="w-3.5 h-3.5 text-cyber-green" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyber-blue transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
}
