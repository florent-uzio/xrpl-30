import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Client,
  Wallet,
  validate,
  type VaultDeposit,
  type Amount,
  isMPTAmount,
} from "xrpl";
import { motion } from "framer-motion";
import {
  Vault,
  Coins,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  Code2,
  Copy,
  Check,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { type XRPLAccount } from "../types/account";
import { JSONViewer } from "./JSONViewer";
import { useAccountVaults, useVaultInfo } from "../api";
import { isIssuedCurrencyAmount } from "xrpl/dist/npm/models/transactions/common";

interface VaultDepositProps {
  client: Client;
  account: XRPLAccount | null;
  onTransactionSubmitted: (tx: any) => void;
}

export function VaultDeposit({
  client,
  account,
  onTransactionSubmitted,
}: VaultDepositProps) {
  const { vaultId: urlVaultId } = useParams<{ vaultId?: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form state
  const [vaultId, setVaultId] = useState(urlVaultId || "");
  const [amountType, setAmountType] = useState<"XRP" | "IOU" | "MPT">("XRP");
  const [amountValue, setAmountValue] = useState("");
  const [currency, setCurrency] = useState("");
  const [issuer, setIssuer] = useState("");
  const [mptIssuanceId, setMptIssuanceId] = useState("");

  // Fetch vault info if vaultId is provided in URL
  const { data: vaultInfo } = useVaultInfo(
    client,
    urlVaultId,
    {
      enabled: !!urlVaultId,
    }
  );

  // Fetch user's vaults for the dropdown (only if no specific vault)
  const { data: userVaults = [] } = useAccountVaults(client, account?.address, {
    enabled: !urlVaultId,
  });

  // Pre-populate form based on vault info
  useEffect(() => {
    if (vaultInfo?.vault) {
      const vault = vaultInfo.vault;
      // Auto-detect asset type
      if (typeof vault.Asset === "string") {
        setAmountType("XRP");
      } else if (isMPTAmount(vault.Asset)) {
        setAmountType("MPT");
        setMptIssuanceId(vault.Asset.mpt_issuance_id);
      } else if (isIssuedCurrencyAmount(vault.Asset)) {
        setAmountType("IOU");
        setCurrency(vault.Asset.currency);
        setIssuer(vault.Asset.issuer);
      }
    }
  }, [vaultInfo]);

  // Build transaction preview dynamically
  const transactionPreview = useMemo(() => {
    if (!account || !vaultId) return null;

    const toBeDefined = "To be defined";

    // Build Amount field based on type
    let amount: Amount | string;
    if (amountType === "XRP") {
      // XRP in drops
      amount = amountValue || toBeDefined;
    } else if (amountType === "IOU") {
      if (amountValue && currency && issuer) {
        amount = {
          value: amountValue,
          currency: currency,
          issuer: issuer,
        };
      } else {
        amount = {
          value: toBeDefined,
          currency: toBeDefined,
          issuer: toBeDefined,
        };
      }
    } else {
      // MPT
      if (mptIssuanceId && amountValue) {
        amount = {
          mpt_issuance_id: mptIssuanceId,
          value: amountValue,
        };
      } else {
        amount = {
          mpt_issuance_id: toBeDefined,
          value: toBeDefined,
        };
      }
    }

    // Build transaction
    const tx: VaultDeposit = {
      TransactionType: "VaultDeposit",
      Account: account.address,
      VaultID: vaultId,
      Amount: amount as Amount,
    };

    return tx;
  }, [account, vaultId, amountType, amountValue, currency, issuer, mptIssuanceId]);

  const handleCopyJSON = async () => {
    if (!transactionPreview) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(transactionPreview, null, 2),
      );
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !client.isConnected()) {
      setError("Please connect an account first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate account
      if (!account.seed) {
        throw new Error("Account seed not found. Please recreate the account.");
      }

      if (!vaultId) {
        throw new Error("Please select or enter a Vault ID");
      }

      if (!amountValue) {
        throw new Error("Please enter an amount to deposit");
      }

      // Build Amount field based on type
      let amount: Amount;
      if (amountType === "XRP") {
        amount = amountValue; // XRP in drops (string)
      } else if (amountType === "IOU") {
        if (!currency || !issuer) {
          throw new Error("IOU requires currency code and issuer address");
        }
        amount = {
          value: amountValue,
          currency: currency,
          issuer: issuer,
        };
      } else {
        // MPT
        if (!mptIssuanceId) {
          throw new Error("MPT requires issuance ID");
        }
        amount = {
          mpt_issuance_id: mptIssuanceId,
          value: amountValue,
        };
      }

      // Build transaction
      const tx: VaultDeposit = {
        TransactionType: "VaultDeposit",
        Account: account.address,
        VaultID: vaultId,
        Amount: amount,
      };

      // Create wallet from seed
      const wallet = Wallet.fromSeed(account.seed);

      // Verify wallet address matches account
      if (wallet.address !== account.address) {
        throw new Error(
          "Wallet address mismatch. Account may be corrupted. Please recreate it.",
        );
      }

      console.log("Transaction to submit:", tx);

      // Validate the tx
      validate(tx);

      // Submit and wait for validation
      console.log("Submitting...");
      const result = await client.submitAndWait(tx, { autofill: true, wallet });
      console.log("Transaction result:", result);

      setSuccess(`Deposit successful! Hash: ${result.result.hash}`);
      onTransactionSubmitted({
        hash: result.result.hash,
        type: "VaultDeposit",
        // @ts-expect-error works
        result: result.result.meta?.TransactionResult || "unknown",
        timestamp: new Date(),
        account: account.address,
      });

      // Reset form
      setAmountValue("");
      setCurrency("");
      setIssuer("");
      setMptIssuanceId("");
    } catch (err: any) {
      console.error("Failed to deposit:", err);

      // Provide helpful error messages
      let errorMessage = err.message || "Failed to deposit to vault";

      if (errorMessage.includes("Invalid signature")) {
        errorMessage =
          "Invalid signature detected. This usually means the account seed is incorrect or corrupted.";
      } else if (errorMessage.includes("tecNO_PERMISSION")) {
        errorMessage =
          "Permission denied. You may not have access to this vault.";
      } else if (errorMessage.includes("terINSUF_FEE")) {
        errorMessage =
          "Insufficient XRP to pay transaction fee. Please fund your account.";
      } else if (errorMessage.includes("tecINSUFFICIENT_FUNDS")) {
        errorMessage = "Insufficient funds to complete the deposit.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
          Please create or select an account to deposit to a vault
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      {urlVaultId && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/vaults/${urlVaultId}`)}
            className="p-2 hover:bg-cyber-blue/10 rounded-lg transition-all cursor-pointer hover:scale-110"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-200">
              Deposit to Vault
            </h2>
            <p className="text-sm text-gray-500 font-display mt-1">
              Add assets to receive vault shares
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-6 relative z-0">
        {/* Left Column - Form (75%) */}
        <div className="flex-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-card p-8 relative z-0"
          >
            {!urlVaultId && (
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-cyber-green/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-cyber-green" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-200">
                    Deposit to Vault
                  </h2>
                  <p className="text-sm text-gray-500 font-display">
                    XLS-65d: VaultDeposit Transaction
                  </p>
                </div>
              </div>
            )}

          {/* Info Banner */}
          <div className="mb-6 p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-cyber-green shrink-0 mt-0.5" />
              <div className="text-sm font-display text-gray-300">
                <p className="font-semibold mb-1">Deposit Assets</p>
                <p className="text-gray-400">
                  Deposit assets into a vault in exchange for vault share tokens
                  (MPT). The amount of shares you receive depends on the current
                  exchange rate.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vault Selection */}
            <div>
              <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                {urlVaultId ? "Vault ID" : "Select Vault *"}
              </label>
              {urlVaultId ? (
                <input
                  type="text"
                  value={vaultId}
                  disabled
                  className="cyber-input bg-cyber-darker/30 cursor-not-allowed"
                />
              ) : userVaults.length > 0 ? (
                <select
                  value={vaultId}
                  onChange={(e) => setVaultId(e.target.value)}
                  className="cyber-input"
                  required
                >
                  <option value="">Choose a vault...</option>
                  {userVaults.map((vault) => (
                    <option key={vault.index} value={vault.index}>
                      {vault.index.slice(0, 16)}... - {" "}
                      {typeof vault.Asset === "string"
                        ? vault.Asset
                        : vault.Asset.currency}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={vaultId}
                  onChange={(e) => setVaultId(e.target.value)}
                  placeholder="Enter Vault ID"
                  className="cyber-input"
                  required
                />
              )}
              <p className="mt-1 text-xs text-gray-500 font-display">
                {urlVaultId
                  ? "Depositing to this vault"
                  : userVaults.length > 0
                    ? "Select from your vaults or enter a Vault ID manually"
                    : "No vaults found. Enter a Vault ID to deposit"}
              </p>
            </div>

            {/* Amount Type */}
            <div>
              <label className="block text-sm font-display font-medium text-gray-300 mb-3">
                Asset Type *
                {vaultInfo && (
                  <span className="text-xs text-cyber-green ml-2">
                    (Auto-detected from vault)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["XRP", "IOU", "MPT"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAmountType(type)}
                    disabled={!!vaultInfo}
                    className={`p-3 rounded-lg border font-display text-sm transition-all ${
                      vaultInfo ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    } ${
                      amountType === type
                        ? "bg-cyber-green/20 border-cyber-green text-cyber-green shadow-lg shadow-cyber-green/20"
                        : "bg-cyber-darker/50 border-cyber-blue/20 text-gray-400 hover:border-cyber-blue/40 hover:bg-cyber-darker hover:scale-105"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Value */}
            <div>
              <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                Amount *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amountValue}
                  onChange={(e) => setAmountValue(e.target.value)}
                  placeholder={
                    amountType === "XRP" ? "1000000 (drops)" : "100.50"
                  }
                  className="cyber-input pr-12"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Coins className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 font-display">
                {amountType === "XRP"
                  ? "Amount in drops (1 XRP = 1,000,000 drops)"
                  : "Amount to deposit"}
              </p>
            </div>

            {/* IOU Fields */}
            {amountType === "IOU" && (
              <>
                <div>
                  <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                    Currency Code *
                  </label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="USD"
                    maxLength={3}
                    className="cyber-input"
                    disabled={!!vaultInfo}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                    Issuer Address *
                  </label>
                  <input
                    type="text"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder="rN7n7otQDd6FczFgLdlqtyMVrn3HMtthP4..."
                    className="cyber-input"
                    disabled={!!vaultInfo}
                    required
                  />
                </div>
              </>
            )}

            {/* MPT Fields */}
            {amountType === "MPT" && (
              <div>
                <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                  MPT Issuance ID *
                </label>
                <input
                  type="text"
                  value={mptIssuanceId}
                  onChange={(e) => setMptIssuanceId(e.target.value)}
                  placeholder="0000000092BC82CE629520B3B2D1BC5D..."
                  className="cyber-input"
                  disabled={!!vaultInfo}
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !client.isConnected()}
              className="w-full cyber-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Depositing...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Deposit to Vault</span>
                </>
              )}
            </button>
          </form>

          {/* Status Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-display font-semibold text-red-400">
                    Error
                  </p>
                  <p className="text-sm font-display text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg"
            >
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyber-green shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-display font-semibold text-cyber-green">
                    Success!
                  </p>
                  <p className="text-sm font-display text-gray-300 mt-1 break-all">
                    {success}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Reference Documentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 cyber-card p-6"
        >
          <h3 className="text-sm font-display font-semibold text-gray-300 mb-3">
            Transaction Reference
          </h3>
          <p className="text-xs text-gray-500 font-display mb-3">
            Learn more about VaultDeposit transactions:
          </p>
          <a
            href="https://opensource.ripple.com/docs/xls-65d-single-asset-vault/reference/transactions/vaultdeposit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-display text-cyber-blue hover:text-cyber-purple transition-all cursor-pointer hover:translate-x-1"
          >
            XLS-65d VaultDeposit Specification →
          </a>
        </motion.div>
      </div>

      {/* Right Column - JSON Preview (25%) */}
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="cyber-card p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyber-purple" />
              <h3 className="text-sm font-display font-semibold text-gray-300">
                Transaction Preview
              </h3>
            </div>
            {transactionPreview && (
              <button
                onClick={handleCopyJSON}
                className="p-1.5 hover:bg-cyber-blue/10 rounded transition-colors cursor-pointer group"
                title="Copy JSON"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-cyber-green" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-cyber-blue transition-colors" />
                )}
              </button>
            )}
          </div>

          {transactionPreview ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <JSONViewer data={transactionPreview} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-xs text-gray-500 font-display">
                  Select an account to preview
                </p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-cyber-blue/20">
            <p className="text-[10px] text-gray-500 font-display leading-relaxed">
              <span className="text-yellow-500">Note:</span> Fee and Sequence
              will be added automatically when submitting
            </p>
          </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
