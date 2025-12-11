import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Client,
  Wallet,
  signMultiBatch,
  combineBatchSigners,
  BatchFlags,
  GlobalFlags,
} from "xrpl";
import {
  Play,
  CheckCircle,
  Users,
  FileText,
  Lock,
  Merge,
} from "lucide-react";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
  ious: any[];
}

interface BatchVisualizerProps {
  client: Client | null;
  accounts: Account[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

type VisualizationStep =
  | "setup"
  | "build"
  | "autofill"
  | "signing"
  | "combine"
  | "submit"
  | "complete";

const BatchVisualizer: React.FC<BatchVisualizerProps> = ({
  client,
  accounts,
  isLoading,
  setIsLoading,
}) => {
  const [batchType, setBatchType] = useState<"single" | "multi">("multi");
  const [batchSubmitter, setBatchSubmitter] = useState<Account | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
  const [step, setStep] = useState<VisualizationStep>("setup");
  const [batchTransaction, setBatchTransaction] = useState<any>(null);
  const [signedBatches, setSignedBatches] = useState<any[]>([]);
  const [combinedBatch, setCombinedBatch] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const createExampleBatch = () => {
    if (!batchSubmitter || selectedAccounts.length < 1) return null;

    const rawTransactions = selectedAccounts.map((acc, index) => ({
      RawTransaction: {
        TransactionType: "Payment",
        Account: acc.address,
        Destination:
          selectedAccounts[(index + 1) % selectedAccounts.length].address,
        Amount: "1000000", // 1 XRP in drops
        Flags: GlobalFlags.tfInnerBatchTxn,
      },
    }));

    return {
      TransactionType: "Batch",
      Account: batchSubmitter.address,
      Flags: BatchFlags.tfAllOrNothing,
      RawTransactions: rawTransactions,
    };
  };

  const visualizeFlow = async () => {
    if (!client || !batchSubmitter || selectedAccounts.length < 1) return;

    setIsLoading(true);
    setStep("build");

    try {
      // Step 1: Build batch transaction
      const batchTxn = createExampleBatch();
      if (!batchTxn) return;

      setBatchTransaction(batchTxn);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Autofill
      setStep("autofill");
      const numSigners = batchType === "single" ? 1 : selectedAccounts.length;
      const autofilledTxn = await client.autofill(batchTxn as any, numSigners);
      setBatchTransaction(autofilledTxn);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 3: Sign with each account (matching your code pattern)
      setStep("signing");
      const signedBatchesList: any[] = [];

      // Create copies for each signer (like wallet2Batch, wallet3Batch in your code)
      for (const account of selectedAccounts) {
        const wallet = Wallet.fromSeed(account.secret);
        const batchCopy = JSON.parse(JSON.stringify(autofilledTxn));
        // signMultiBatch modifies the batchCopy in place
        signMultiBatch(wallet, batchCopy);
        signedBatchesList.push(batchCopy);
        setSignedBatches([...signedBatchesList]);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Step 4: Combine signatures (like combineBatchSigners in your code)
      setStep("combine");
      const combined = combineBatchSigners(signedBatchesList);
      setCombinedBatch(combined);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 5: Submit (submitter signs and submits)
      setStep("submit");
      const submitterWallet = Wallet.fromSeed(batchSubmitter.secret);
      const submitResult = await client.submitAndWait(combined, {
        wallet: submitterWallet,
        autofill: true,
      });
      setResult(submitResult);
      setStep("complete");
    } catch (error: any) {
      console.error("Visualization error:", error);
      alert(`Error: ${error.message || "Unknown error"}`);
      setStep("setup");
    } finally {
      setIsLoading(false);
    }
  };

  const resetVisualization = () => {
    setStep("setup");
    setBatchTransaction(null);
    setSignedBatches([]);
    setCombinedBatch(null);
    setResult(null);
  };

  const getStepIcon = (stepName: VisualizationStep, currentStep: VisualizationStep) => {
    const isActive = stepName === currentStep;
    const isComplete =
      [
        "build",
        "autofill",
        "signing",
        "combine",
        "submit",
        "complete",
      ].indexOf(stepName) <
      [
        "build",
        "autofill",
        "signing",
        "combine",
        "submit",
        "complete",
      ].indexOf(currentStep);

    if (isComplete) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    }
    if (isActive) {
      return <div className="w-6 h-6 rounded-full bg-blue-600 animate-pulse" />;
    }
    return <div className="w-6 h-6 rounded-full bg-gray-300" />;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Batch Transaction Flow Visualizer
        </h2>
        <p className="text-gray-600">
          Visualize the batch transaction signing flow using signMultiBatch and
          combineBatchSigners
        </p>
      </div>

      {step === "setup" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Type
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setBatchType("single")}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  batchType === "single"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold">Single Account</div>
                <div className="text-xs text-gray-600 mt-1">
                  One account signs all transactions
                </div>
              </button>
              <button
                onClick={() => setBatchType("multi")}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  batchType === "multi"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold">Multi Account</div>
                <div className="text-xs text-gray-600 mt-1">
                  Multiple accounts sign their transactions
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Submitter
            </label>
            <select
              value={batchSubmitter?.address || ""}
              onChange={(e) => {
                const acc = accounts.find((a) => a.address === e.target.value);
                setBatchSubmitter(acc || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Batch Submitter</option>
              {accounts.map((acc) => (
                <option key={acc.address} value={acc.address}>
                  {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accounts to Sign ({batchType === "single" ? "1" : "2-8"})
            </label>
            <div className="space-y-2">
              {accounts.map((acc) => (
                <label
                  key={acc.address}
                  className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccounts.some((a) => a.address === acc.address)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (batchType === "single") {
                          setSelectedAccounts([acc]);
                        } else {
                          setSelectedAccounts([...selectedAccounts, acc]);
                        }
                      } else {
                        setSelectedAccounts(
                          selectedAccounts.filter((a) => a.address !== acc.address)
                        );
                      }
                    }}
                    disabled={
                      batchType === "single" &&
                      selectedAccounts.length === 1 &&
                      !selectedAccounts.some((a) => a.address === acc.address)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-mono">
                    {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={visualizeFlow}
            disabled={
              isLoading ||
              !batchSubmitter ||
              selectedAccounts.length < 1 ||
              (batchType === "multi" && selectedAccounts.length < 2)
            }
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Start Visualization</span>
          </button>
        </div>
      )}

      {step !== "setup" && (
        <div className="space-y-6">
          {/* Flow Steps */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Flow Steps</h3>
              <div className="space-y-4">
                {[
                  {
                    name: "build",
                    label: "1. Build Batch Transaction",
                    description: "Create batch with RawTransactions",
                  },
                  {
                    name: "autofill",
                    label: "2. Autofill (with signer count)",
                    description: `client.autofill(batchTxn, ${selectedAccounts.length})`,
                  },
                  {
                    name: "signing",
                    label: "3. Sign with signMultiBatch",
                    description: "Each account signs their copy of the batch",
                  },
                  {
                    name: "combine",
                    label: "4. Combine with combineBatchSigners",
                    description: "Merge all signatures into one batch",
                  },
                  {
                    name: "submit",
                    label: "5. Submit Transaction",
                    description: "Submitter signs and submits to ledger",
                  },
                  {
                    name: "complete",
                    label: "6. Complete",
                    description: "Transaction validated",
                  },
                ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50"
                >
                  {getStepIcon(s.name as VisualizationStep, step)}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 block">
                      {s.label}
                    </span>
                    {s.description && (
                      <span className="text-xs text-gray-600 mt-1 block">
                        {s.description}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Batch Transaction Structure */}
          {batchTransaction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Batch Transaction</span>
                </h3>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {step === "autofill" ? "Autofilled" : "Built"}
                </span>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                {JSON.stringify(batchTransaction, null, 2)}
              </pre>
            </motion.div>
          )}

          {/* Signed Batches */}
          {signedBatches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Signed Batches ({signedBatches.length})</span>
                </h3>
              </div>
              <div className="space-y-3">
                {signedBatches.map((signed, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold">
                        Signed by: {selectedAccounts[index]?.address.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="font-mono">
                        signMultiBatch(wallet, batchCopy)
                      </div>
                      <div>
                        BatchSigners: {signed.BatchSigners?.length || 0} signer(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Combined Batch */}
          {combinedBatch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Merge className="w-5 h-5" />
                  <span>Combined Batch (combineBatchSigners)</span>
                </h3>
              </div>
              <div className="mb-3 text-sm text-gray-600 space-y-1">
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    combineBatchSigners([batch1, batch2, ...])
                  </code>
                </div>
                <div>
                  All signatures combined into single batch transaction ready for
                  submission
                </div>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                {JSON.stringify(combinedBatch, null, 2)}
              </pre>
            </motion.div>
          )}

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border-2 border-green-200 rounded-lg p-6"
            >
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Transaction Submitted
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Hash:</span>{" "}
                  <code className="font-mono bg-white px-2 py-1 rounded">
                    {result.result.hash}
                  </code>
                </div>
                <div>
                  <span className="font-semibold">Result:</span>{" "}
                  <span className="text-green-700 font-semibold">
                    {typeof result.result.meta === "object" && result.result.meta
                      ? (result.result.meta as any).TransactionResult
                      : "tesSUCCESS"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <button
            onClick={resetVisualization}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset Visualization
          </button>
        </div>
      )}
    </div>
  );
};

export default BatchVisualizer;

