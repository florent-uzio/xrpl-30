import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Client } from "xrpl";
import {
  Layers,
  ArrowRightLeft,
  Settings,
  FileText,
  Send,
  Shield,
  Link,
} from "lucide-react";

// Components
import AccountManager from "./components/AccountManager";
import TokenIssuer from "./components/TokenIssuer";
import SingleAccountBatch from "./components/SingleAccountBatch";
import MultiAccountBatch from "./components/MultiAccountBatch";
import TransactionViewer from "./components/TransactionViewer";
import Payment from "./components/Payment";
import TransactionHistory from "./components/TransactionHistory";
import TokenList from "./components/TokenList";
import MPTokenAuthorize from "./components/MPTokenAuthorize";
import TrustSet from "./components/TrustSet";

// Types
interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
  ious: any[];
  label?: string;
}

interface CreatedToken {
  id: string;
  type: "MPT" | "IOU";
  issuer: string;
  currency: string;
  name?: string;
  createdAt: Date;
  mptIssuanceId?: string; // For MPT
}

interface TransactionRecord {
  hash: string;
  result: string;
  type: string;
  account: string;
  timestamp: Date;
}

const DEVNET_URL = "wss://s.devnet.rippletest.net:51233";

function App() {
  const [client, setClient] = useState<Client | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "tokens"
    | "payment"
    | "authorize"
    | "trustset"
    | "single"
    | "multi"
    | "transactions"
  >("tokens");
  const [isConnected, setIsConnected] = useState(false);
  const [transactionJson, setTransactionJson] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdTokens, setCreatedTokens] = useState<CreatedToken[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<
    TransactionRecord[]
  >([]);

  // Initialize XRPL client
  useEffect(() => {
    const initClient = async () => {
      try {
        const xrplClient = new Client(DEVNET_URL);
        await xrplClient.connect();
        setClient(xrplClient);
        setIsConnected(true);
        console.log("Connected to XRPL Devnet");
      } catch (error) {
        console.error("Failed to connect to XRPL:", error);
      }
    };

    initClient();

    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, []);

  // Check regularly connection status
  const handleConnection = async () => {
    if (client) {
      const isConnected = client.isConnected();
      console.log("isConnected", isConnected);
      setIsConnected(isConnected);
      if (!isConnected) {
        await client.connect();
        setIsConnected(true);
      }
    }
  };

  const addAccount = (account: Account) => {
    setAccounts((prev) => [...prev, account]);
    if (!selectedAccount) {
      setSelectedAccount(account);
    }
  };

  const updateAccount = (updatedAccount: Account) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.address === updatedAccount.address ? updatedAccount : acc
      )
    );
    if (selectedAccount?.address === updatedAccount.address) {
      setSelectedAccount(updatedAccount);
    }
  };

  const handleTransactionCreated = (json: string) => {
    setTransactionJson(json);
  };

  const handleTokenCreated = (token: CreatedToken) => {
    setCreatedTokens((prev) => [...prev, token]);
  };

  const handleTransactionSubmitted = (record: TransactionRecord) => {
    setTransactionHistory((prev) => [record, ...prev]);
  };

  const tabs = [
    { id: "tokens", label: "Issue Tokens", icon: Layers },
    { id: "payment", label: "Payment", icon: Send },
    { id: "trustset", label: "Trust Line", icon: Link },
    { id: "authorize", label: "MPT Authorize", icon: Shield },
    { id: "single", label: "Single Account Batch", icon: Settings },
    { id: "multi", label: "Multi Account Batch", icon: ArrowRightLeft },
    { id: "transactions", label: "Transactions", icon: FileText },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <h1 className="text-sm md:text-xl font-bold text-gray-900">
                XRPL Batch Transaction Demo
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleConnection}
                className="px-3 py-1 rounded-full text-xs md:text-sm border cursor-pointer hidden md:block"
              >
                Refresh connection status
              </button>

              <div
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  isConnected
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-4"
          >
            <AccountManager
              client={client}
              accounts={accounts}
              selectedAccount={selectedAccount}
              onAccountSelect={setSelectedAccount}
              onAccountAdd={addAccount}
              onAccountUpdate={updateAccount}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
            <TokenList tokens={createdTokens} />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === "tokens" && (
                    <motion.div
                      key="tokens"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TokenIssuer
                        client={client}
                        account={selectedAccount}
                        accounts={accounts}
                        onTransactionCreated={handleTransactionCreated}
                        onAccountUpdate={updateAccount}
                        onTokenCreated={handleTokenCreated}
                        onTransactionSubmitted={handleTransactionSubmitted}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                      />
                    </motion.div>
                  )}

                  {activeTab === "single" && (
                    <motion.div
                      key="single"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SingleAccountBatch
                        client={client}
                        account={selectedAccount}
                        accounts={accounts}
                        createdTokens={createdTokens}
                        onTransactionCreated={handleTransactionCreated}
                        onTransactionSubmitted={handleTransactionSubmitted}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                      />
                    </motion.div>
                  )}

                  {activeTab === "multi" && (
                    <motion.div
                      key="multi"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MultiAccountBatch
                        client={client}
                        accounts={accounts}
                        createdTokens={createdTokens}
                        onTransactionCreated={handleTransactionCreated}
                        onAccountUpdate={updateAccount}
                        onTransactionSubmitted={handleTransactionSubmitted}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                      />
                    </motion.div>
                  )}

                  {activeTab === "payment" && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Payment
                        client={client}
                        account={selectedAccount}
                        accounts={accounts}
                        createdTokens={createdTokens}
                        onTransactionSubmitted={handleTransactionSubmitted}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                      />
                    </motion.div>
                  )}

                  {activeTab === "trustset" && (
                    <motion.div
                      key="trustset"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TrustSet
                        client={client}
                        account={selectedAccount}
                        accounts={accounts}
                        createdTokens={createdTokens}
                        onTransactionSubmitted={handleTransactionSubmitted}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                      />
                    </motion.div>
                  )}

                  {activeTab === "authorize" && (
                    <motion.div
                      key="authorize"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MPTokenAuthorize
                        client={client}
                        account={selectedAccount}
                        accounts={accounts}
                        createdTokens={createdTokens}
                        onTransactionSubmitted={handleTransactionSubmitted}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                      />
                    </motion.div>
                  )}

                  {activeTab === "transactions" && (
                    <motion.div
                      key="transactions"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TransactionHistory transactions={transactionHistory} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Transaction JSON Viewer - Only show for non-tokens and non-trustset tabs */}
            {transactionJson &&
              activeTab !== "tokens" &&
              activeTab !== "transactions" &&
              activeTab !== "trustset" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                >
                  <TransactionViewer json={transactionJson} />
                </motion.div>
              )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default App;
