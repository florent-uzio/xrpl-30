import React, { useState } from "react";
import { motion } from "framer-motion";
import { Client, Wallet } from "xrpl";
import { Shield, UserPlus, UserMinus, AlertTriangle } from "lucide-react";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
}

interface CreatedMPT {
  mptIssuanceId: string;
  issuer: string;
  name: string;
  ticker: string;
  createdAt: Date;
}

interface MPTokenAuthorizerProps {
  client: Client | null;
  account: Account | null;
  accounts: Account[];
  createdMPTs: CreatedMPT[];
  onTransactionCreated: (json: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const MPTokenAuthorizer: React.FC<MPTokenAuthorizerProps> = ({
  client,
  account,
  accounts,
  createdMPTs,
  onTransactionCreated,
  isLoading,
  setIsLoading,
}) => {
  const [selectedMPT, setSelectedMPT] = useState<string>("");
  const [selectedHolder, setSelectedHolder] = useState<string>("");
  const [action, setAction] = useState<"authorize" | "unauthorize">(
    "authorize"
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!account) {
      newErrors.account = "Please select an account first";
    }

    if (!selectedMPT) {
      newErrors.mpt = "Please select an MPT";
    }

    // if (action === "authorize" && !selectedHolder) {
    //   newErrors.holder = "Please select a holder to authorize";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const authorizeMPT = async () => {
    if (!client || !account || !validateForm()) return;

    setIsLoading(true);
    try {
      const transaction: any = {
        TransactionType: "MPTokenAuthorize",
        Account: account.address,
        MPTokenIssuanceID: selectedMPT,
        Fee: "10",
      };

      if (action === "authorize" && selectedHolder) {
        transaction.Holder = selectedHolder;
      } else if (action === "unauthorize") {
        transaction.Flags = 1; // tfMPTUnauthorize flag
      }

      const jsonString = JSON.stringify(transaction, null, 2);
      onTransactionCreated(jsonString);

      const autofilled = await client.autofill(transaction);
      const wallet = Wallet.fromSeed(account.secret);
      const signed = wallet.sign(autofilled);

      const result = await client.submitAndWait(signed.tx_blob);
      console.log("MPToken authorization successful:", result);
    } catch (error) {
      console.error("Failed to authorize MPToken:", error);
      setErrors({
        submit:
          "Failed to authorize MPToken. Please check the console for details.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Authorize MPT</h2>
          <p className="text-gray-600">
            Manage authorization for Multi-Purpose Tokens
          </p>
        </div>
      </div>

      {!account && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-yellow-50 border-yellow-200"
        >
          <div className="flex items-center space-x-3 px-4 py-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">
                No Account Selected
              </h3>
              <p className="text-yellow-700">
                Please select an account from the sidebar to authorize MPTs.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Authorization Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select MPT
              </label>
              <select
                value={selectedMPT}
                onChange={(e) => setSelectedMPT(e.target.value)}
                className="input-field text-gray-700 w-full border border-gray-500 p-2"
              >
                <option value="">Select an MPT...</option>
                {createdMPTs.map((mpt) => (
                  <option key={mpt.mptIssuanceId} value={mpt.mptIssuanceId}>
                    {mpt.ticker} - {mpt.name} (Issuer: {mpt.issuer.slice(0, 8)}
                    ...)
                  </option>
                ))}
              </select>
              {errors.mpt && (
                <p className="text-xs text-red-600 mt-1">{errors.mpt}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value="authorize"
                    checked={action === "authorize"}
                    onChange={(e) =>
                      setAction(e.target.value as "authorize" | "unauthorize")
                    }
                    className="text-blue-600"
                  />
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-green-600" />
                    <span>Authorize</span>
                  </div>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value="unauthorize"
                    checked={action === "unauthorize"}
                    onChange={(e) =>
                      setAction(e.target.value as "authorize" | "unauthorize")
                    }
                    className="text-blue-600"
                  />
                  <div className="flex items-center space-x-2">
                    <UserMinus className="w-4 h-4 text-red-600" />
                    <span>Unauthorize</span>
                  </div>
                </label>
              </div>
            </div>

            {action === "authorize" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holder Address
                </label>
                <select
                  value={selectedHolder}
                  onChange={(e) => setSelectedHolder(e.target.value)}
                  className="input-field border border-gray-500 p-2 text-gray-700 w-full"
                >
                  <option value="">Select a holder...</option>
                  {accounts.map((acc) => (
                    <option key={acc.address} value={acc.address}>
                      {acc.address}
                    </option>
                  ))}
                </select>
                {errors.holder && (
                  <p className="text-xs text-red-600 mt-1">{errors.holder}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Information
          </h3>

          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Authorization</h4>
              <p>
                Allows an account to hold a specific MPT. This is required
                before an account can receive that type of MPT in a payment.
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> You can authorize any MPT created in this
                session, regardless of which account created it. The issuer
                information is shown in the dropdown for reference.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Unauthorization
              </h4>
              <p>
                Revokes an account's ability to hold a specific MPT. This can
                only be done if the account's balance is zero.
              </p>
            </div>
          </div>

          <button
            onClick={authorizeMPT}
            disabled={!account || isLoading || Object.keys(errors).length > 0}
            className="w-full mt-6 btn-primary text-white flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 px-4 py-2 rounded-full cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>
                  {action === "authorize" ? "Authorize" : "Unauthorize"} MPT
                </span>
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
  );
};

export default MPTokenAuthorizer;
