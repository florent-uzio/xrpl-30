import React, { useState } from "react";
import { motion } from "framer-motion";
import { Client, convertStringToHex, Wallet } from "xrpl";
import {
  Plus,
  Settings,
  Info,
  Shield,
  Lock,
  Unlock,
  ArrowRightLeft,
  DollarSign,
  HandCoins,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import TransactionTracker from "../utils/transactionTracker";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
}

interface MPTokenCreatorProps {
  client: Client | null;
  account: Account | null;
  onTransactionCreated: (json: string) => void;
  onMPTCreated: (mptIssuanceId: string, metadata: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface MPTFlags {
  tfMPTCanLock: boolean; // 0x00000002 (2)
  tfMPTRequireAuth: boolean; // 0x00000004 (4)
  tfMPTCanEscrow: boolean; // 0x00000008 (8)
  tfMPTCanTrade: boolean; // 0x00000010 (16)
  tfMPTCanTransfer: boolean; // 0x00000020 (32)
  tfMPTCanClawback: boolean; // 0x00000040 (64)
}

const JSON_METADATA = {
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
};

const MPTokenCreator: React.FC<MPTokenCreatorProps> = ({
  client,
  account,
  onTransactionCreated,
  onMPTCreated,
  isLoading,
  setIsLoading,
}) => {
  const [formData, setFormData] = useState({
    assetScale: 2,
    transferFee: 0,
    maximumAmount: "1000000",
    metadata: JSON.stringify(JSON_METADATA, null, 2),
  });

  const [flags, setFlags] = useState<MPTFlags>({
    tfMPTCanLock: false,
    tfMPTRequireAuth: false,
    tfMPTCanEscrow: false,
    tfMPTCanTrade: true,
    tfMPTCanTransfer: true,
    tfMPTCanClawback: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const flagDescriptions = {
    tfMPTCanLock: {
      name: "Can Lock",
      description: "Allows the MPT to be locked both individually and globally",
      icon: Lock,
      hex: "0x00000002",
      decimal: 2,
    },
    tfMPTRequireAuth: {
      name: "Require Authorization",
      description: "Individual holders must be authorized by the issuer",
      icon: Shield,
      hex: "0x00000004",
      decimal: 4,
    },
    tfMPTCanEscrow: {
      name: "Can Escrow",
      description: "Holders can place their balances into an escrow",
      icon: Unlock,
      hex: "0x00000008",
      decimal: 8,
    },
    tfMPTCanTrade: {
      name: "Can Trade",
      description: "Holders can trade their balances using the XRP Ledger DEX",
      icon: ArrowRightLeft,
      hex: "0x00000010",
      decimal: 16,
    },
    tfMPTCanTransfer: {
      name: "Can Transfer",
      description: "Tokens can be transferred to other accounts",
      icon: HandCoins,
      hex: "0x00000020",
      decimal: 32,
    },
    tfMPTCanClawback: {
      name: "Can Clawback",
      description: "Issuer can claw back value from individual holders",
      icon: DollarSign,
      hex: "0x00000040",
      decimal: 64,
    },
  };

  const calculateFlags = (): number => {
    let flagValue = 0;
    Object.entries(flags).forEach(([key, value]) => {
      if (value) {
        const flagInfo = flagDescriptions[key as keyof MPTFlags];
        flagValue += flagInfo.decimal;
      }
    });
    return flagValue;
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!account) {
      newErrors.account = "Please select an account first";
    }

    if (formData.assetScale < 0 || formData.assetScale > 15) {
      newErrors.assetScale = "Asset scale must be between 0 and 15";
    }

    if (
      flags.tfMPTCanTransfer &&
      (formData.transferFee < 0 || formData.transferFee > 50000)
    ) {
      newErrors.transferFee =
        "Transfer fee must be between 0 and 50,000 (0% to 50%)";
    }

    if (!flags.tfMPTCanTransfer && formData.transferFee > 0) {
      newErrors.transferFee =
        "Transfer fee can only be set if Can Transfer is enabled";
    }

    if (parseInt(formData.maximumAmount) <= 0) {
      newErrors.maximumAmount = "Maximum amount must be greater than 0";
    }

    try {
      JSON.parse(formData.metadata);
    } catch (e) {
      newErrors.metadata = "Metadata must be valid JSON";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMPToken = async () => {
    if (!client || !account || !validateForm()) return;

    setIsLoading(true);
    try {
      const flagValue = calculateFlags();

      const transaction = {
        TransactionType: "MPTokenIssuanceCreate",
        Account: account.address,
        AssetScale: formData.assetScale,
        TransferFee: flags.tfMPTCanTransfer ? formData.transferFee : undefined,
        MaximumAmount: formData.maximumAmount,
        Flags: flagValue,
        MPTokenMetadata: convertStringToHex(formData.metadata).toUpperCase(),
        Fee: "10",
      };

      // Remove undefined fields
      Object.keys(transaction).forEach((key) => {
        if (transaction[key as keyof typeof transaction] === undefined) {
          delete transaction[key as keyof typeof transaction];
        }
      });

      const jsonString = JSON.stringify(transaction, null, 2);
      onTransactionCreated(jsonString);

      // Auto-fill and submit the transaction
      const autofilled = await client.autofill(transaction as any);
      const wallet = Wallet.fromSeed(account.secret);
      const signed = wallet.sign(autofilled);

      const result = await client.submitAndWait(signed.tx_blob);

      console.log("MPToken created successfully:", result);

      // Track the transaction
      const tracker = TransactionTracker.getInstance();
      tracker.addTransaction(
        account.address,
        "MPTokenIssuanceCreate",
        result.result.hash || "",
        true,
        result.result.ledger_index,
        transaction.Fee,
        typeof result.result.meta === "object" && result.result.meta
          ? (result.result.meta as any).TransactionResult
          : undefined
      );

      // Extract MPT issuance ID from the result
      if (
        result.result.meta &&
        typeof result.result.meta === "object" &&
        "mpt_issuance_id" in result.result.meta
      ) {
        const mptIssuanceId = (result.result.meta as any).mpt_issuance_id;
        const metadata = JSON.parse(formData.metadata);
        onMPTCreated(mptIssuanceId, metadata);
        console.log("MPT Issuance ID:", mptIssuanceId);
      }

      // Reset form
      setFormData({
        assetScale: 2,
        transferFee: 0,
        maximumAmount: "1000000",
        metadata: JSON.stringify(JSON_METADATA, null, 2),
      });
    } catch (error) {
      console.error("Failed to create MPToken:", error);
      setErrors({
        submit:
          "Failed to create MPToken. Please check the console for details.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFlag = (flagName: keyof MPTFlags) => {
    setFlags((prev) => ({
      ...prev,
      [flagName]: !prev[flagName],
    }));
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Plus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Create Multi-Purpose Token
          </h2>
          <p className="text-gray-600">
            Configure and create a new MPT on the XRP Ledger
          </p>
        </div>
      </div>

      {!account && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-yellow-50 border-yellow-200"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">
                No Account Selected
              </h3>
              <p className="text-yellow-700">
                Please select an account from the sidebar to create an MPT.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Configuration */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>Basic Configuration</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Scale
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={formData.assetScale}
                  onChange={(e) =>
                    updateFormData("assetScale", parseInt(e.target.value))
                  }
                  className="input-field border border-gray-500 p-2 text-gray-700 w-full"
                  placeholder="2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Decimal places for the token (0-15). 2 = 0.01 precision.
                </p>
                {errors.assetScale && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.assetScale}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Amount
                </label>
                <input
                  type="text"
                  value={formData.maximumAmount}
                  onChange={(e) =>
                    updateFormData("maximumAmount", e.target.value)
                  }
                  className="input-field border border-gray-500 p-2 text-gray-700 w-full"
                  placeholder="1000000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum tokens that can ever be issued.
                </p>
                {errors.maximumAmount && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.maximumAmount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Fee (0.001% increments)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50000"
                  value={formData.transferFee}
                  onChange={(e) =>
                    updateFormData("transferFee", parseInt(e.target.value))
                  }
                  className="input-field border border-gray-500 p-2 text-gray-700 w-full"
                  placeholder="0"
                  disabled={!flags.tfMPTCanTransfer}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fee for secondary sales (0-50,000 = 0%-50%). Only available if
                  Can Transfer is enabled.
                </p>
                {errors.transferFee && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.transferFee}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Info className="w-5 h-5 text-purple-600" />
              <span>Token Metadata</span>
            </h3>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <span>JSON Metadata</span>
                <a
                  href="https://github.com/XRPLF/XRPL-Standards/discussions/264"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" /> <span>XLS-89</span>
                </a>
              </label>
              <textarea
                value={formData.metadata}
                onChange={(e) => updateFormData("metadata", e.target.value)}
                className="input-field font-mono text-sm border border-gray-500 p-2 text-gray-700 w-full h-96"
                placeholder="Enter JSON metadata..."
              />
              <p className="text-xs text-gray-700 mt-1">
                JSON metadata describing the token (max 1024 bytes).
              </p>
              {errors.metadata && (
                <p className="text-xs text-red-600 mt-1">{errors.metadata}</p>
              )}
            </div>
          </div>
        </div>

        {/* Flags Configuration */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>Token Flags</span>
            </h3>

            <div className="space-y-3">
              {Object.entries(flagDescriptions).map(([key, flagInfo]) => {
                const Icon = flagInfo.icon;
                const isEnabled = flags[key as keyof MPTFlags];

                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isEnabled
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => updateFlag(key as keyof MPTFlags)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isEnabled
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {flagInfo.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 font-mono">
                              {flagInfo.hex}
                            </span>
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isEnabled
                                  ? "border-green-500 bg-green-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isEnabled && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {flagInfo.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Flags Value:</span>
                <span className="font-mono font-semibold text-blue-600">
                  {calculateFlags()} (0x
                  {calculateFlags().toString(16).toUpperCase()})
                </span>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="card">
            <button
              onClick={createMPToken}
              disabled={!account || isLoading || Object.keys(errors).length > 0}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-blue-600 px-4 py-2 rounded-full"
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Creating MPT...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Create Multi-Purpose Token</span>
                </>
              )}
            </button>

            {errors.submit && (
              <p className="text-sm text-red-600 mt-2 text-center">
                {errors.submit}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MPTokenCreator;
