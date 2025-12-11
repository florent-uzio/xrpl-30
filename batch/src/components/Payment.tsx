import React, { useState } from "react";
import { Client, Wallet, convertStringToHex } from "xrpl";
import { Send, Info, Layers, Coins } from "lucide-react";

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

interface PaymentProps {
  client: Client | null;
  account: Account | null;
  accounts: Account[];
  createdTokens: CreatedToken[];
  onTransactionSubmitted: (record: TransactionRecord) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const Payment: React.FC<PaymentProps> = ({
  client,
  accounts,
  createdTokens,
  onTransactionSubmitted,
  isLoading,
  setIsLoading,
}) => {
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [sourceAccount, setSourceAccount] = useState<string>("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const encodeCurrency = (currency: string): string => {
    if (!currency) return "";
    if (currency.length <= 3) {
      return currency.padEnd(3, "\0");
    }
    return convertStringToHex(currency).padEnd(40, "0");
  };

  const selectedTokenData = createdTokens.find((t) => t.id === selectedToken);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedToken) {
      newErrors.token = "Please select a token";
    }
    if (!sourceAccount) {
      newErrors.sourceAccount = "Please select source account";
    }
    if (!destination) {
      newErrors.destination = "Destination is required";
    }
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendPayment = async () => {
    if (!client || !validateForm() || !selectedTokenData) return;

    const source = accounts.find((a) => a.address === sourceAccount);
    if (!source) {
      alert("Source account not found");
      return;
    }

    setIsLoading(true);
    try {
      let paymentTx: any;

      if (selectedTokenData.type === "MPT" && selectedTokenData.mptIssuanceId) {
        // MPT Payment
        paymentTx = {
          TransactionType: "Payment",
          Account: source.address,
          Destination: destination,
          Amount: {
            mpt_issuance_id: selectedTokenData.mptIssuanceId,
            value: amount,
          },
        };
      } else {
        // IOU Payment
        const encodedCurrency = encodeCurrency(selectedTokenData.currency);
        paymentTx = {
          TransactionType: "Payment",
          Account: source.address,
          Destination: destination,
          Amount: {
            currency: encodedCurrency,
            issuer: selectedTokenData.issuer,
            value: amount,
          },
        };
      }

      const wallet = Wallet.fromSeed(source.secret);
      const result = await client.submitAndWait(paymentTx, {
        autofill: true,
        wallet: wallet,
      });

      const txResult = typeof result.result.meta === "object" && result.result.meta
        ? (result.result.meta as any).TransactionResult
        : "tesSUCCESS";

      if (onTransactionSubmitted) {
        onTransactionSubmitted({
          hash: result.result.hash || "",
          result: txResult,
          type: "Payment",
          account: source.address,
          timestamp: new Date(),
        });
      }

      alert("Payment sent successfully!");
      
      // Reset form
      setDestination("");
      setAmount("");
    } catch (error: any) {
      console.error("Failed to send payment:", error);
      alert(`Failed to send payment: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const mptTokens = createdTokens.filter((t) => t.type === "MPT");
  // Deduplicate IOUs by issuer+currency combination
  const iouTokens = createdTokens
    .filter((t) => t.type === "IOU")
    .filter((token, index, self) => {
      return (
        index ===
        self.findIndex(
          (t) =>
            t.type === "IOU" &&
            t.issuer === token.issuer &&
            t.currency === token.currency
        )
      );
    });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Payment</h2>
        <p className="text-gray-600">
          Transfer MPT tokens or IOUs to another account
        </p>
      </div>

      {createdTokens.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              No tokens created yet. Create tokens in the Issue Tokens tab first.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a token</option>
            {mptTokens.length > 0 && (
              <optgroup label="MPT Tokens">
                {mptTokens.map((token) => (
                  <option key={token.id} value={token.id}>
                    {token.currency} (MPT) - {token.issuer.slice(0, 8)}...
                  </option>
                ))}
              </optgroup>
            )}
            {iouTokens.length > 0 && (
              <optgroup label="IOU Tokens">
                {iouTokens.map((token) => (
                  <option key={token.id} value={token.id}>
                    {token.currency} (IOU) - {token.issuer.slice(0, 8)}...
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {errors.token && (
            <p className="text-red-500 text-xs mt-1">{errors.token}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Account
          </label>
          <select
            value={sourceAccount}
            onChange={(e) => setSourceAccount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select source account</option>
            {accounts.map((acc) => (
              <option key={acc.address} value={acc.address}>
                {acc.label ? `${acc.label} - ` : ""}
                {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
              </option>
            ))}
          </select>
          {errors.sourceAccount && (
            <p className="text-red-500 text-xs mt-1">{errors.sourceAccount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="r..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.destination && (
            <p className="text-red-500 text-xs mt-1">{errors.destination}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
          )}
        </div>

        {selectedTokenData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              {selectedTokenData.type === "MPT" ? (
                <Layers className="w-5 h-5 text-blue-600" />
              ) : (
                <Coins className="w-5 h-5 text-purple-600" />
              )}
              <span className="font-semibold text-gray-900">
                {selectedTokenData.currency} ({selectedTokenData.type})
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <div>Issuer: {selectedTokenData.issuer.slice(0, 8)}...{selectedTokenData.issuer.slice(-6)}</div>
              {selectedTokenData.mptIssuanceId && (
                <div className="mt-1 font-mono text-xs">
                  MPT ID: {selectedTokenData.mptIssuanceId.slice(0, 16)}...
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={sendPayment}
          disabled={isLoading || createdTokens.length === 0}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <Send className="w-5 h-5" />
          <span>Send Payment</span>
        </button>
      </div>
    </div>
  );
};

export default Payment;

