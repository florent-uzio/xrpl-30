import React, { useState } from "react";
import { motion } from "framer-motion";
import { Client, Wallet } from "xrpl";
import { Lock, Unlock, AlertTriangle, Shield } from "lucide-react";

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

interface MPTokenLockerProps {
  client: Client | null;
  account: Account | null;
  accounts: Account[];
  createdMPTs: CreatedMPT[];
  onTransactionCreated: (json: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const MPTokenLocker: React.FC<MPTokenLockerProps> = ({
  client,
  account,
  accounts,
  createdMPTs,
  onTransactionCreated,
  isLoading,
  setIsLoading,
}) => {
  const [formData, setFormData] = useState({
    mptIssuanceId: "",
    holder: "",
    action: "lock", // "lock" or "unlock"
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!account) {
      newErrors.account = "Please select an account first";
    }

    if (!formData.mptIssuanceId) {
      newErrors.mptIssuanceId = "Please select an MPT";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const lockUnlockMPT = async () => {
    if (!client || !account || !validateForm()) return;

    setIsLoading(true);
    try {
      const transaction: any = {
        TransactionType: "MPTokenIssuanceSet",
        Account: account.address,
        MPTokenIssuanceID: formData.mptIssuanceId,
        Flags: formData.action === "lock" ? 1 : 2, // tfMPTLock = 1, tfMPTUnlock = 2
        Fee: "10",
      };

      // Add holder if specified (optional field)
      if (formData.holder) {
        transaction.Holder = formData.holder;
      }

      const jsonString = JSON.stringify(transaction, null, 2);
      onTransactionCreated(jsonString);

      const autofilled = await client.autofill(transaction);
      const wallet = Wallet.fromSeed(account.secret);
      const signed = wallet.sign(autofilled);

      const result = await client.submitAndWait(signed.tx_blob);
      console.log(`MPT ${formData.action} successful:`, result);

      // Reset form
      setFormData({
        mptIssuanceId: "",
        holder: "",
        action: "lock",
      });
    } catch (error) {
      console.error(`Failed to ${formData.action} MPT:`, error);
      setErrors({
        submit: `Failed to ${formData.action} MPT. Please check the console for details.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
          {formData.action === "lock" ? (
            <Lock className="w-6 h-6 text-white" />
          ) : (
            <Unlock className="w-6 h-6 text-white" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {formData.action === "lock" ? "Lock MPT" : "Unlock MPT"}
          </h2>
          <p className="text-gray-600">
            {formData.action === "lock"
              ? "Lock MPT balances to prevent transfers"
              : "Unlock MPT balances to allow transfers"}
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
                Please select an account from the sidebar to lock/unlock MPTs.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Lock/Unlock Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="lock"
                    checked={formData.action === "lock"}
                    onChange={(e) => updateFormData("action", e.target.value)}
                    className="mr-2"
                  />
                  <span className="flex items-center text-gray-900">
                    <Lock className="w-4 h-4 mr-1" />
                    Lock
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="unlock"
                    checked={formData.action === "unlock"}
                    onChange={(e) => updateFormData("action", e.target.value)}
                    className="mr-2"
                  />
                  <span className="flex items-center text-gray-900">
                    <Unlock className="w-4 h-4 mr-1" />
                    Unlock
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select MPT
              </label>
              <select
                value={formData.mptIssuanceId}
                onChange={(e) =>
                  updateFormData("mptIssuanceId", e.target.value)
                }
                className="input-field text-gray-700 w-full border border-gray-500 p-2"
              >
                <option value="">Select an MPT...</option>
                {createdMPTs
                  .filter((mpt) => mpt.issuer === account?.address)
                  .map((mpt) => (
                    <option key={mpt.mptIssuanceId} value={mpt.mptIssuanceId}>
                      {mpt.ticker} - {mpt.name} (Issuer:{" "}
                      {mpt.issuer.slice(0, 8)}...)
                    </option>
                  ))}
              </select>
              {errors.mptIssuanceId && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.mptIssuanceId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Holder (Optional)
              </label>
              <select
                value={formData.holder}
                onChange={(e) => updateFormData("holder", e.target.value)}
                className="input-field text-gray-700 w-full border border-gray-500 p-2"
              >
                <option value="">All holders (default)</option>
                {accounts
                  .filter((acc) => acc.address !== account?.address)
                  .map((acc) => {
                    const accountIndex =
                      accounts.findIndex((a) => a.address === acc.address) + 1;
                    return (
                      <option key={acc.address} value={acc.address}>
                        Account {accountIndex}: {acc.address.slice(0, 8)}...
                        {acc.address.slice(-4)}
                      </option>
                    );
                  })}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to apply to all holders, or select a specific holder
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            MPT Lock/Unlock Information
          </h3>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="font-semibold text-purple-800">
                    {formData.action === "lock"
                      ? "Lock MPT Balances"
                      : "Unlock MPT Balances"}
                  </h4>
                  <p className="text-purple-700 text-sm mt-1">
                    {formData.action === "lock"
                      ? "Prevents all transfers of this MPT. Locked tokens cannot be sent or received."
                      : "Allows transfers of this MPT. Unlocked tokens can be sent and received normally."}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Required Fields:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>MPT Issuance ID - The MPT to lock/unlock</li>
                <li>Action - Lock or unlock the MPT</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Optional Fields:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Holder - Specific account to lock/unlock (defaults to all
                  holders)
                </li>
              </ul>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Only the MPT issuer can lock or unlock
                tokens. Locked tokens cannot be transferred until unlocked.
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Global Access:</strong> You can only lock/unlock MPTs
                that you have created. The issuer information is shown in the
                dropdown for reference.
              </p>
            </div>
          </div>

          <button
            onClick={lockUnlockMPT}
            disabled={!account || isLoading || Object.keys(errors).length > 0}
            className={`w-full mt-6 btn-primary text-white flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-full cursor-pointer ${
              formData.action === "lock"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>
                  {formData.action === "lock" ? "Locking..." : "Unlocking..."}
                </span>
              </>
            ) : (
              <>
                {formData.action === "lock" ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Unlock className="w-5 h-5" />
                )}
                <span>
                  {formData.action === "lock" ? "Lock MPT" : "Unlock MPT"}
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

export default MPTokenLocker;
