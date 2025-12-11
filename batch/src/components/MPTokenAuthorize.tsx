import React, { useState } from "react";
import { Client, Wallet } from "xrpl";
import { Shield, Info } from "lucide-react";

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

interface MPTokenAuthorizeProps {
  client: Client | null;
  account: Account | null;
  accounts: Account[];
  createdTokens: CreatedToken[];
  onTransactionSubmitted: (record: TransactionRecord) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const MPTokenAuthorize: React.FC<MPTokenAuthorizeProps> = ({
  client,
  account,
  accounts,
  createdTokens,
  onTransactionSubmitted,
  isLoading,
  setIsLoading,
}) => {
  const [selectedMPT, setSelectedMPT] = useState<string>("");
  const [authorizeType, setAuthorizeType] = useState<
    "authorize" | "unauthorize"
  >("authorize");
  const [holderAccount, setHolderAccount] = useState<string>(
    account?.address || ""
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const mptTokens = createdTokens.filter(
    (t) => t.type === "MPT" && t.mptIssuanceId
  );

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!account) {
      newErrors.account = "Please select an account first";
    }
    if (!selectedMPT) {
      newErrors.mpt = "Please select an MPT token";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitAuthorization = async () => {
    if (!client || !account || !validateForm()) return;

    const selectedToken = mptTokens.find((t) => t.id === selectedMPT);
    if (!selectedToken || !selectedToken.mptIssuanceId) {
      alert("Selected MPT token not found or missing issuance ID");
      return;
    }

    setIsLoading(true);
    try {
      const transaction: any = {
        TransactionType: "MPTokenAuthorize",
        Account: account.address,
        MPTokenIssuanceID: selectedToken.mptIssuanceId,
        Flags: authorizeType === "unauthorize" ? 1 : 0, // tfMPTUnauthorize = 1
      };

      // If authorizing another account (allow-listing), add Holder field
      if (
        authorizeType === "authorize" &&
        holderAccount &&
        holderAccount !== account.address
      ) {
        transaction.Holder = holderAccount;
      }

      const wallet = Wallet.fromSeed(account.secret);
      const result = await client.submitAndWait(transaction, {
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
          type: "MPTokenAuthorize",
          account: account.address,
          timestamp: new Date(),
        });
      }

      alert(
        authorizeType === "authorize"
          ? "MPT authorization successful!"
          : "MPT unauthorization successful!"
      );

      // Reset form
      setHolderAccount("");
    } catch (error: any) {
      console.error("Failed to authorize MPT:", error);
      alert(`Failed to authorize MPT: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTokenData = mptTokens.find((t) => t.id === selectedMPT);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          MPToken Authorize
        </h2>
        <p className="text-gray-600">
          Control whether an account can hold a Multi-purpose Token (MPT).
          Authorize yourself to hold an MPT, or authorize/revoke permission for
          other accounts (allow-listing).
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

      {mptTokens.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              No MPT tokens created yet. Create MPT tokens in the Issue Tokens
              tab first.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            MPT Token
          </label>
          <select
            value={selectedMPT}
            onChange={(e) => setSelectedMPT(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select MPT Token</option>
            {mptTokens.map((token) => (
              <option key={token.id} value={token.id}>
                {token.currency} - {token.issuer.slice(0, 8)}...
              </option>
            ))}
          </select>
          {errors.mpt && (
            <p className="text-red-500 text-xs mt-1">{errors.mpt}</p>
          )}
        </div>

        {selectedTokenData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">
                {selectedTokenData.currency}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <div>
                Issuer: {selectedTokenData.issuer.slice(0, 8)}...
                {selectedTokenData.issuer.slice(-6)}
              </div>
              {selectedTokenData.mptIssuanceId && (
                <div className="mt-1 font-mono text-xs">
                  MPT ID: {selectedTokenData.mptIssuanceId.slice(0, 16)}...
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Authorization Type
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => setAuthorizeType("authorize")}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                authorizeType === "authorize"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-gray-900">Authorize</div>
              <div className="text-xs text-gray-600 mt-1">
                Grant permission to hold this MPT
              </div>
            </button>
            <button
              onClick={() => setAuthorizeType("unauthorize")}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                authorizeType === "unauthorize"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-gray-900">Unauthorize</div>
              <div className="text-xs text-gray-600 mt-1">
                Revoke permission to hold this MPT
              </div>
            </button>
          </div>
        </div>

        {authorizeType === "authorize" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Holder Account (optional - leave empty to authorize yourself)
            </label>
            <select
              value={holderAccount}
              onChange={(e) => setHolderAccount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Self (authorize yourself)</option>
              {accounts
                .filter((acc) => acc.address !== account?.address)
                .map((acc) => (
                  <option key={acc.address} value={acc.address}>
                    {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                  </option>
                ))}
            </select>
            {errors.holder && (
              <p className="text-red-500 text-xs mt-1">{errors.holder}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {holderAccount
                ? "Authorizing another account (allow-listing)"
                : "Authorizing yourself to hold this MPT"}
            </p>
          </div>
        )}

        <button
          onClick={submitAuthorization}
          disabled={isLoading || !account || mptTokens.length === 0}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <Shield className="w-5 h-5" />
          <span>
            {authorizeType === "authorize" ? "Authorize" : "Unauthorize"} MPT
          </span>
        </button>
      </div>
    </div>
  );
};

export default MPTokenAuthorize;
