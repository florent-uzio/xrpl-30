import React, { useState } from "react";
import { motion } from "framer-motion";
import { Client, Wallet } from "xrpl";
import { Send, AlertTriangle, Coins } from "lucide-react";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
}

interface MPTPaymentProps {
  client: Client | null;
  account: Account | null;
  accounts: Account[];
  onTransactionCreated: (json: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const MPTPayment: React.FC<MPTPaymentProps> = ({
  client,
  account,
  accounts,
  onTransactionCreated,
  isLoading,
  setIsLoading,
}) => {
  const [formData, setFormData] = useState({
    mptIssuanceId: "",
    amount: "",
    destination: "",
    destinationTag: "",
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

    if (!formData.destination) {
      newErrors.destination = "Please enter a destination address";
    } else if (!/^r[a-zA-Z0-9]{24,34}$/.test(formData.destination)) {
      newErrors.destination = "Please enter a valid XRPL address";
    }

    if (formData.destinationTag && isNaN(Number(formData.destinationTag))) {
      newErrors.destinationTag = "Destination tag must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendMPTPayment = async () => {
    if (!client || !account || !validateForm()) return;

    setIsLoading(true);
    try {
      const transaction: any = {
        TransactionType: "Payment",
        Account: account.address,
        Destination: formData.destination,
        Amount: {
          mpt_issuance_id: formData.mptIssuanceId,
          value: formData.amount,
        },
        DeliverMax: {
          mpt_issuance_id: formData.mptIssuanceId,
          value: formData.amount,
        },
        SendMax: {
          mpt_issuance_id: formData.mptIssuanceId,
          value: formData.amount,
        },
        Fee: "120",
        Flags: 0,
      };

      // Add optional fields if provided
      if (formData.destinationTag) {
        transaction.DestinationTag = parseInt(formData.destinationTag);
      }

      if (formData.invoiceId) {
        transaction.InvoiceID = formData.invoiceId;
      }

      const jsonString = JSON.stringify(transaction, null, 2);
      onTransactionCreated(jsonString);

      const autofilled = await client.autofill(transaction);
      const wallet = Wallet.fromSeed(account.secret);
      const signed = wallet.sign(autofilled);

      const result = await client.submitAndWait(signed.tx_blob);
      console.log("MPT Payment successful:", result);

      // Reset form
      setFormData({
        mptIssuanceId: "",
        amount: "",
        destination: "",
        destinationTag: "",
        invoiceId: "",
      });
    } catch (error) {
      console.error("Failed to send MPT payment:", error);
      setErrors({
        submit:
          "Failed to send MPT payment. Please check the console for details.",
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
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
          <Send className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Send MPT Payment</h2>
          <p className="text-gray-600">
            Send Multi-Purpose Tokens to other accounts
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
                Please select an account from the sidebar to send MPT payments.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MPT Issuance ID
              </label>
              <input
                type="text"
                value={formData.mptIssuanceId}
                onChange={(e) =>
                  updateFormData("mptIssuanceId", e.target.value)
                }
                className="input-field text-gray-700 w-full border border-gray-500 p-2"
                placeholder="Enter MPT Issuance ID..."
              />
              {errors.mptIssuanceId && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.mptIssuanceId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
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
                Destination Address
              </label>
              <select
                value={formData.destination}
                onChange={(e) => updateFormData("destination", e.target.value)}
                className="input-field text-gray-700 w-full border border-gray-500 p-2"
              >
                <option value="">Select destination account...</option>
                {accounts
                  .filter((acc) => acc.address !== account?.address)
                  .map((acc) => (
                    <option key={acc.address} value={acc.address}>
                      {acc.address}
                    </option>
                  ))}
              </select>
              {errors.destination && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.destination}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Tag (Optional)
              </label>
              <input
                type="text"
                value={formData.destinationTag}
                onChange={(e) =>
                  updateFormData("destinationTag", e.target.value)
                }
                className="input-field text-gray-700 w-full border border-gray-500 p-2"
                placeholder="12345"
              />
              {errors.destinationTag && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.destinationTag}
                </p>
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
            MPT Payment Information
          </h3>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Coins className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-800">
                    Direct MPT Transfer
                  </h4>
                  <p className="text-blue-700 text-sm mt-1">
                    MPTs can only be sent directly between accounts. They cannot
                    be traded on the decentralized exchange in version 1.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Required Fields:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>MPT Issuance ID - Identifies the specific MPT</li>
                <li>Amount - Number of tokens to send</li>
                <li>Destination - Recipient's XRPL address</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Optional Fields:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Destination Tag - For hosted wallet identification</li>
                <li>Invoice ID - For payment tracking</li>
              </ul>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> The recipient must be authorized to hold
                this MPT if the token requires authorization.
              </p>
            </div>
          </div>

          <button
            onClick={sendMPTPayment}
            disabled={!account || isLoading || Object.keys(errors).length > 0}
            className="w-full mt-6 btn-primary text-white flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 px-4 py-2 rounded-full cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send MPT Payment</span>
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

export default MPTPayment;
