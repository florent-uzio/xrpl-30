import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Client } from "xrpl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Vault,
  Coins,
  History,
  Menu,
  X,
  Zap,
  Copy,
  Check,
} from "lucide-react";
import { type XRPLAccount } from "./types/account";
import { createClient, DEVNET_URL } from "./utils/xrpl";
import {
  loadAccounts,
  saveAccounts,
  removeAccount as removeAccountFromStorage,
} from "./utils/storage";
import { AccountManager } from "./components/AccountManager";
import { AccountSelector } from "./components/AccountSelector";
import { AccountList } from "./components/AccountList";
import { updateAccountLabel } from "./utils/storage";
import { VaultCreate } from "./components/VaultCreate";
import { VaultList } from "./components/VaultList";
import { VaultDetail } from "./components/VaultDetail";
import { VaultSet } from "./components/VaultSet";
import { VaultDeposit } from "./components/VaultDeposit";
import { LoanManager } from "./components/LoanManager";
import { TransactionHistory } from "./components/TransactionHistory";

type NavigationTab =
  | "vaults"
  | "create-vault"
  | "loans"
  | "history";

interface Transaction {
  hash: string;
  type: string;
  result: string;
  timestamp: Date;
  account: string;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [client] = useState<Client>(() => createClient());
  const [accounts, setAccounts] = useState<XRPLAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<XRPLAccount | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  // Determine active tab from current route
  const getActiveTab = (): NavigationTab => {
    const path = location.pathname;
    if (path.startsWith("/vaults")) return "vaults";
    if (path === "/create-vault") return "create-vault";
    if (path === "/loans") return "loans";
    if (path === "/history") return "history";
    return "create-vault";
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    // Load accounts from localStorage
    const savedAccounts = loadAccounts();
    setAccounts(savedAccounts);
    if (savedAccounts.length > 0) {
      setSelectedAccount(savedAccounts[0]);
    }

    // Connect to XRPL
    const connectClient = async () => {
      try {
        await client.connect();
        setIsConnected(true);
      } catch (err) {
        console.error("Failed to connect:", err);
      }
    };

    connectClient();

    return () => {
      client.disconnect();
    };
  }, [client]);

  const handleAccountCreated = (account: XRPLAccount) => {
    const updatedAccounts = [...accounts, account];
    setAccounts(updatedAccounts);
    saveAccounts(updatedAccounts);

    if (!selectedAccount) {
      setSelectedAccount(account);
    }
  };

  const handleDeleteAccount = (address: string) => {
    const updatedAccounts = removeAccountFromStorage(address);
    setAccounts(updatedAccounts);

    if (selectedAccount?.address === address) {
      setSelectedAccount(
        updatedAccounts.length > 0 ? updatedAccounts[0] : null,
      );
    }
  };

  const handleUpdateLabel = (address: string, label: string) => {
    const updatedAccounts = updateAccountLabel(address, label);
    setAccounts(updatedAccounts);

    // Update selected account if it's the one being edited
    if (selectedAccount?.address === address) {
      setSelectedAccount({ ...selectedAccount, label });
    }
  };

  const handleBalanceUpdate = (
    address: string,
    balance: string,
    sequence: number,
  ) => {
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) =>
        acc.address === address ? { ...acc, balance, sequence } : acc,
      ),
    );
    saveAccounts(
      accounts.map((acc) =>
        acc.address === address ? { ...acc, balance, sequence } : acc,
      ),
    );
  };

  const handleTransactionSubmitted = (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  // Determine network type from URL
  const getNetworkInfo = () => {
    if (DEVNET_URL.includes("devnet")) {
      return { name: "Devnet", color: "text-yellow-500", bgColor: "bg-yellow-500/20" };
    } else if (DEVNET_URL.includes("testnet") || DEVNET_URL.includes("altnet")) {
      return { name: "Testnet", color: "text-blue-500", bgColor: "bg-blue-500/20" };
    } else {
      return { name: "Mainnet", color: "text-green-500", bgColor: "bg-green-500/20" };
    }
  };

  const networkInfo = getNetworkInfo();

  const handleCopyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(DEVNET_URL);
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const navigationItems = [
    {
      id: "create-vault" as const,
      label: "Create Vault",
      icon: Vault,
      section: "Vaults",
      path: "/create-vault",
    },
    {
      id: "vaults" as const,
      label: "My Vaults",
      icon: Coins,
      section: "Vaults",
      path: "/vaults",
    },
    {
      id: "loans" as const,
      label: "Loans",
      icon: Zap,
      section: "Lending",
      badge: "XLS-66",
      path: "/loans",
    },
    {
      id: "history" as const,
      label: "Transactions",
      icon: History,
      section: "Activity",
      path: "/history",
    },
  ];

  return (
    <div className="min-h-screen flex bg-cyber-darker">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed left-0 top-0 h-screen w-80 bg-cyber-dark border-r border-cyber-blue/30 z-30 flex flex-col"
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-cyber-blue/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-lg">
                <Vault className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold glow-text">
                  XRPL Terminal
                </h1>
                <p className="text-xs text-gray-500 font-display">
                  Vault & Lending
                </p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-2 bg-cyber-darker/50 border border-cyber-blue/20 rounded-lg">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-cyber-green" : "bg-gray-500"} ${isConnected ? "animate-pulse" : ""}`}
            />
            <span className="text-xs font-display text-gray-400">
              {isConnected ? "Devnet Connected" : "Connecting..."}
            </span>
            {isConnected && <Activity className="w-3 h-3 text-cyber-green ml-auto" />}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {["Vaults", "Lending", "Activity"].map((section) => (
            <div key={section}>
              <h3 className="text-xs font-display font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                {section}
              </h3>
              <div className="space-y-1">
                {navigationItems
                  .filter((item) => item.section === section)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-display text-sm transition-all cursor-pointer ${
                          isActive
                            ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50 shadow-lg shadow-cyber-blue/20"
                            : "text-gray-400 hover:text-gray-200 hover:bg-cyber-darker/50 hover:translate-x-1"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] px-2 py-0.5 bg-cyber-purple/30 text-cyber-purple border border-cyber-purple/50 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {/* Account Manager in Sidebar */}
        <div className="p-4 border-t border-cyber-blue/30">
          <div className="mb-4">
            <AccountManager
              client={client}
              onAccountCreated={handleAccountCreated}
            />
          </div>

          {accounts.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-display font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
                My Accounts ({accounts.length})
              </h3>
              <div className="max-h-64 overflow-y-auto scrollbar-thin pr-1">
                <AccountList
                  accounts={accounts}
                  selectedAccount={selectedAccount}
                  onSelect={setSelectedAccount}
                  onUpdateLabel={handleUpdateLabel}
                  onDelete={handleDeleteAccount}
                />
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 ${isSidebarOpen ? "ml-80" : "ml-0"} transition-all relative z-10`}>
        {/* Connection Status Banner */}
        <div className={`border-b border-cyber-blue/20 ${isConnected ? "bg-cyber-darker" : "bg-red-500/10"}`}>
          <div className="px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-cyber-green animate-pulse shadow-lg shadow-cyber-green/50" : "bg-red-500 animate-pulse"}`}
                />
                <span className={`text-xs font-display font-semibold ${isConnected ? "text-cyber-green" : "text-red-400"}`}>
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              <div className="h-4 w-px bg-cyber-blue/20" />

              {/* Network Type */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-display font-semibold px-2 py-0.5 rounded ${networkInfo.bgColor} ${networkInfo.color} uppercase tracking-wider`}>
                  {networkInfo.name}
                </span>
              </div>

              <div className="h-4 w-px bg-cyber-blue/20" />

              {/* Endpoint URL */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-display text-gray-500">
                  Endpoint:
                </span>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-cyber-darker/50 rounded border border-cyber-blue/20 hover:border-cyber-blue/40 transition-colors group">
                  <span className="text-xs font-display text-cyber-blue mono-text">
                    {DEVNET_URL}
                  </span>
                  <button
                    onClick={handleCopyEndpoint}
                    className="p-0.5 hover:bg-cyber-blue/10 rounded transition-colors"
                    title="Copy endpoint"
                  >
                    {copiedEndpoint ? (
                      <Check className="w-3 h-3 text-cyber-green" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-500 group-hover:text-cyber-blue transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Protocol Info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyber-blue" />
                <span className="text-xs font-display text-gray-400">
                  WebSocket
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-cyber-dark/80 backdrop-blur-sm border-b border-cyber-blue/30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-cyber-blue/10 rounded-lg transition-all cursor-pointer hover:scale-110"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5 text-gray-400" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <div>
                <h2 className="text-lg font-display font-bold text-gray-200">
                  {navigationItems.find((item) => item.id === activeTab)?.label}
                </h2>
                <p className="text-xs text-gray-500 font-display">
                  {selectedAccount
                    ? `${selectedAccount.address.slice(0, 8)}...${selectedAccount.address.slice(-6)}`
                    : "No account selected"}
                </p>
              </div>
            </div>

            {selectedAccount && (
              <div className="flex items-center gap-3 px-4 py-2 bg-cyber-darker/50 border border-cyber-blue/20 rounded-lg">
                <span className="text-xs text-gray-500 font-display">Balance:</span>
                <span className="text-sm font-display font-bold text-cyber-green">
                  {selectedAccount.balance} XRP
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6 relative z-0">
          <Routes>
            <Route
              path="/create-vault"
              element={
                <motion.div
                  key="create-vault"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <VaultCreate
                    client={client}
                    account={selectedAccount}
                    onTransactionSubmitted={handleTransactionSubmitted}
                  />
                </motion.div>
              }
            />
            <Route
              path="/vaults"
              element={
                <motion.div
                  key="vaults"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <VaultList client={client} account={selectedAccount} />
                </motion.div>
              }
            />
            <Route
              path="/vaults/:vaultId"
              element={
                <motion.div
                  key="vault-detail"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <VaultDetail client={client} account={selectedAccount} />
                </motion.div>
              }
            />
            <Route
              path="/vaults/:vaultId/deposit"
              element={
                <motion.div
                  key="vault-deposit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <VaultDeposit
                    client={client}
                    account={selectedAccount}
                    onTransactionSubmitted={handleTransactionSubmitted}
                  />
                </motion.div>
              }
            />
            <Route
              path="/vaults/:vaultId/edit"
              element={
                <motion.div
                  key="vault-edit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <VaultSet
                    client={client}
                    account={selectedAccount}
                    onTransactionSubmitted={handleTransactionSubmitted}
                  />
                </motion.div>
              }
            />
            <Route
              path="/loans"
              element={
                <motion.div
                  key="loans"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoanManager />
                </motion.div>
              }
            />
            <Route
              path="/history"
              element={
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TransactionHistory transactions={transactions} />
                </motion.div>
              }
            />
            <Route path="/" element={<Navigate to="/create-vault" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
