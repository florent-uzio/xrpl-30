import { useState, useMemo } from "react";
import {
  Client,
  Wallet,
  convertStringToHex,
  validate,
  type Currency,
  type VaultCreate,
  encodeMPTokenMetadata,
  type MPTokenMetadata,
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
  ExternalLink,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { type XRPLAccount } from "../types/account";
import { JSONViewer } from "./JSONViewer";

// Custom syntax highlighting for cyber theme
const cyberHighlightStyle = HighlightStyle.define([
  { tag: t.propertyName, color: "#a78bfa" }, // Purple for keys
  { tag: t.string, color: "#00d9ff" }, // Cyber blue for string values
  { tag: t.number, color: "#34d399" }, // Green for numbers
  { tag: t.bool, color: "#fbbf24" }, // Amber for true/false
  { tag: t.null, color: "#9ca3af" }, // Gray for null
  { tag: t.punctuation, color: "#6b7280" }, // Gray for brackets and colons
  { tag: t.brace, color: "#00d9ff" }, // Cyber blue for braces
]);

// Custom theme for CodeMirror matching the cyber aesthetic
const cyberTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "rgb(10 14 23 / 0.5)",
      color: "#e5e7eb",
    },
    ".cm-content": {
      caretColor: "#00d9ff",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#00d9ff",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "rgb(0 217 255 / 0.2)",
      },
    ".cm-activeLine": {
      backgroundColor: "rgb(0 217 255 / 0.05)",
    },
    ".cm-gutters": {
      backgroundColor: "rgb(10 14 23 / 0.8)",
      color: "#6b7280",
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgb(0 217 255 / 0.1)",
      color: "#00d9ff",
    },
    ".cm-line": {
      color: "#e5e7eb",
    },
  },
  { dark: true },
);

interface VaultCreateProps {
  client: Client;
  account: XRPLAccount | null;
  onTransactionSubmitted: (tx: any) => void;
}

export function VaultCreate({
  client,
  account,
  onTransactionSubmitted,
}: VaultCreateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form state
  const [assetType, setAssetType] = useState<"XRP" | "IOU" | "MPT">("XRP");
  const [assetIssuer, setAssetIssuer] = useState("");
  const [assetCurrency, setAssetCurrency] = useState("");
  const [mptIssuanceId, setMptIssuanceId] = useState("");
  const [assetsMaximum, setAssetsMaximum] = useState("");
  const [data, setData] = useState("");
  const [domainId, setDomainId] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isNonTransferable, setIsNonTransferable] = useState(false);
  const [assetScale, setAssetScale] = useState("");
  const [mptMetadata, setMptMetadata] = useState("");

  // Build transaction preview dynamically
  const transactionPreview = useMemo(() => {
    if (!account) return null;

    const toBeDefined = "To be defined";

    // Build Asset field based on type
    let asset: Currency = {
      currency: "XRP",
    };
    if (assetType === "XRP") {
      asset = {
        currency: "XRP",
      };
    } else if (assetType === "IOU") {
      if (assetIssuer && assetCurrency) {
        asset = {
          currency: assetCurrency,
          issuer: assetIssuer,
        };
      } else {
        asset = {
          currency: toBeDefined,
          issuer: toBeDefined,
        };
      }
    } else if (assetType === "MPT") {
      if (mptIssuanceId) {
        asset = {
          mpt_issuance_id: mptIssuanceId,
        };
      } else {
        asset = {
          mpt_issuance_id: toBeDefined,
        };
      }
    }

    // Build flags
    let flags = 0;
    if (isPrivate) flags |= 0x00010000; // tfPrivate
    if (isNonTransferable) flags |= 0x00020000; // tfNonTransferable

    // Hex encode the data field if provided
    const hexEncodedData = data ? convertStringToHex(data) : "";

    // Build transaction
    const tx: VaultCreate = {
      TransactionType: "VaultCreate",
      Account: account.address,
      Asset: asset,
      // AssetsMaximum: assetsMaximum || "0",
    };

    if (flags > 0) tx.Flags = flags;
    if (hexEncodedData) tx.Data = hexEncodedData;
    if (domainId) tx.DomainID = domainId;
    if (assetScale) tx.AssetScale = parseInt(assetScale, 10);
    if (mptMetadata) {
      try {
        const metadata = JSON.parse(mptMetadata);
        tx.MPTokenMetadata = encodeMPTokenMetadata(metadata);
      } catch {
        // Invalid JSON, will show in preview
      }
    }

    // Note: These fields would be added during autofill
    // tx.Fee = "12";
    // tx.Sequence = account.sequence;

    return tx;
  }, [
    account,
    assetType,
    assetIssuer,
    assetCurrency,
    mptIssuanceId,
    // assetsMaximum,
    data,
    domainId,
    isPrivate,
    isNonTransferable,
    assetScale,
    mptMetadata,
  ]);

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

      // if (!assetsMaximum || assetsMaximum === "0") {
      //   throw new Error("Please enter a maximum assets amount greater than 0");
      // }

      // Build Asset field based on type
      let asset: Currency;
      if (assetType === "XRP") {
        asset = {
          currency: "XRP",
        };
      } else if (assetType === "IOU") {
        if (!assetIssuer || !assetCurrency) {
          throw new Error("IOU requires issuer and currency");
        }
        asset = {
          currency: assetCurrency,
          issuer: assetIssuer,
        };
      } else {
        if (!mptIssuanceId) {
          throw new Error("MPT requires issuance ID");
        }
        asset = {
          mpt_issuance_id: mptIssuanceId,
        };
      }

      // Build flags
      let flags = 0;
      if (isPrivate) flags |= 0x00010000; // tfPrivate
      if (isNonTransferable) flags |= 0x00020000; // tfNonTransferable

      // Build transaction
      const tx: VaultCreate = {
        TransactionType: "VaultCreate",
        Account: account.address,
        Asset: asset,
        // AssetsMaximum: assetsMaximum,
      };

      if (flags > 0) tx.Flags = flags;
      if (data) tx.Data = convertStringToHex(data);
      if (domainId) tx.DomainID = domainId;
      if (assetScale) tx.AssetScale = parseInt(assetScale, 10);
      if (mptMetadata) {
        const metadata = JSON.parse(mptMetadata);
        tx.MPTokenMetadata = encodeMPTokenMetadata(metadata);
      }

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

      setSuccess(`Vault created! Hash: ${result.result.hash}`);
      onTransactionSubmitted({
        hash: result.result.hash,
        type: "VaultCreate",
        // @ts-expect-error works
        result: result.result.meta?.TransactionResult || "unknown",
        timestamp: new Date(),
        account: account.address,
      });

      // Reset form
      setAssetsMaximum("");
      setData("");
      setDomainId("");
      setAssetIssuer("");
      setAssetCurrency("");
      setMptIssuanceId("");
      setIsPrivate(false);
      setIsNonTransferable(false);
      setAssetScale("");
      setMptMetadata("");
    } catch (err: any) {
      console.error("Failed to create vault:", err);

      // Provide helpful error messages
      let errorMessage = err.message || "Failed to create vault";

      if (errorMessage.includes("Invalid signature")) {
        errorMessage =
          "Invalid signature detected. This usually means the account seed is incorrect or corrupted. Please try creating a new account.";
      } else if (errorMessage.includes("tecNO_PERMISSION")) {
        errorMessage =
          "Permission denied. The account may not have sufficient permissions for this operation.";
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
          Please create or select an account to create a vault
        </p>
      </div>
    );
  }

  return (
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
                Create Vault
              </h2>
              <p className="text-sm text-gray-500 font-display">
                XLS-65d: Single Asset Vault
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mb-6 p-4 bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-cyber-blue shrink-0 mt-0.5" />
              <div className="text-sm font-display text-gray-300">
                <p className="font-semibold mb-1">About Single Asset Vaults</p>
                <p className="text-gray-400">
                  Vaults allow depositing a single asset type and receiving
                  vault shares (MPT) in return. Maximum capacity, flags, and
                  domain restrictions are set at creation and immutable.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Asset Type */}
            <div>
              <label className="block text-sm font-display font-medium text-gray-300 mb-3">
                Asset Type *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["XRP", "IOU", "MPT"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAssetType(type)}
                    className={`p-3 rounded-lg border font-display text-sm transition-all cursor-pointer ${
                      assetType === type
                        ? "bg-cyber-blue/20 border-cyber-blue text-cyber-blue shadow-lg shadow-cyber-blue/20"
                        : "bg-cyber-darker/50 border-cyber-blue/20 text-gray-400 hover:border-cyber-blue/40 hover:bg-cyber-darker hover:scale-105"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Details */}
            {assetType === "IOU" && (
              <>
                <div>
                  <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                    Currency Code *
                  </label>
                  <input
                    type="text"
                    value={assetCurrency}
                    onChange={(e) => setAssetCurrency(e.target.value)}
                    placeholder="USD"
                    maxLength={3}
                    className="cyber-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                    Issuer Address *
                  </label>
                  <input
                    type="text"
                    value={assetIssuer}
                    onChange={(e) => setAssetIssuer(e.target.value)}
                    placeholder="rN7n7otQDd6FczFgLdlqtyMVrn3HMtthP4..."
                    className="cyber-input"
                    required
                  />
                </div>
              </>
            )}

            {assetType === "MPT" && (
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
                  required
                />
              </div>
            )}

            {/* Assets Maximum */}
            <div>
              <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                Maximum Assets (DISABLED does not work currently with xrpl.js)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={assetsMaximum}
                  onChange={(e) => setAssetsMaximum(e.target.value)}
                  placeholder={assetType === "XRP" ? "1000000000" : "1000000"}
                  className="cyber-input pr-12"
                  disabled
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Coins className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 font-display">
                {assetType === "XRP"
                  ? "Maximum amount in drops (1 XRP = 1,000,000 drops)"
                  : "Maximum amount of the asset"}
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
                  hexadecimal format
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
                PermissionedDomain object ID for vault shares (requires Private
                flag)
              </p>
            </div>

            {/* Asset Scale */}
            <div>
              <label className="block text-sm font-display font-medium text-gray-300 mb-2">
                Asset Scale
                <span className="text-gray-500 text-xs ml-2">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                max="19"
                value={assetScale}
                onChange={(e) => setAssetScale(e.target.value)}
                placeholder="0"
                className="cyber-input"
              />
              <p className="mt-1 text-xs text-gray-500 font-display">
                Decimal places for vault share tokens (0-19). Default is 0.
              </p>
            </div>

            {/* MPToken Metadata */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-display font-medium text-gray-300">
                  MPToken Metadata
                  <span className="text-gray-500 text-xs ml-2">(optional)</span>
                </label>
                <a
                  href="https://xrpl.org/docs/concepts/tokens/fungible-tokens/multi-purpose-tokens#metadata-schema"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-display text-cyber-blue hover:text-cyber-purple transition-all cursor-pointer group"
                  title="View XLS-89 Metadata Schema"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Schema Reference</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
              <div className="border border-cyber-blue/30 rounded-lg overflow-hidden bg-cyber-darker/50">
                <CodeMirror
                  value={mptMetadata}
                  height="200px"
                  extensions={[json(), syntaxHighlighting(cyberHighlightStyle)]}
                  onChange={(value) => setMptMetadata(value)}
                  theme={cyberTheme}
                  placeholder={`{\n  "t": "VAULT",\n  "n": "My Vault Shares",\n  "i": "https://example.com/icon.png",\n  "d": "Shares for my XRP vault",\n  "ac": "defi"\n}`}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightSpecialChars: true,
                    foldGutter: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    closeBracketsKeymap: true,
                    searchKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                    lintKeymap: true,
                  }}
                  style={{
                    fontSize: "12px",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  }}
                />
                <div className="mt-1 flex items-start gap-2">
                  <p className="text-xs text-gray-500 font-display flex-1">
                    XLS-89 metadata for vault share tokens. Use compact keys: t
                    (ticker), n (name), i (icon), d (desc), ac (asset_class), in
                    (issuer_name)
                  </p>
                  {mptMetadata &&
                    (() => {
                      try {
                        const parsed = JSON.parse(mptMetadata);
                        const encoded = encodeMPTokenMetadata(parsed);
                        return (
                          <p className="text-xs text-cyber-green font-display mono-text">
                            {encoded.length / 2} bytes
                          </p>
                        );
                      } catch {
                        return (
                          <p className="text-xs text-red-400 font-display">
                            Invalid JSON
                          </p>
                        );
                      }
                    })()}
                </div>
                {mptMetadata &&
                  (() => {
                    try {
                      const parsed = JSON.parse(mptMetadata);
                      const encoded = encodeMPTokenMetadata(parsed);
                      return (
                        <div className="mt-2 p-2 bg-cyber-darker/50 border border-cyber-blue/20 rounded">
                          <p className="text-[10px] text-gray-500 font-display mb-1">
                            Hex Preview:
                          </p>
                          <p className="text-xs text-cyber-blue font-display mono-text break-all">
                            {encoded}
                          </p>
                        </div>
                      );
                    } catch {
                      return (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                          <p className="text-xs text-red-400 font-display">
                            Invalid JSON format. Please check your syntax.
                          </p>
                        </div>
                      );
                    }
                  })()}
              </div>
            </div>

            {/* Flags */}
            <div className="space-y-3">
              <label className="block text-sm font-display font-medium text-gray-300">
                Vault Flags
              </label>
              <label className="flex items-start gap-3 p-3 bg-cyber-darker/50 border border-cyber-blue/20 rounded-lg cursor-pointer hover:border-cyber-blue/40 hover:bg-cyber-darker transition-all">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="mt-0.5 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-sm font-display text-gray-300">
                    Private Vault
                  </div>
                  <div className="text-xs text-gray-500 font-display mt-0.5">
                    Only specific accounts can access this vault
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 bg-cyber-darker/50 border border-cyber-blue/20 rounded-lg cursor-pointer hover:border-cyber-blue/40 hover:bg-cyber-darker transition-all">
                <input
                  type="checkbox"
                  checked={isNonTransferable}
                  onChange={(e) => setIsNonTransferable(e.target.checked)}
                  className="mt-0.5 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-sm font-display text-gray-300">
                    Non-Transferable Shares
                  </div>
                  <div className="text-xs text-gray-500 font-display mt-0.5">
                    Vault shares cannot be transferred to other accounts
                  </div>
                </div>
              </label>
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
                  <span>Creating Vault...</span>
                </>
              ) : (
                <>
                  <Vault className="w-4 h-4" />
                  <span>Create Vault</span>
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
            Learn more about VaultCreate transactions:
          </p>
          <a
            href="https://opensource.ripple.com/docs/xls-65d-single-asset-vault/reference/transactions/vaultcreate"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-display text-cyber-blue hover:text-cyber-purple transition-all cursor-pointer hover:translate-x-1"
          >
            XLS-65d Specification →
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
  );
}
