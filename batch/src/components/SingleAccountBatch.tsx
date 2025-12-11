import React, { useState } from "react";
import { motion } from "framer-motion";
import { Client, Wallet, convertStringToHex, GlobalFlags } from "xrpl";
import { Plus, Trash2, Send, Info, Play, AlertCircle } from "lucide-react";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
  ious: any[];
  label?: string;
}

interface TransactionRecord {
  hash: string;
  result: string;
  type: string;
  account: string;
  timestamp: Date;
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

interface SingleAccountBatchProps {
  client: Client | null;
  account: Account | null;
  accounts: Account[];
  createdTokens?: CreatedToken[];
  onTransactionCreated: (json: string) => void;
  onTransactionSubmitted?: (record: TransactionRecord) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SingleAccountBatch: React.FC<SingleAccountBatchProps> = ({
  client,
  account,
  accounts: _accounts,
  createdTokens = [],
  onTransactionCreated,
  onTransactionSubmitted,
  isLoading,
  setIsLoading,
}) => {
  interface InnerTransaction {
    id: string;
    type: "Payment" | "OfferCreate" | "TrustSet";
    paymentType?: "XRP" | "MPT" | "IOU"; // For Payment type
    destination?: string;
    amount?: string;
    currency?: string;
    issuer?: string;
    mptIssuanceId?: string; // For MPT
    sequence: number;
  }

  const BATCH_FLAGS = {
    tfAllOrNothing: {
      value: 65536,
      name: "All or Nothing",
      description: "All transactions must succeed or the whole batch fails",
    },
    tfOnlyOne: {
      value: 131072,
      name: "Only One",
      description: "Only the first successful transaction is applied",
    },
    tfUntilFailure: {
      value: 262144,
      name: "Until Failure",
      description: "All transactions are applied until the first failure",
    },
    tfIndependent: {
      value: 524288,
      name: "Independent",
      description: "All transactions will be applied, regardless of failure",
    },
  };

  const [batchFlag, setBatchFlag] = useState<number>(
    BATCH_FLAGS.tfAllOrNothing.value
  );
  const [innerTransactions, setInnerTransactions] = useState<
    InnerTransaction[]
  >([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const encodeCurrency = (currency: string): string => {
    if (!currency) return "";
    if (currency.length <= 3) {
      return currency.padEnd(3, "\0");
    }
    return convertStringToHex(currency).padEnd(40, "0");
  };

  const addTransaction = () => {
    const newTx: InnerTransaction = {
      id: Date.now().toString(),
      type: "Payment",
      paymentType: "XRP",
      destination: "",
      amount: "",
      sequence: innerTransactions.length + 1,
    };
    setInnerTransactions([...innerTransactions, newTx]);
  };

  const removeTransaction = (id: string) => {
    setInnerTransactions(innerTransactions.filter((tx) => tx.id !== id));
  };

  const updateTransaction = (
    id: string,
    updates: Partial<InnerTransaction>
  ) => {
    setInnerTransactions(
      innerTransactions.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  };

  const validateBatch = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!account) {
      newErrors.account = "Please select an account first";
    }

    if (innerTransactions.length < 2) {
      newErrors.transactions = "At least 2 transactions are required";
    }

    if (innerTransactions.length > 8) {
      newErrors.transactions = "Maximum 8 transactions allowed";
    }

    innerTransactions.forEach((tx) => {
      if (tx.type === "Payment") {
        if (!tx.destination) {
          newErrors[`tx-${tx.id}-destination`] = "Destination is required";
        }
        if (!tx.amount || parseFloat(tx.amount) <= 0) {
          newErrors[`tx-${tx.id}-amount`] = "Valid amount is required";
        }
        if (tx.paymentType === "IOU") {
          if (!tx.currency) {
            newErrors[`tx-${tx.id}-currency`] = "Currency is required for IOU";
          }
          if (!tx.issuer) {
            newErrors[`tx-${tx.id}-issuer`] = "Issuer is required for IOU";
          }
        }
        if (tx.paymentType === "MPT") {
          if (!tx.mptIssuanceId) {
            newErrors[`tx-${tx.id}-mptIssuanceId`] =
              "MPT Issuance ID is required for MPT";
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildBatchTransaction = async () => {
    if (!client || !account || !validateBatch()) return;

    setIsLoading(true);
    try {
      const rawTransactions = [];

      for (let i = 0; i < innerTransactions.length; i++) {
        const tx = innerTransactions[i];
        let rawTx: any = {
          TransactionType: tx.type,
          Account: account.address,
          Flags: GlobalFlags.tfInnerBatchTxn,
        };

        if (tx.type === "Payment") {
          rawTx.Destination = tx.destination;

          if (tx.paymentType === "MPT" && tx.mptIssuanceId) {
            // MPT Payment
            rawTx.Amount = {
              mpt_issuance_id: tx.mptIssuanceId,
              value: tx.amount,
            };
          } else if (tx.paymentType === "IOU" && tx.currency && tx.issuer) {
            // IOU Payment
            const encodedCurrency = encodeCurrency(tx.currency);
            rawTx.Amount = {
              currency: encodedCurrency,
              issuer: tx.issuer,
              value: tx.amount,
            };
          } else {
            // XRP in drops
            rawTx.Amount = (parseFloat(tx.amount || "0") * 1000000).toString();
          }
        }

        rawTransactions.push({
          RawTransaction: rawTx,
        });
      }

      const batchTransaction = {
        TransactionType: "Batch",
        Account: account.address,
        Flags: batchFlag,
        RawTransactions: rawTransactions,
        Fee: "40", // Base fee for batch
      };

      const jsonString = JSON.stringify(batchTransaction, null, 2);
      onTransactionCreated(jsonString);

      // Auto-fill and sign (1 signer for single account batch)
      const autofilled = await client.autofill(batchTransaction as any, 1);
      const wallet = Wallet.fromSeed(account.secret);
      const signed = wallet.sign(autofilled);

      const result = await client.submitAndWait(signed.tx_blob);
      console.log("Batch transaction submitted:", result);

      const txResult =
        typeof result.result.meta === "object" && result.result.meta
          ? (result.result.meta as any).TransactionResult
          : "tesSUCCESS";

      if (onTransactionSubmitted && account) {
        onTransactionSubmitted({
          hash: result.result.hash || "",
          result: txResult,
          type: "Batch",
          account: account.address,
          timestamp: new Date(),
        });
      }

      alert("Batch transaction submitted successfully!");

      // Clear transactions
      setInnerTransactions([]);
    } catch (error: any) {
      console.error("Failed to submit batch transaction:", error);
      alert(`Failed to submit batch: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Single Account Batch
        </h2>
        <p className="text-gray-600">
          Create a batch transaction from a single account with multiple inner
          transactions
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

      {/* Batch Flag Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Batch Mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(BATCH_FLAGS).map(([key, flag]) => (
            <button
              key={key}
              onClick={() => setBatchFlag(flag.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                batchFlag === flag.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-gray-900 mb-1">
                {flag.name}
              </div>
              <div className="text-xs text-gray-600">{flag.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Inner Transactions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Inner Transactions (2-8 required)
          </label>
          <button
            onClick={addTransaction}
            disabled={innerTransactions.length >= 8}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>

        {errors.transactions && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-800 text-sm">{errors.transactions}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {innerTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  Transaction {index + 1}
                </span>
                <button
                  onClick={() => removeTransaction(tx.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={tx.type}
                    onChange={(e) =>
                      updateTransaction(tx.id, {
                        type: e.target.value as
                          | "Payment"
                          | "OfferCreate"
                          | "TrustSet",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Payment">Payment</option>
                    <option disabled value="OfferCreate">
                      Offer Create
                    </option>
                    <option disabled value="TrustSet">
                      Trust Set
                    </option>
                  </select>
                </div>

                {tx.type === "Payment" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Payment Type
                      </label>
                      <select
                        value={tx.paymentType || "XRP"}
                        onChange={(e) =>
                          updateTransaction(tx.id, {
                            paymentType: e.target.value as
                              | "XRP"
                              | "MPT"
                              | "IOU",
                            currency: undefined,
                            issuer: undefined,
                            mptIssuanceId: undefined,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="XRP">XRP</option>
                        <option value="MPT">MPT</option>
                        <option value="IOU">IOU</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Destination
                      </label>
                      <input
                        type="text"
                        value={tx.destination || ""}
                        onChange={(e) =>
                          updateTransaction(tx.id, {
                            destination: e.target.value,
                          })
                        }
                        placeholder="r..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      {errors[`tx-${tx.id}-destination`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`tx-${tx.id}-destination`]}
                        </p>
                      )}
                    </div>

                    {tx.paymentType === "IOU" && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Currency
                          </label>
                          <input
                            type="text"
                            value={tx.currency || ""}
                            onChange={(e) =>
                              updateTransaction(tx.id, {
                                currency: e.target.value,
                              })
                            }
                            placeholder="RLUSD"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                          {errors[`tx-${tx.id}-currency`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`tx-${tx.id}-currency`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Issuer
                          </label>
                          <input
                            type="text"
                            value={tx.issuer || ""}
                            onChange={(e) =>
                              updateTransaction(tx.id, {
                                issuer: e.target.value,
                              })
                            }
                            placeholder="r..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                          {errors[`tx-${tx.id}-issuer`] && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors[`tx-${tx.id}-issuer`]}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {tx.paymentType === "MPT" && (
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          MPT Token
                        </label>
                        <select
                          value={tx.mptIssuanceId || ""}
                          onChange={(e) =>
                            updateTransaction(tx.id, {
                              mptIssuanceId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select MPT Token</option>
                          {createdTokens
                            .filter((t) => t.type === "MPT" && t.mptIssuanceId)
                            .map((token) => (
                              <option
                                key={token.id}
                                value={token.mptIssuanceId}
                              >
                                {token.currency} - {token.issuer.slice(0, 8)}...
                              </option>
                            ))}
                        </select>
                        {errors[`tx-${tx.id}-mptIssuanceId`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`tx-${tx.id}-mptIssuanceId`]}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <input
                        type="text"
                        value={tx.amount || ""}
                        onChange={(e) =>
                          updateTransaction(tx.id, { amount: e.target.value })
                        }
                        placeholder={
                          tx.paymentType === "XRP"
                            ? "1000000 (drops) or 1.0"
                            : "1000"
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      {errors[`tx-${tx.id}-amount`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`tx-${tx.id}-amount`]}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {innerTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              No transactions added yet. Click "Add Transaction" to get started.
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={buildBatchTransaction}
        disabled={isLoading || !account || innerTransactions.length < 2}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        <Play className="w-5 h-5" />
        <span>Submit Batch Transaction</span>
      </button>
    </div>
  );
};

export default SingleAccountBatch;
