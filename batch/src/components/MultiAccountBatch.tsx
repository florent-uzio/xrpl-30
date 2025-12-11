import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Client,
  Wallet,
  convertStringToHex,
  signMultiBatch,
  combineBatchSigners,
  GlobalFlags,
} from "xrpl";
import {
  ArrowRightLeft,
  User,
  Info,
  AlertCircle,
  CheckCircle,
  Lock,
  Plus,
  Trash2,
  Play,
} from "lucide-react";

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

interface MultiAccountBatchProps {
  client: Client | null;
  accounts: Account[];
  createdTokens?: CreatedToken[];
  onTransactionCreated: (json: string) => void;
  onAccountUpdate: (account: Account) => void;
  onTransactionSubmitted?: (record: TransactionRecord) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface InnerTransaction {
  id: string;
  account: string; // Account address for this transaction
  paymentType: "XRP" | "MPT" | "IOU";
  destination: string;
  amount: string;
  // For IOU
  currency?: string;
  issuer?: string;
  // For MPT
  mptIssuanceId?: string;
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

type SigningStep = "setup" | "signing" | "submitted";

const MultiAccountBatch: React.FC<MultiAccountBatchProps> = ({
  client,
  accounts,
  createdTokens = [],
  onTransactionCreated,
  onAccountUpdate,
  onTransactionSubmitted,
  isLoading,
  setIsLoading,
}) => {
  const [batchSubmitter, setBatchSubmitter] = useState<Account | null>(null);
  const [batchFlag, setBatchFlag] = useState<number>(
    BATCH_FLAGS.tfAllOrNothing.value
  );
  const [innerTransactions, setInnerTransactions] = useState<
    InnerTransaction[]
  >([]);
  const [signingStep, setSigningStep] = useState<SigningStep>("setup");
  const [batchTransaction, setBatchTransaction] = useState<any>(null);
  const [accountsToSign, setAccountsToSign] = useState<Account[]>([]);
  const [currentSigningIndex, setCurrentSigningIndex] = useState(0);
  const [signedBatches, setSignedBatches] = useState<any[]>([]);
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
      account: "",
      paymentType: "XRP",
      destination: "",
      amount: "",
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

    if (!batchSubmitter) {
      newErrors.submitter = "Please select the Batch submitter account";
    }

    if (innerTransactions.length < 2) {
      newErrors.transactions = "At least 2 transactions are required";
    }

    if (innerTransactions.length > 8) {
      newErrors.transactions = "Maximum 8 transactions allowed";
    }

    innerTransactions.forEach((tx) => {
      if (!tx.account) {
        newErrors[`tx-${tx.id}-account`] = "Account is required";
      }
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
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildBatchTransaction = async () => {
    if (!client || !batchSubmitter || !validateBatch()) return;

    setIsLoading(true);
    try {
      const rawTransactions = [];
      const accountsNeedingSignatures = new Set<string>();

      // Build raw transactions and identify accounts that need to sign
      for (let i = 0; i < innerTransactions.length; i++) {
        const tx = innerTransactions[i];
        const txAccount = accounts.find((a) => a.address === tx.account);
        if (!txAccount) continue;

        const rawTx: any = {
          TransactionType: "Payment",
          Account: tx.account,
          Destination: tx.destination,
          Flags: GlobalFlags.tfInnerBatchTxn,
        };

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
          rawTx.Amount = (parseFloat(tx.amount) * 1000000).toString();
        }

        rawTransactions.push({ RawTransaction: rawTx });

        // If this account is not the submitter, it needs to sign
        if (tx.account !== batchSubmitter.address) {
          accountsNeedingSignatures.add(tx.account);
        }
      }

      const batchTx = {
        TransactionType: "Batch",
        Account: batchSubmitter.address,
        Flags: batchFlag,
        RawTransactions: rawTransactions,
      };

      // Set up accounts that need to sign
      const accountsToSignList = Array.from(accountsNeedingSignatures).map(
        (addr) => accounts.find((a) => a.address === addr)!
      );
      setAccountsToSign(accountsToSignList);
      setCurrentSigningIndex(0);

      if (accountsToSignList.length > 0) {
        setSigningStep("signing");
        // Autofill with number of signers
        const numSigners = accountsToSignList.length;
        const autofilledTxn = await client.autofill(batchTx as any, numSigners);
        setBatchTransaction(autofilledTxn);
        onTransactionCreated(JSON.stringify(autofilledTxn, null, 2));
      } else {
        // No other accounts need to sign, submit directly (single account batch)
        const autofilledTxn = await client.autofill(batchTx as any, 1);
        setBatchTransaction(autofilledTxn);

        const submitterWallet = Wallet.fromSeed(batchSubmitter.secret);
        const result = await client.submitAndWait(autofilledTxn, {
          wallet: submitterWallet,
          autofill: true,
        });

        const txResult =
          typeof result.result.meta === "object" && result.result.meta
            ? (result.result.meta as any).TransactionResult
            : "tesSUCCESS";

        if (onTransactionSubmitted) {
          onTransactionSubmitted({
            hash: result.result.hash || "",
            result: txResult,
            type: "Batch",
            account: batchSubmitter.address,
            timestamp: new Date(),
          });
        }

        setSigningStep("submitted");
        alert("Batch transaction submitted successfully!");

        // Refresh account balances
        const allAccounts = new Set([
          batchSubmitter.address,
          ...innerTransactions.map((tx) => tx.account),
        ]);

        for (const addr of allAccounts) {
          const acc = accounts.find((a) => a.address === addr);
          if (acc) {
            const accountInfo = await client.request({
              command: "account_info",
              account: addr,
            });
            const balance = accountInfo.result.account_data.Balance;
            onAccountUpdate({
              ...acc,
              balance: (parseInt(balance) / 1000000).toString(),
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to build batch transaction:", error);
      alert(`Failed to build batch: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const signWithAccount = async () => {
    if (!client || !batchTransaction || accountsToSign.length === 0) return;

    const accountToSign = accountsToSign[currentSigningIndex];
    if (!accountToSign) return;

    setIsLoading(true);
    try {
      // Create a copy of the batch transaction for this account (like wallet2Batch, wallet3Batch)
      const batchCopy = JSON.parse(JSON.stringify(batchTransaction));
      const wallet = Wallet.fromSeed(accountToSign.secret);

      // Use signMultiBatch to sign (modifies batchCopy in place)
      signMultiBatch(wallet, batchCopy);

      const newSignedBatches = [...signedBatches, batchCopy];
      setSignedBatches(newSignedBatches);

      // Move to next account or combine and submit
      if (currentSigningIndex < accountsToSign.length - 1) {
        setCurrentSigningIndex(currentSigningIndex + 1);
      } else {
        // All accounts signed, combine and submit
        await combineAndSubmit(newSignedBatches);
      }
    } catch (error: any) {
      console.error("Failed to sign with account:", error);
      alert(`Failed to sign: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const combineAndSubmit = async (signedBatchesList: any[]) => {
    if (!client || !batchSubmitter) return;

    try {
      // Combine all signed batches using combineBatchSigners
      const combinedSignedTx = combineBatchSigners(signedBatchesList);

      onTransactionCreated(JSON.stringify(combinedSignedTx, null, 2));

      // Submit with submitter wallet
      const submitterWallet = Wallet.fromSeed(batchSubmitter.secret);
      const result = await client.submitAndWait(combinedSignedTx, {
        wallet: submitterWallet,
        autofill: true,
      });

      const txResult =
        typeof result.result.meta === "object" && result.result.meta
          ? (result.result.meta as any).TransactionResult
          : "tesSUCCESS";

      if (onTransactionSubmitted) {
        onTransactionSubmitted({
          hash: result.result.hash || "",
          result: txResult,
          type: "Batch",
          account: batchSubmitter.address,
          timestamp: new Date(),
        });
      }

      setSigningStep("submitted");
      alert("Batch transaction submitted successfully!");

      // Refresh account balances
      const allAccounts = new Set([
        batchSubmitter.address,
        ...innerTransactions.map((tx) => tx.account),
      ]);

      for (const addr of allAccounts) {
        const acc = accounts.find((a) => a.address === addr);
        if (acc) {
          const accountInfo = await client.request({
            command: "account_info",
            account: addr,
          });
          const balance = accountInfo.result.account_data.Balance;
          onAccountUpdate({
            ...acc,
            balance: (parseInt(balance) / 1000000).toString(),
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to submit batch transaction:", error);
      alert(`Failed to submit: ${error.message || "Unknown error"}`);
    }
  };

  const resetBatch = () => {
    setSigningStep("setup");
    setBatchTransaction(null);
    setAccountsToSign([]);
    setCurrentSigningIndex(0);
    setSignedBatches([]);
  };

  const getAccountName = (address: string): string => {
    const acc = accounts.find((a) => a.address === address);
    if (!acc) return address;
    if (address === batchSubmitter?.address) return "Batch Submitter";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Multi-Account Batch
        </h2>
        <p className="text-gray-600">
          Create a batch transaction with multiple accounts. The submitter
          account submits the batch, and other accounts sign their transactions.
        </p>
      </div>

      {accounts.length < 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              You need at least 2 accounts. Generate them from the sidebar.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {signingStep === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Batch Submitter Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Submitter Account
              </label>
              <select
                value={batchSubmitter?.address || ""}
                onChange={(e) => {
                  const acc = accounts.find(
                    (a) => a.address === e.target.value
                  );
                  setBatchSubmitter(acc || null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Batch Submitter</option>
                {accounts.map((acc) => (
                  <option key={acc.address} value={acc.address}>
                    {acc.label ? `${acc.label} - ` : ""}
                    {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                  </option>
                ))}
              </select>
              {errors.submitter && (
                <p className="text-red-500 text-xs mt-1">{errors.submitter}</p>
              )}
            </div>

            {/* Batch Flag Selection */}
            <div>
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
                    <div className="text-xs text-gray-600">
                      {flag.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Inner Transactions */}
            <div>
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
                    <p className="text-red-800 text-sm">
                      {errors.transactions}
                    </p>
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
                          Account (for this transaction)
                        </label>
                        <select
                          value={tx.account}
                          onChange={(e) =>
                            updateTransaction(tx.id, {
                              account: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Account</option>
                          {accounts.map((acc) => (
                            <option key={acc.address} value={acc.address}>
                              {acc.label ? `${acc.label} - ` : ""}
                              {acc.address.slice(0, 8)}...
                              {acc.address.slice(-6)}
                            </option>
                          ))}
                        </select>
                        {errors[`tx-${tx.id}-account`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`tx-${tx.id}-account`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Payment Type
                        </label>
                        <select
                          value={tx.paymentType}
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
                          value={tx.destination}
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
                              .filter(
                                (t) => t.type === "MPT" && t.mptIssuanceId
                              )
                              .map((token) => (
                                <option
                                  key={token.id}
                                  value={token.mptIssuanceId}
                                >
                                  {token.currency} - {token.issuer.slice(0, 8)}
                                  ...
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
                          value={tx.amount}
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
                    </div>
                  </motion.div>
                ))}
              </div>

              {innerTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>
                    No transactions added yet. Click "Add Transaction" to get
                    started.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={buildBatchTransaction}
              disabled={
                isLoading || !batchSubmitter || innerTransactions.length < 2
              }
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Build Batch Transaction</span>
            </button>
          </motion.div>
        )}

        {signingStep === "signing" && accountsToSign.length > 0 && (
          <motion.div
            key="signing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Sign Transaction ({currentSigningIndex + 1} of{" "}
                  {accountsToSign.length})
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                Account{" "}
                <strong>
                  {getAccountName(accountsToSign[currentSigningIndex].address)}
                </strong>{" "}
                needs to sign its transaction in the batch.
              </p>
              <div className="bg-white p-4 rounded-lg mb-4">
                <p className="text-sm font-mono text-gray-600 break-all">
                  {accountsToSign[currentSigningIndex].address}
                </p>
              </div>
              <button
                onClick={signWithAccount}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Lock className="w-5 h-5" />
                <span>
                  {currentSigningIndex < accountsToSign.length - 1
                    ? "Sign & Continue"
                    : "Sign & Submit"}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {signingStep === "submitted" && (
          <motion.div
            key="submitted"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Batch Transaction Submitted!
            </h3>
            <p className="text-gray-600 mb-6">
              The batch transaction has been successfully submitted to the XRPL.
            </p>
            <button
              onClick={resetBatch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Batch
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiAccountBatch;
