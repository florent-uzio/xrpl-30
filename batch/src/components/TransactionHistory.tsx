import React from "react";
import { FileText, CheckCircle, XCircle, Copy, Check } from "lucide-react";
import { useState } from "react";

interface TransactionRecord {
  hash: string;
  result: string;
  type: string;
  account: string;
  timestamp: Date;
}

interface TransactionHistoryProps {
  transactions: TransactionRecord[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getResultColor = (result: string) => {
    if (result === "tesSUCCESS") {
      return "text-green-600 bg-green-50";
    }
    if (result.startsWith("tem") || result.startsWith("tef") || result.startsWith("tel")) {
      return "text-red-600 bg-red-50";
    }
    return "text-yellow-600 bg-yellow-50";
  };

  if (transactions.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Transaction History
          </h2>
          <p className="text-gray-600">
            View all submitted transactions and their results
          </p>
        </div>
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Transactions
          </h3>
          <p className="text-gray-600">
            Transactions will appear here after submission
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Transaction History
        </h2>
        <p className="text-gray-600">
          View all submitted transactions and their results
        </p>
      </div>

      <div className="space-y-4">
        {transactions.map((tx) => (
          <div
            key={tx.hash}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {tx.result === "tesSUCCESS" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold text-gray-900">{tx.type}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${getResultColor(
                      tx.result
                    )}`}
                  >
                    {tx.result}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Account:</span>{" "}
                    {tx.account.slice(0, 8)}...{tx.account.slice(-6)}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span>{" "}
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(tx.hash)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy hash"
              >
                {copiedHash === tx.hash ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-500">Hash:</span>
                <code className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
                  {tx.hash}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;

