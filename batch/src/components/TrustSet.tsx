import React, { useState } from "react";
import { Client, Wallet, convertStringToHex, TrustSetFlags } from "xrpl";
import { Link, Info, AlertCircle } from "lucide-react";

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

interface TrustSetProps {
  client: Client | null;
  account: Account | null;
  accounts: Account[];
  createdTokens: CreatedToken[];
  onTransactionSubmitted: (record: TransactionRecord) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const TrustSet: React.FC<TrustSetProps> = ({
  client,
  account,
  accounts,
  createdTokens,
  onTransactionSubmitted,
  isLoading,
  setIsLoading,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string>(
    account?.address || ""
  );
  const [currency, setCurrency] = useState("");
  const [issuer, setIssuer] = useState("");
  const [limit, setLimit] = useState("");
  const [setNoRipple, setSetNoRipple] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const encodeCurrency = (currency: string): string => {
    if (!currency) return "";
    if (currency.length <= 3) {
      return currency.padEnd(3, "\0");
    }
    return convertStringToHex(currency).padEnd(40, "0");
  };

  // Get unique IOUs for dropdown (deduplicated by issuer and currency)
  const uniqueIOUs = createdTokens
    .filter((t) => t.type === "IOU")
    .reduce((acc: CreatedToken[], current) => {
      const exists = acc.some(
        (t) => t.issuer === current.issuer && t.currency === current.currency
      );
      if (exists) return acc;
      return [...acc, current];
    }, []);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedAccount) {
      newErrors.account = "Please select an account";
    }
    if (!currency) {
      newErrors.currency = "Currency is required";
    }
    if (!issuer) {
      newErrors.issuer = "Issuer is required";
    }
    if (!limit || parseFloat(limit) <= 0) {
      newErrors.limit = "Valid limit amount is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const setTrustLine = async () => {
    if (!client || !validateForm()) return;

    const trustAccount = accounts.find((a) => a.address === selectedAccount);
    if (!trustAccount) {
      alert("Account not found");
      return;
    }

    setIsLoading(true);
    try {
      const encodedCurrencyValue = encodeCurrency(currency);

      const trustSetTx: any = {
        TransactionType: "TrustSet",
        Account: trustAccount.address,
        LimitAmount: {
          currency: encodedCurrencyValue,
          issuer: issuer,
          value: limit,
        },
      };

      // Add flags if needed
      if (setNoRipple) {
        trustSetTx.Flags = TrustSetFlags.tfSetNoRipple;
      }

      const wallet = Wallet.fromSeed(trustAccount.secret);
      const result = await client.submitAndWait(trustSetTx, {
        autofill: true,
        wallet: wallet,
      });

      const txResult =
        typeof result.result.meta === "object" && result.result.meta
          ? (result.result.meta as any).TransactionResult
          : "tesSUCCESS";

      if (onTransactionSubmitted) {
        onTransactionSubmitted({
          hash: result.result.hash || "",
          result: txResult,
          type: "TrustSet",
          account: trustAccount.address,
          timestamp: new Date(),
        });
      }

      alert("Trust line set successfully!");

      // Reset form
      setCurrency("");
      setIssuer("");
      setLimit("");
      setSetNoRipple(false);
    } catch (error: any) {
      console.error("Failed to set trust line:", error);
      alert(`Failed to set trust line: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fillFromIOU = (tokenId: string) => {
    const token = uniqueIOUs.find((t) => t.id === tokenId);
    if (token) {
      setCurrency(token.currency);
      setIssuer(token.issuer);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <Link className="w-6 h-6" />
          <span>Set Trust Line</span>
        </h2>
        <p className="text-gray-600">
          Create or modify a trust line to hold an IOU token
        </p>
      </div>

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

      <div className="space-y-6">
        {/* Account Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an account</option>
            {accounts.map((acc) => (
              <option key={acc.address} value={acc.address}>
                {acc.label ? `${acc.label} - ` : ""}
                {acc.address.slice(0, 8)}...{acc.address.slice(-6)} (
                {acc.balance} XRP)
              </option>
            ))}
          </select>
          {errors.account && (
            <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.account}</span>
            </p>
          )}
        </div>

        {/* Quick Fill from IOU */}
        {uniqueIOUs.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Fill from Existing IOU (Optional)
            </label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  fillFromIOU(e.target.value);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an IOU to auto-fill...</option>
              {uniqueIOUs.map((token) => (
                <option key={token.id} value={token.id}>
                  {token.currency} from {token.issuer.slice(0, 8)}...
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="RLUSD or USD"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.currency && (
            <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.currency}</span>
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Currency code (3 characters or hex-encoded for longer codes)
          </p>
        </div>

        {/* Issuer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issuer
          </label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="r..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
          />
          {errors.issuer && (
            <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.issuer}</span>
            </p>
          )}
        </div>

        {/* Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Limit Amount
          </label>
          <input
            type="text"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="1000000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.limit && (
            <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.limit}</span>
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Maximum amount of this currency you trust from this issuer
          </p>
        </div>

        {/* Flags */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={setNoRipple}
              onChange={(e) => setSetNoRipple(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Set No Ripple (tfSetNoRipple)
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Prevents this trust line from being used for rippling
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={setTrustLine}
          disabled={isLoading || !selectedAccount}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? "Setting Trust Line..." : "Set Trust Line"}
        </button>
      </div>
    </div>
  );
};

export default TrustSet;

