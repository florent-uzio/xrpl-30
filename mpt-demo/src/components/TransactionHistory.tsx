import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Copy,
  CheckCircle,
  Clock,
  User,
  Hash,
  Filter,
  Search,
  ExternalLink,
} from "lucide-react";
import TransactionTracker, {
  type TransactionRecord,
} from "../utils/transactionTracker";

interface TransactionHistoryProps {
  // This will be populated by the App component
}

const TransactionHistory: React.FC<TransactionHistoryProps> = () => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionRecord[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Load transactions from tracker on component mount
  useEffect(() => {
    const tracker = TransactionTracker.getInstance();
    const initialTransactions = tracker.getTransactions();
    setTransactions(initialTransactions);
    setFilteredTransactions(initialTransactions);

    // Listen for transaction updates
    const handleTransactionUpdate = (event: CustomEvent) => {
      setTransactions(event.detail.transactions);
    };

    window.addEventListener(
      "transactionsUpdated",
      handleTransactionUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "transactionsUpdated",
        handleTransactionUpdate as EventListener
      );
    };
  }, []);

  // Filter transactions based on search term and type
  useEffect(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.transactionType === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.sourceAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.transactionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.hash.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filterType]);

  const copyToClipboard = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error("Failed to copy hash:", err);
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "MPTokenIssuanceCreate":
        return "🏗️";
      case "MPTokenAuthorize":
        return "🔐";
      case "MPTokenIssuanceDestroy":
        return "💥";
      case "Payment":
        return "💸";
      case "Clawback":
        return "🦀";
      case "MPTokenIssuanceSet":
        return "🔒";
      default:
        return "📄";
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "MPTokenIssuanceCreate":
        return "bg-blue-100 text-blue-800";
      case "MPTokenAuthorize":
        return "bg-green-100 text-green-800";
      case "MPTokenIssuanceDestroy":
        return "bg-red-100 text-red-800";
      case "Payment":
        return "bg-purple-100 text-purple-800";
      case "Clawback":
        return "bg-orange-100 text-orange-800";
      case "MPTokenIssuanceSet":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString();
  };

  const formatAccount = (account: string) => {
    return `${account.slice(0, 8)}...${account.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
  };

  const getUniqueTransactionTypes = () => {
    const types = [...new Set(transactions.map((tx) => tx.transactionType))];
    return types.sort();
  };

  const clearHistory = () => {
    if (
      window.confirm("Are you sure you want to clear all transaction history?")
    ) {
      const tracker = TransactionTracker.getInstance();
      tracker.clearTransactions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
          <History className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Transaction History
          </h2>
          <p className="text-gray-600">
            View and manage all XRPL transactions from this session
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full border border-gray-300 p-2 text-gray-900"
              />
            </div>

            {/* Filter by type */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field pl-10 pr-8 border border-gray-300 p-2 text-gray-400"
              >
                <option value="all">All Types</option>
                {getUniqueTransactionTypes().map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear history button */}
          {transactions.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* Transaction count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredTransactions.length} of {transactions.length}{" "}
          transactions
        </span>
        {transactions.length > 0 && (
          <span>
            Last transaction: {formatTimestamp(transactions[0].timestamp)}
          </span>
        )}
      </div>

      {/* Transactions list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card text-center py-12"
            >
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {transactions.length === 0
                  ? "No Transactions Yet"
                  : "No Matching Transactions"}
              </h3>
              <p className="text-gray-600">
                {transactions.length === 0
                  ? "Start by creating an MPT or sending a payment to see transaction history here."
                  : "Try adjusting your search terms or filters."}
              </p>
            </motion.div>
          ) : (
            filteredTransactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card hover:shadow-lg transition-shadow rounded-lg"
              >
                <div className="flex items-start justify-between p-2">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Transaction type icon */}
                    <div className="text-2xl">
                      {getTransactionTypeIcon(tx.transactionType)}
                    </div>

                    {/* Transaction details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(
                            tx.transactionType
                          )}`}
                        >
                          {tx.transactionType}
                        </span>
                        {tx.validated ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              Validated
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-yellow-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium">Pending</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <User className="w-4 h-4" />
                            <span className="font-medium">Source Account:</span>
                          </div>
                          <span className="font-mono text-gray-900">
                            {formatAccount(tx.sourceAccount)}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <Hash className="w-4 h-4" />
                            <span className="font-medium">
                              Transaction Hash:
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-gray-900">
                              {formatHash(tx.hash)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(tx.hash)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Copy hash to clipboard"
                            >
                              {copiedHash === tx.hash ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        {formatTimestamp(tx.timestamp)}
                        {tx.ledgerIndex && (
                          <span className="ml-2">
                            • Ledger: {tx.ledgerIndex}
                          </span>
                        )}
                        {tx.fee && (
                          <span className="ml-2">• Fee: {tx.fee} drops</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* External link button */}
                  <button
                    onClick={() =>
                      window.open(
                        `https://devnet.xrpl.org/transactions/${tx.hash}`,
                        "_blank"
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View on XRPL Explorer"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TransactionHistory;
