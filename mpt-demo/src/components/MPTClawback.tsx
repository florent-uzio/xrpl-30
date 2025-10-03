import React, { useState } from "react";
import { motion } from "framer-motion";
import { Client, Wallet } from "xrpl";
import { DollarSign, AlertTriangle, Shield } from "lucide-react";
import TransactionTracker from "../utils/transactionTracker";

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

interface MPTClawbackProps {
  client: Client | null;
  account: Account | null;
  accounts: Account[];
  createdMPTs: CreatedMPT[];
  onTransactionCreated: (json: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const MPTClawback: React.FC<MPTClawbackProps> = ({
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
    amount: "",
    holder: "",
    invoiceId: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!account) {
      newErrors.account = "Please select an account first";
    }

    if (!formData.mptIssuanceId) {
      newErrors.mptIssuanceId = "Please enter an MPT Issuance ID";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (!formData.holder) {
      newErrors.holder = "Please select a holder to claw back from";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clawbackMPT = async () => {
    if (!client || !account || !validateForm()) return;

    setIsLoading(true);
    try {
      const transaction: any = {
        TransactionType: "Clawback",
        Account: account.address,
        Amount: {
          mpt_issuance_id: formData.mptIssuanceId,
          value: formData.amount,
        },
        Holder: formData.holder,
        Fee: "120",
        Flags: 0,
      };

      // Add optional fields if provided
      if (formData.invoiceId) {
        transaction.InvoiceID = formData.invoiceId;
      }

      const jsonString = JSON.stringify(transaction, null, 2);
      onTransactionCreated(jsonString);

      const autofilled = await client.autofill(transaction as any);
      const wallet = Wallet.fromSeed(account.secret);
      const signed = wallet.sign(autofilled);

      const result = await client.submitAndWait(signed.tx_blob);
      console.log("MPT Clawback successful:", result);

      // Track the transaction
      const tracker = TransactionTracker.getInstance();
      tracker.addTransaction(
        account.address,
        "Clawback",
        result.result.hash || "",
        true,
        result.result.ledger_index,
        transaction.Fee,
        typeof result.result.meta === "object" && result.result.meta
          ? (result.result.meta as any).TransactionResult
          : undefined
      );

      // Reset form
      setFormData({
        mptIssuanceId: "",
        amount: "",
        holder: "",
        invoiceId: "",
      });
    } catch (error) {
      console.error("Failed to clawback MPT:", error);
      setErrors({
        submit: "Failed to clawback MPT. Please check the console for details.",
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
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clawback MPT</h2>
          <p className="text-gray-600">
            Reclaim Multi-Purpose Tokens from holders
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
                Please select an account from the sidebar to clawback MPTs.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Clawback Settings
          </h3>

          <div className="space-y-4">
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
                Amount to Clawback
              </label>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => updateFormData("amount", e.target.value)}
                className="input-field text-gray-700 w-full border border-gray-500 p-2"
                placeholder="100"
              />
              {errors.amount && (
                <p className="text-xs text-red-600 mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Holder Address
              </label>
              <select
                value={formData.holder}
                onChange={(e) => updateFormData("holder", e.target.value)}
                className="input-field text-gray-700 w-full border border-gray-500 p-2"
              >
                <option value="">Select holder to clawback from...</option>
                {accounts
                  .filter((acc) => acc.address !== account?.address)
                  .map((acc) => (
                    <option key={acc.address} value={acc.address}>
                      {acc.address}
                    </option>
                  ))}
              </select>
              {errors.holder && (
                <p className="text-xs text-red-600 mt-1">{errors.holder}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice ID (Optional)
              </label>
              <input
                type="text"
                value={formData.invoiceId}
                onChange={(e) => updateFormData("invoiceId", e.target.value)}
                className="input-field text-gray-700 w-full border border-gray-500 p-2"
                placeholder="Hex string (64 characters)"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Clawback Information
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h4 className="font-semibold text-red-800">
                    Issuer Authority Required
                  </h4>
                  <p className="text-red-700 text-sm mt-1">
                    Only the issuer of an MPT can clawback tokens. This feature
                    must be enabled when creating the MPT.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-semibold text-orange-800">
                    Regulatory Compliance
                  </h4>
                  <p className="text-orange-700 text-sm mt-1">
                    Clawback is typically used for regulatory compliance, error
                    recovery, or fraud prevention.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>You must be the issuer of the MPT</li>
                <li>The MPT must have the "Can Clawback" flag enabled</li>
                <li>The holder must have a positive balance</li>
                <li>You cannot clawback more than the holder's balance</li>
              </ul>
            </div>

            <div className="text-sm text-gray-600">
              <h4 className="font-medium text-gray-900 mb-2">Use Cases:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Regulatory compliance requirements</li>
                <li>Error recovery from incorrect transfers</li>
                <li>Fraud prevention and security</li>
                <li>Token lifecycle management</li>
              </ul>
            </div>
          </div>

          <button
            onClick={clawbackMPT}
            disabled={!account || isLoading || Object.keys(errors).length > 0}
            className="w-full mt-6 btn-danger text-white flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 px-4 py-2 rounded-full cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Clawing Back...</span>
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                <span>Clawback MPT</span>
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

export default MPTClawback;
