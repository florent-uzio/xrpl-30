import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
} from "lucide-react";
import { useState } from "react";

interface Transaction {
  hash: string;
  type: string;
  result: string;
  timestamp: Date;
  account: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.account.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "success" && tx.result === "tesSUCCESS") ||
      (filter === "failed" && tx.result !== "tesSUCCESS");

    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (result: string) => {
    if (result === "tesSUCCESS") {
      return <CheckCircle2 className="w-5 h-5 text-cyber-green" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (result: string) => {
    if (result === "tesSUCCESS") {
      return "text-cyber-green";
    }
    return "text-red-500";
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  if (transactions.length === 0) {
    return (
      <div className="cyber-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyber-blue/10 flex items-center justify-center">
          <History className="w-8 h-8 text-cyber-blue/50" />
        </div>
        <h3 className="text-lg font-display font-medium text-gray-300 mb-2">
          No Transactions Yet
        </h3>
        <p className="text-sm text-gray-500 font-display max-w-sm mx-auto">
          Your transaction history will appear here once you start creating vaults
          and performing operations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-gray-200 mb-2">
          Transaction History
        </h2>
        <p className="text-sm text-gray-500 font-display">
          {filteredTransactions.length} of {transactions.length} transactions
        </p>
      </div>

      {/* Filters */}
      <div className="cyber-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by hash, type, or account..."
                className="cyber-input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(["all", "success", "failed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-display text-sm transition-all capitalize ${
                  filter === f
                    ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50"
                    : "bg-cyber-darker/50 text-gray-400 border border-cyber-blue/20 hover:border-cyber-blue/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="cyber-card p-12 text-center">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p className="text-sm text-gray-400 font-display">
            No transactions match your filters
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.02 }}
                className="cyber-card p-4 hover:scale-[1.01] transition-transform"
              >
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(tx.result)}
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-display font-semibold text-gray-200">
                            {tx.type}
                          </span>
                          <span
                            className={`text-xs font-display ${getStatusColor(tx.result)}`}
                          >
                            {tx.result}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-display">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(tx.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 font-display mb-1">
                          Transaction Hash
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-display text-gray-400 mono-text break-all">
                            {tx.hash}
                          </code>
                          <a
                            href={`https://devnet.xrpl.org/transactions/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 p-1 hover:bg-cyber-blue/10 rounded transition-colors"
                            title="View on explorer"
                          >
                            <ExternalLink className="w-3 h-3 text-cyber-blue" />
                          </a>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 font-display mb-1">
                          Account
                        </div>
                        <code className="text-xs font-display text-gray-400 mono-text break-all">
                          {tx.account}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
