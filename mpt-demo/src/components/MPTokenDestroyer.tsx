import React, { useState } from "react";
import { motion } from "framer-motion";
import { Client, Wallet } from "xrpl";
import { Trash2, AlertTriangle } from "lucide-react";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
}

interface MPTokenDestroyerProps {
  client: Client | null;
  account: Account | null;
  onTransactionCreated: (json: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const MPTokenDestroyer: React.FC<MPTokenDestroyerProps> = ({
  client,
  account,
  onTransactionCreated,
  isLoading,
  setIsLoading,
}) => {
  const [selectedMPT, setSelectedMPT] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!account) {
      newErrors.account = "Please select an account first";
    }

    if (!selectedMPT) {
      newErrors.mpt = "Please enter an MPT Issuance ID";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const destroyMPToken = async () => {
    if (!client || !account || !validateForm()) return;

    setIsLoading(true);
    try {
      const transaction = {
        TransactionType: "MPTokenIssuanceDestroy",
        Account: account.address,
        MPTokenIssuanceID: selectedMPT,
        Fee: "10",
      };

      const jsonString = JSON.stringify(transaction, null, 2);
      onTransactionCreated(jsonString);

      const autofilled = await client.autofill(transaction as any);
      const wallet = Wallet.fromSeed(account.secret);
      const signed = wallet.sign(autofilled);

      const result = await client.submitAndWait(signed.tx_blob);
      console.log("MPToken destroyed successfully:", result);

      // Reset form
      setSelectedMPT("");
    } catch (error) {
      console.error("Failed to destroy MPToken:", error);
      setErrors({
        submit:
          "Failed to destroy MPToken. Please check the console for details.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Destroy MPT</h2>
          <p className="text-gray-600">
            Permanently destroy a Multi-Purpose Token
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
                Please select an account from the sidebar to destroy MPTs.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Destroy Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MPT Issuance ID
              </label>
              <input
                type="text"
                value={selectedMPT}
                onChange={(e) => setSelectedMPT(e.target.value)}
                className="input-field"
                placeholder="Enter MPT Issuance ID to destroy..."
              />
              {errors.mpt && (
                <p className="text-xs text-red-600 mt-1">{errors.mpt}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Warning</h3>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h4 className="font-semibold text-red-800">
                    Irreversible Action
                  </h4>
                  <p className="text-red-700 text-sm mt-1">
                    Destroying an MPT is permanent and cannot be undone. All
                    tokens of this type will be permanently removed from the
                    ledger.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>You must be the issuer of the MPT</li>
                <li>All tokens must be destroyed or transferred</li>
                <li>No active authorizations should remain</li>
              </ul>
            </div>
          </div>

          <button
            onClick={destroyMPToken}
            disabled={!account || isLoading || Object.keys(errors).length > 0}
            className="w-full mt-6 btn-danger flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Destroying...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                <span>Destroy MPT</span>
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

export default MPTokenDestroyer;
