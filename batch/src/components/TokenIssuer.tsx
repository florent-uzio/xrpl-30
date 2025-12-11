import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AccountSetAsfFlags,
  Client,
  convertStringToHex,
  TrustSetFlags,
  Wallet,
  type AccountSet,
  type TrustSet,
} from "xrpl";
import {
  Layers,
  Coins,
  Plus,
  Info,
  CheckCircle,
  XCircle,
  Loader,
  ExternalLink,
} from "lucide-react";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
  ious: any[];
  label?: string;
}

interface CreatedToken {
  id: string;
  type: "MPT" | "IOU";
  issuer: string;
  currency: string;
  name?: string;
  createdAt: Date;
  mptIssuanceId?: string;
}

interface TransactionRecord {
  hash: string;
  result: string;
  type: string;
  account: string;
  timestamp: Date;
}

interface TokenIssuerProps {
  client: Client | null;
  account: Account | null;
  accounts: Account[];
  onTransactionCreated: (json: string) => void;
  onAccountUpdate: (account: Account) => void;
  onTokenCreated?: (token: CreatedToken) => void;
  onTransactionSubmitted?: (record: TransactionRecord) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface MPTFlags {
  tfMPTCanLock: boolean;
  tfMPTRequireAuth: boolean;
  tfMPTCanEscrow: boolean;
  tfMPTCanTrade: boolean;
  tfMPTCanTransfer: boolean;
  tfMPTCanClawback: boolean;
}

type TransactionStatus = "pending" | "success" | "error";

interface TransactionStatusItem {
  type: string;
  status: TransactionStatus;
  hash?: string;
  error?: string;
}

const TokenIssuer: React.FC<TokenIssuerProps> = ({
  client,
  account,
  accounts,
  onTransactionCreated,
  onAccountUpdate,
  onTokenCreated,
  onTransactionSubmitted,
  isLoading,
  setIsLoading,
}) => {
  const [tokenType, setTokenType] = useState<"mpt" | "iou">("mpt");
  const [mptFormData, setMptFormData] = useState({
    assetScale: 2,
    transferFee: 0,
    maximumAmount: "1000000",
    metadata: JSON.stringify(
      {
        t: "TBILL",
        n: "T-Bill Yield Token",
        d: "A yield-bearing stablecoin backed by short-term U.S. Treasuries and money market instruments.",
        i: "example.org/tbill-icon.png",
        ac: "rwa",
        as: "treasury",
        in: "Example Yield Co.",
        us: [
          {
            u: "exampleyield.co/tbill",
            c: "website",
            t: "Product Page",
          },
          {
            u: "exampleyield.co/docs",
            c: "docs",
            t: "Yield Token Docs",
          },
        ],
        ai: {
          interest_rate: "5.00%",
          interest_type: "variable",
          yield_source: "U.S. Treasury Bills",
          maturity_date: "2045-06-30",
          cusip: "912796RX0",
        },
      },
      null,
      2
    ),
  });
  const [iouFormData, setIouFormData] = useState({
    currency: "RLUSD",
    value: "1000",
    issuerAccount: "",
    holderAccount: "",
  });
  const [mptFlags, setMptFlags] = useState<MPTFlags>({
    tfMPTCanLock: false,
    tfMPTRequireAuth: false,
    tfMPTCanEscrow: false,
    tfMPTCanTrade: true,
    tfMPTCanTransfer: true,
    tfMPTCanClawback: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [transactionStatuses, setTransactionStatuses] = useState<
    TransactionStatusItem[]
  >([]);

  // Clear transaction statuses when component unmounts or tab changes
  React.useEffect(() => {
    return () => {
      setTransactionStatuses([]);
    };
  }, []);

  const encodeCurrency = (currency: string): string => {
    if (currency.length <= 3) {
      return currency.padEnd(3, "\0");
    }
    return convertStringToHex(currency).padEnd(40, "0");
  };

  const flagDescriptions = {
    tfMPTCanLock: { name: "Can Lock", decimal: 2 },
    tfMPTRequireAuth: { name: "Require Auth", decimal: 4 },
    tfMPTCanEscrow: { name: "Can Escrow", decimal: 8 },
    tfMPTCanTrade: { name: "Can Trade", decimal: 16 },
    tfMPTCanTransfer: { name: "Can Transfer", decimal: 32 },
    tfMPTCanClawback: { name: "Can Clawback", decimal: 64 },
  };

  const calculateFlags = (): number => {
    let flagValue = 0;
    Object.entries(mptFlags).forEach(([key, value]) => {
      if (value) {
        const flagInfo = flagDescriptions[key as keyof MPTFlags];
        flagValue += flagInfo.decimal;
      }
    });
    return flagValue;
  };

  const validateMPTForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!account) {
      newErrors.account = "Please select an account first";
    }
    if (mptFormData.assetScale < 0 || mptFormData.assetScale > 15) {
      newErrors.assetScale = "Asset scale must be between 0 and 15";
    }
    if (
      mptFlags.tfMPTCanTransfer &&
      (mptFormData.transferFee < 0 || mptFormData.transferFee > 50000)
    ) {
      newErrors.transferFee =
        "Transfer fee must be between 0 and 50,000 (0% to 50%)";
    }
    if (parseInt(mptFormData.maximumAmount) <= 0) {
      newErrors.maximumAmount = "Maximum amount must be greater than 0";
    }
    try {
      JSON.parse(mptFormData.metadata);
    } catch (e) {
      newErrors.metadata = "Metadata must be valid JSON";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateIOUForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!iouFormData.issuerAccount) {
      newErrors.issuerAccount = "Please select an issuer account";
    }
    if (!iouFormData.holderAccount) {
      newErrors.holderAccount = "Please select a holder account";
    }
    if (
      iouFormData.issuerAccount &&
      iouFormData.holderAccount &&
      iouFormData.issuerAccount === iouFormData.holderAccount
    ) {
      newErrors.accounts = "Issuer and holder must be different accounts";
    }
    if (!iouFormData.currency || iouFormData.currency.length < 3) {
      newErrors.currency = "Currency code must be at least 3 characters";
    }
    if (parseFloat(iouFormData.value) <= 0) {
      newErrors.value = "Value must be greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateTransactionStatus = (
    type: string,
    status: TransactionStatus,
    hash?: string,
    error?: string
  ) => {
    setTransactionStatuses((prev) => {
      const existing = prev.findIndex((t) => t.type === type);
      const newItem: TransactionStatusItem = { type, status, hash, error };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newItem;
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const createMPToken = async () => {
    if (!client || !account || !validateMPTForm()) return;

    setIsLoading(true);
    setTransactionStatuses([]);
    updateTransactionStatus("MPTokenIssuanceCreate", "pending");

    try {
      const flagValue = calculateFlags();

      const transaction = {
        TransactionType: "MPTokenIssuanceCreate",
        Account: account.address,
        AssetScale: mptFormData.assetScale,
        TransferFee: mptFlags.tfMPTCanTransfer
          ? mptFormData.transferFee
          : undefined,
        MaximumAmount: mptFormData.maximumAmount,
        Flags: flagValue,
        MPTokenMetadata: convertStringToHex(mptFormData.metadata).toUpperCase(),
        Fee: "10",
      };

      Object.keys(transaction).forEach((key) => {
        if (transaction[key as keyof typeof transaction] === undefined) {
          delete transaction[key as keyof typeof transaction];
        }
      });

      const jsonString = JSON.stringify(transaction, null, 2);
      onTransactionCreated(jsonString);

      const autofilled = await client.autofill(transaction as any);
      const wallet = Wallet.fromSeed(account.secret);
      const signed = wallet.sign(autofilled);

      const result = await client.submitAndWait(signed.tx_blob);
      console.log("MPToken created successfully:", result);

      const txResult =
        typeof result.result.meta === "object" && result.result.meta
          ? (result.result.meta as any).TransactionResult
          : "tesSUCCESS";

      updateTransactionStatus(
        "MPTokenIssuanceCreate",
        "success",
        result.result.hash
      );

      // Record transaction
      if (onTransactionSubmitted) {
        onTransactionSubmitted({
          hash: result.result.hash || "",
          result: txResult,
          type: "MPTokenIssuanceCreate",
          account: account.address,
          timestamp: new Date(),
        });
      }

      // Extract MPT issuance ID and create token record
      let mptIssuanceId: string | undefined;
      if (
        result.result.meta &&
        typeof result.result.meta === "object" &&
        "mpt_issuance_id" in result.result.meta
      ) {
        mptIssuanceId = (result.result.meta as any).mpt_issuance_id;
      }

      const metadata = JSON.parse(mptFormData.metadata);
      if (onTokenCreated) {
        onTokenCreated({
          id: Date.now().toString(),
          type: "MPT",
          issuer: account.address,
          currency: metadata.t || "MPT",
          name: metadata.name,
          createdAt: new Date(),
          mptIssuanceId,
        });
      }

      // Refresh account balance
      const accountInfo = await client.request({
        command: "account_info",
        account: account.address,
      });
      const balance = accountInfo.result.account_data.Balance;
      onAccountUpdate({
        ...account,
        balance: (parseInt(balance) / 1000000).toString(),
      });

      alert("MPToken created successfully!");
    } catch (error: any) {
      console.error("Failed to create MPToken:", error);
      updateTransactionStatus(
        "MPTokenIssuanceCreate",
        "error",
        undefined,
        error.message || "Unknown error"
      );
      alert(`Failed to create MPToken: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createIOU = async () => {
    if (!client || !validateIOUForm()) return;

    const issuer = accounts.find(
      (a) => a.address === iouFormData.issuerAccount
    );
    const holder = accounts.find(
      (a) => a.address === iouFormData.holderAccount
    );

    if (!issuer || !holder) {
      alert("Issuer or holder account not found");
      return;
    }

    setIsLoading(true);
    setTransactionStatuses([]);

    try {
      const encodedCurrency = encodeCurrency(iouFormData.currency);

      // Step 1: Check if default ripple is already enabled, if not, enable it
      const issuerAccountInfo = await client.request({
        command: "account_info",
        account: issuer.address,
      });
      const flags = issuerAccountInfo.result.account_data.Flags || 0;
      const defaultRippleEnabled = (flags & 0x00800000) !== 0; // asfDefaultRipple flag

      if (!defaultRippleEnabled) {
        updateTransactionStatus("AccountSet", "pending");
        const accountSetTx: AccountSet = {
          TransactionType: "AccountSet",
          Account: issuer.address,
          SetFlag: AccountSetAsfFlags.asfDefaultRipple,
        };

        const issuerWallet = Wallet.fromSeed(issuer.secret);
        const accountSetResult = await client.submitAndWait(accountSetTx, {
          autofill: true,
          wallet: issuerWallet,
        });
        console.log("AccountSet successful:", accountSetResult);

        const txResult =
          typeof accountSetResult.result.meta === "object" &&
          accountSetResult.result.meta
            ? (accountSetResult.result.meta as any).TransactionResult
            : "tesSUCCESS";

        updateTransactionStatus(
          "AccountSet",
          "success",
          accountSetResult.result.hash
        );

        if (onTransactionSubmitted) {
          onTransactionSubmitted({
            hash: accountSetResult.result.hash || "",
            result: txResult,
            type: "AccountSet",
            account: issuer.address,
            timestamp: new Date(),
          });
        }
      } else {
        // Skip AccountSet if already enabled
        updateTransactionStatus("AccountSet", "success");
      }

      // Step 2: TrustSet for holder
      updateTransactionStatus("TrustSet", "pending");
      const trustSetTx: TrustSet = {
        TransactionType: "TrustSet",
        Account: holder.address,
        LimitAmount: {
          currency: encodedCurrency,
          issuer: issuer.address,
          value: iouFormData.value,
        },
        Flags: TrustSetFlags.tfSetNoRipple,
        // Fee: "12",
      };

      // const trustSetAutofilled = await client.autofill(trustSetTx as any);
      const holderWallet = Wallet.fromSeed(holder.secret);
      // const trustSetSigned = holderWallet.sign(trustSetAutofilled);
      const trustSetResult = await client.submitAndWait(trustSetTx, {
        autofill: true,
        wallet: holderWallet,
      });
      console.log("TrustSet successful:", trustSetResult);

      const txResult =
        typeof trustSetResult.result.meta === "object" &&
        trustSetResult.result.meta
          ? (trustSetResult.result.meta as any).TransactionResult
          : "tesSUCCESS";

      updateTransactionStatus(
        "TrustSet",
        "success",
        trustSetResult.result.hash
      );

      if (onTransactionSubmitted) {
        onTransactionSubmitted({
          hash: trustSetResult.result.hash || "",
          result: txResult,
          type: "TrustSet",
          account: holder.address,
          timestamp: new Date(),
        });
      }

      // Step 3: Payment from issuer to holder
      updateTransactionStatus("Payment", "pending");
      const paymentTx = {
        TransactionType: "Payment",
        Account: issuer.address,
        Destination: holder.address,
        Amount: {
          currency: encodedCurrency,
          issuer: issuer.address,
          value: iouFormData.value,
        },
        Fee: "10",
      };

      const issuerWallet = Wallet.fromSeed(issuer.secret);
      const paymentAutofilled = await client.autofill(paymentTx as any);
      const paymentSigned = issuerWallet.sign(paymentAutofilled);
      const paymentResult = await client.submitAndWait(paymentSigned.tx_blob);
      console.log("Payment successful:", paymentResult);

      const paymentTxResult =
        typeof paymentResult.result.meta === "object" &&
        paymentResult.result.meta
          ? (paymentResult.result.meta as any).TransactionResult
          : "tesSUCCESS";

      updateTransactionStatus("Payment", "success", paymentResult.result.hash);

      if (onTransactionSubmitted) {
        onTransactionSubmitted({
          hash: paymentResult.result.hash || "",
          result: paymentTxResult,
          type: "Payment",
          account: issuer.address,
          timestamp: new Date(),
        });
      }

      // Create IOU token record
      if (onTokenCreated) {
        onTokenCreated({
          id: Date.now().toString(),
          type: "IOU",
          issuer: issuer.address,
          currency: iouFormData.currency,
          createdAt: new Date(),
        });
      }

      // Refresh account balances
      const issuerInfo = await client.request({
        command: "account_info",
        account: issuer.address,
      });
      const issuerBalance = issuerInfo.result.account_data.Balance;
      onAccountUpdate({
        ...issuer,
        balance: (parseInt(issuerBalance) / 1000000).toString(),
      });

      const holderInfo = await client.request({
        command: "account_info",
        account: holder.address,
      });
      const holderBalance = holderInfo.result.account_data.Balance;
      onAccountUpdate({
        ...holder,
        balance: (parseInt(holderBalance) / 1000000).toString(),
      });

      alert("IOU created and issued successfully!");
    } catch (error: any) {
      console.error("Failed to create IOU:", error);
      // Find the failed transaction
      const pendingTx = transactionStatuses.find((t) => t.status === "pending");
      if (pendingTx) {
        updateTransactionStatus(
          pendingTx.type,
          "error",
          undefined,
          error.message || "Unknown error"
        );
      }
      alert(`Failed to create IOU: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case "pending":
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Issue Tokens</h2>
        <p className="text-gray-600">
          Create MPT tokens or IOUs for batch transaction demonstrations
        </p>
      </div>

      {/* Token Type Selector */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setTokenType("mpt")}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            tokenType === "mpt"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Layers className="w-5 h-5" />
            <span className="font-semibold">MPT Token</span>
          </div>
        </button>
        <button
          onClick={() => setTokenType("iou")}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            tokenType === "iou"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Coins className="w-5 h-5" />
            <span className="font-semibold">IOU</span>
          </div>
        </button>
      </div>

      {/* MPT Form */}
      {tokenType === "mpt" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {!account && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">
                  Please select an account from the sidebar first
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Scale
              </label>
              <input
                type="number"
                min="0"
                max="15"
                value={mptFormData.assetScale}
                onChange={(e) =>
                  setMptFormData({
                    ...mptFormData,
                    assetScale: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.assetScale && (
                <p className="text-red-500 text-xs mt-1">{errors.assetScale}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Amount
              </label>
              <input
                type="text"
                value={mptFormData.maximumAmount}
                onChange={(e) =>
                  setMptFormData({
                    ...mptFormData,
                    maximumAmount: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.maximumAmount && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.maximumAmount}
                </p>
              )}
            </div>
          </div>

          {mptFlags.tfMPTCanTransfer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Fee (0-50000, representing 0%-50%)
              </label>
              <input
                type="number"
                min="0"
                max="50000"
                value={mptFormData.transferFee}
                onChange={(e) =>
                  setMptFormData({
                    ...mptFormData,
                    transferFee: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.transferFee && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.transferFee}
                </p>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Metadata (JSON) - XLS-0089 Format
              </label>
              <a
                href="https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0089-multi-purpose-token-metadata-schema#32-json-metadata-example"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                title="View XLS-0089 Specification"
              >
                <ExternalLink className="w-4 h-4" />
                <span>XLS-0089 Spec</span>
              </a>
            </div>
            <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 mb-1">
                <strong>Required fields:</strong> ticker, name, icon,
                asset_class, issuer_name
              </p>
              <p className="text-xs text-blue-700">
                <strong>Optional:</strong> desc, asset_subclass (required if
                asset_class is "rwa"), uris, additional_info
              </p>
            </div>
            <textarea
              value={mptFormData.metadata}
              onChange={(e) =>
                setMptFormData({ ...mptFormData, metadata: e.target.value })
              }
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder='{\n  "ticker": "RLUSD",\n  "name": "Regulated USD",\n  "desc": "A regulated stablecoin",\n  "icon": "https://example.com/icon.png",\n  "asset_class": "currency",\n  "issuer_name": "Example Issuer"\n}'
            />
            {errors.metadata && (
              <p className="text-red-500 text-xs mt-1">{errors.metadata}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              MPT Flags
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(flagDescriptions).map(([key, info]) => (
                <label
                  key={key}
                  className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={mptFlags[key as keyof MPTFlags]}
                    onChange={(e) =>
                      setMptFlags({
                        ...mptFlags,
                        [key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{info.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Transaction Status */}
          {transactionStatuses.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Transaction Status
              </h3>
              <div className="space-y-2">
                {transactionStatuses.map((status) => (
                  <div
                    key={status.type}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status.status)}
                      <span className="text-sm font-medium text-gray-900">
                        {status.type}
                      </span>
                    </div>
                    {status.hash && (
                      <span className="text-xs text-gray-500 font-mono">
                        {status.hash.slice(0, 8)}...
                      </span>
                    )}
                    {status.error && (
                      <span className="text-xs text-red-600">
                        {status.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={createMPToken}
            disabled={isLoading || !account}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create MPT Token</span>
          </button>
        </motion.div>
      )}

      {/* IOU Form */}
      {tokenType === "iou" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {accounts.length < 2 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">
                  You need at least 2 accounts. Generate them from the sidebar.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issuer Account (will issue the IOU)
            </label>
            <select
              value={iouFormData.issuerAccount}
              onChange={(e) =>
                setIouFormData({
                  ...iouFormData,
                  issuerAccount: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Issuer Account</option>
              {accounts.map((acc) => (
                <option key={acc.address} value={acc.address}>
                  {acc.label ? `${acc.label} - ` : ""}
                  {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                </option>
              ))}
            </select>
            {errors.issuerAccount && (
              <p className="text-red-500 text-xs mt-1">
                {errors.issuerAccount}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Holder Account (will receive the IOU)
            </label>
            <select
              value={iouFormData.holderAccount}
              onChange={(e) =>
                setIouFormData({
                  ...iouFormData,
                  holderAccount: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Holder Account</option>
              {accounts.map((acc) => (
                <option key={acc.address} value={acc.address}>
                  {acc.label ? `${acc.label} - ` : ""}
                  {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                </option>
              ))}
            </select>
            {errors.holderAccount && (
              <p className="text-red-500 text-xs mt-1">
                {errors.holderAccount}
              </p>
            )}
          </div>

          {errors.accounts && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{errors.accounts}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency Code (e.g., RLUSD)
            </label>
            <input
              type="text"
              value={iouFormData.currency}
              onChange={(e) =>
                setIouFormData({ ...iouFormData, currency: e.target.value })
              }
              placeholder="RLUSD"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.currency && (
              <p className="text-red-500 text-xs mt-1">{errors.currency}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Currency codes longer than 3 characters will be hex encoded
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Amount
            </label>
            <input
              type="text"
              value={iouFormData.value}
              onChange={(e) =>
                setIouFormData({ ...iouFormData, value: e.target.value })
              }
              placeholder="1000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.value && (
              <p className="text-red-500 text-xs mt-1">{errors.value}</p>
            )}
          </div>

          {/* Transaction Status */}
          {transactionStatuses.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Transaction Status
              </h3>
              <div className="space-y-2">
                {["AccountSet", "TrustSet", "Payment"].map((type) => {
                  const status = transactionStatuses.find(
                    (s) => s.type === type
                  );
                  if (!status) return null;
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status.status)}
                        <span className="text-sm font-medium text-gray-900">
                          {type}
                        </span>
                      </div>
                      {status.hash && (
                        <span className="text-xs text-gray-500 font-mono">
                          {status.hash.slice(0, 8)}...
                        </span>
                      )}
                      {status.error && (
                        <span className="text-xs text-red-600">
                          {status.error}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={createIOU}
            disabled={isLoading || accounts.length < 2}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create and Issue IOU</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default TokenIssuer;
