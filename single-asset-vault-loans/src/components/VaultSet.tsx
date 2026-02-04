import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Client,
  Wallet,
  convertHexToString,
  convertStringToHex,
  validate,
  type VaultSet,
} from "xrpl";
import { useVaultInfo } from "../api";
import { motion } from "framer-motion";
import {
  Vault,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  Code2,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";
import { type XRPLAccount } from "../types/account";
import { JSONViewer } from "./JSONViewer";

interface VaultSetProps {
  client: Client;
  account: XRPLAccount | null;
  onTransactionSubmitted: (tx: any) => void;
}

export function VaultSet({
  client,
  account,
  onTransactionSubmitted,
}: VaultSetProps) {
  const { vaultId } = useParams<{ vaultId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form state
  const [assetsMaximum, setAssetsMaximum] = useState("");
  const [data, setData] = useState("");
  const [domainId, setDomainId] = useState("");

  // Use React Query hook for vault info
  const {
    data: vaultInfoData,
    isLoading: isLoadingVault,
    error: vaultError,
  } = useVaultInfo(client, vaultId, {
    onSuccess: (data) => {
      const vault = data.vault;
      // Pre-populate form with current values
      // @ts-expect-error working, the SDK is not complete yet
      if (vault.Data) {
        try {
          // @ts-expect-error working, the SDK is not complete yet
          const hexString = vault.Data;
          const decoded = convertHexToString(hexString);
          setData(decoded);
        } catch {
          // If decode fails, leave empty
        }
      }
      if (vault.shares?.DomainID) {
        setDomainId(vault.shares.DomainID);
      }
    },
  });

  const vaultData = vaultInfoData?.vault;

  // Build transaction preview dynamically
  const transactionPreview = useMemo(() => {
    if (!account || !vaultId) return null;

    const toBeDefined = "To be defined";

    // Hex encode the data field if provided
    const hexEncodedData = data ? convertStringToHex(data) : "";

    // Build transaction
    const tx: VaultSet = {
      TransactionType: "VaultSet",
      Account: account.address,
      VaultID: vaultId,
    };

    if (assetsMaximum) tx.AssetsMaximum = assetsMaximum;
    if (hexEncodedData) tx.Data = hexEncodedData;
    if (domainId) tx.DomainID = domainId;

    return tx;
  }, [account, vaultId, assetsMaximum, data, domainId]);

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
    if (!account || !client.isConnected() || !vaultId) {
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

      // Build transaction
      const tx: VaultSet = {
        TransactionType: "VaultSet",
        Account: account.address,
        VaultID: vaultId,
      };

      if (assetsMaximum) tx.AssetsMaximum = assetsMaximum;
      if (data) tx.Data = convertStringToHex(data);
      if (domainId) tx.DomainID = domainId;

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

      setSuccess(`Vault updated! Hash: ${result.result.hash}`);
      onTransactionSubmitted({
        hash: result.result.hash,
        type: "VaultSet",
        // @ts-expect-error works
        result: result.result.meta?.TransactionResult || "unknown",
        timestamp: new Date(),
        account: account.address,
      });

      // Navigate back to vault detail after short delay
      setTimeout(() => {
        navigate(`/vaults/${vaultId}`);
      }, 2000);
    } catch (err: any) {
      console.error("Failed to update vault:", err);

      // Provide helpful error messages
      let errorMessage = err.message || "Failed to update vault";

      if (errorMessage.includes("Invalid signature")) {
        errorMessage =
          "Invalid signature detected. This usually means the account seed is incorrect or corrupted. Please try creating a new account.";
      } else if (errorMessage.includes("tecNO_PERMISSION")) {
        errorMessage =
          "Permission denied. You must be the vault owner to update it.";
      } else if (errorMessage.includes("terINSUF_FEE")) {
        errorMessage =
          "Insufficient XRP to pay transaction fee. Please fund your account.";
      } else if (errorMessage.includes("tefPAST_SEQ")) {
        errorMessage =
          "Transaction sequence mismatch. Please refresh the page and try again.";
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
          Please create or select an account to update the vault
        </p>
      </div>
    );
  }

  if (isLoadingVault) {
    return (
      <div className="cyber-card p-12 text-center">
        <div className="w-12 h-12 border-4 border-cyber-blue/30 border-t-cyber-blue rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400 font-display">
          Loading vault data...
        </p>
      </div>
    );
  }

  if (vaultError) {
    return (
      <div className="cyber-card p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-display font-medium text-gray-300 mb-2">
          Error Loading Vault
        </h3>
        <p className="text-sm text-gray-500 font-display mb-6">
          {vaultError instanceof Error
            ? vaultError.message
            : "Failed to load vault"}
        </p>
        <button
          onClick={() => navigate("/vaults")}
          className="cyber-button text-sm px-4 py-2 cursor-pointer"
        >
          Back to Vaults
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/vaults/${vaultId}`)}
          className="p-2 hover:bg-cyber-blue/10 rounded-lg transition-all cursor-pointer hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-200">
            Edit Vault
          </h2>
          <p className="text-sm text-gray-500 font-display mt-1">
            Modify mutable vault fields
          </p>
        </div>
      </div>

      <div className="flex gap-6 relative z-0">
        {/* Left Column - Form (75%) */}
        <div className="flex-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-card p-8 relative z-0"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyber-blue/20 rounded-lg">
                <Vault className="w-6 h-6 text-cyber-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-200">
                  Update Vault Settings
                </h2>
                <p className="text-sm text-gray-500 font-display">
                  XLS-65d: VaultSet Transaction
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="mb-6 p-4 bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-cyber-blue shrink-0 mt-0.5" />
                <div className="text-sm font-display text-gray-300">
                  <p className="font-semibold mb-1">Modifiable Fields</p>
                  <p className="text-gray-400">
                    Only Data, AssetsMaximum, and DomainID can be modified after
                    vault creation. All other fields are immutable.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vault ID (Read-only) */}
              <div>
                <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                  Vault ID
                </label>
                <input
                  type="text"
                  value={vaultId || ""}
                  disabled
                  className="cyber-input bg-cyber-darker/30 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 font-display">
                  The vault identifier (read-only)
                </p>
              </div>

              {/* Assets Maximum */}
              <div>
                <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                  Maximum Assets
                  <span className="text-gray-500 text-xs ml-2">(optional)</span>
                </label>
                <input
                  type="text"
                  value={assetsMaximum}
                  onChange={(e) => setAssetsMaximum(e.target.value)}
                  placeholder={vaultData?.AssetsMaximum || "1000000"}
                  className="cyber-input"
                />
                <p className="mt-1 text-xs text-gray-500 font-display">
                  Cannot be lower than current AssetsTotal unless set to 0
                  {vaultData?.AssetsMaximum && (
                    <span className="text-cyber-blue ml-1">
                      (Current: {vaultData.AssetsMaximum})
                    </span>
                  )}
                </p>
              </div>

              {/* Data Field */}
              <div>
                <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                  Data
                  <span className="text-gray-500 text-xs ml-2">(optional)</span>
                </label>
                <textarea
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  placeholder="Enter text (will be hex-encoded automatically)"
                  rows={3}
                  className="cyber-input resize-none"
                />
                <div className="mt-1 flex items-start gap-2">
                  <p className="text-xs text-gray-500 font-display flex-1">
                    Enter plain text - it will be automatically converted to
                    hexadecimal format (max 256 bytes)
                  </p>
                  {data && (
                    <p className="text-xs text-cyber-green font-display mono-text">
                      {convertStringToHex(data).length / 2} bytes
                    </p>
                  )}
                </div>
                {data && (
                  <div className="mt-2 p-2 bg-cyber-darker/50 border border-cyber-blue/20 rounded">
                    <p className="text-[10px] text-gray-500 font-display mb-1">
                      Hex Preview:
                    </p>
                    <p className="text-xs text-cyber-blue font-display mono-text break-all">
                      {convertStringToHex(data)}
                    </p>
                  </div>
                )}
              </div>

              {/* DomainID */}
              <div>
                <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                  Domain ID
                  <span className="text-gray-500 text-xs ml-2">(optional)</span>
                </label>
                <input
                  type="text"
                  value={domainId}
                  onChange={(e) => setDomainId(e.target.value)}
                  placeholder="PermissionedDomain object ID"
                  className="cyber-input"
                />
                <p className="mt-1 text-xs text-gray-500 font-display">
                  PermissionedDomain object ID for vault shares
                  {vaultData?.DomainID && (
                    <span className="text-cyber-blue ml-1">
                      (Current: {vaultData.DomainID.slice(0, 8)}...)
                    </span>
                  )}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !client.isConnected()}
                className="w-full cyber-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Vault...</span>
                  </>
                ) : (
                  <>
                    <Vault className="w-4 h-4" />
                    <span>Update Vault</span>
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
              Learn more about VaultSet transactions:
            </p>
            <a
              href="https://opensource.ripple.com/docs/xls-65d-single-asset-vault/reference/transactions/vaultset"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-display text-cyber-blue hover:text-cyber-purple transition-all cursor-pointer hover:translate-x-1"
            >
              XLS-65d VaultSet Specification →
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
