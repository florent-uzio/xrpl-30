import { useState, useEffect } from "react";
import { Client } from "xrpl";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap } from "lucide-react";
import { type XRPLAccount } from "./types/account";
import { createClient } from "./utils/xrpl";
import {
  loadAccounts,
  saveAccounts,
  removeAccount as removeAccountFromStorage,
} from "./utils/storage";
import { AccountManager } from "./components/AccountManager";
import { AccountCard } from "./components/AccountCard";
import { AccountSelector } from "./components/AccountSelector";

function App() {
  const [client] = useState<Client>(() => createClient());
  const [accounts, setAccounts] = useState<XRPLAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<XRPLAccount | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);

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

    // Auto-select the first account if none selected
    if (!selectedAccount) {
      setSelectedAccount(account);
    }
  };

  const handleDeleteAccount = (address: string) => {
    const updatedAccounts = removeAccountFromStorage(address);
    setAccounts(updatedAccounts);

    // Clear selection if deleted account was selected
    if (selectedAccount?.address === address) {
      setSelectedAccount(
        updatedAccounts.length > 0 ? updatedAccounts[0] : null,
      );
    }
  };

  const handleBalanceUpdate = (address: string, balance: string, sequence: number) => {
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) =>
        acc.address === address ? { ...acc, balance, sequence } : acc
      )
    );
    saveAccounts(
      accounts.map((acc) =>
        acc.address === address ? { ...acc, balance, sequence } : acc
      )
    );
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-display font-bold">
              <span className="glow-text">XRPL</span>
              <span className="text-gray-300"> Vault</span>
            </h1>
          </div>
          <p className="text-gray-400 font-display text-lg">
            Single Asset Vault Loans on XRPL Devnet
          </p>

          {/* Connection Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-cyber-dark/50 border border-cyber-blue/30 rounded-full"
          >
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-cyber-green" : "bg-gray-500"} ${isConnected ? "animate-pulse" : ""}`}
            />
            <span className="text-sm font-display text-gray-400">
              {isConnected ? "Connected to Devnet" : "Connecting..."}
            </span>
            {isConnected && <Activity className="w-4 h-4 text-cyber-green" />}
          </motion.div>
        </motion.header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Account Manager */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="cyber-card p-6">
              <AccountManager
                client={client}
                onAccountCreated={handleAccountCreated}
              />

              {/* Account Selector */}
              {accounts.length > 0 && (
                <div className="mt-8">
                  <AccountSelector
                    accounts={accounts}
                    selectedAccount={selectedAccount}
                    onSelect={setSelectedAccount}
                    label="Active Account"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Account Grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="mb-6">
              <h3 className="text-xl font-display font-bold text-gray-200 mb-2">
                Your Accounts
              </h3>
              <p className="text-sm text-gray-400 font-display">
                {accounts.length}{" "}
                {accounts.length === 1 ? "account" : "accounts"} created
              </p>
            </div>

            {accounts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="cyber-card p-12 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyber-blue/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-cyber-blue/50" />
                </div>
                <h3 className="text-lg font-display font-medium text-gray-300 mb-2">
                  No Accounts Yet
                </h3>
                <p className="text-sm text-gray-500 font-display max-w-sm mx-auto">
                  Create your first XRPL account to get started with Single
                  Asset Vault Loans
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {accounts.map((account) => (
                    <AccountCard
                      key={account.address}
                      account={account}
                      client={client}
                      onDelete={handleDeleteAccount}
                      onBalanceUpdate={handleBalanceUpdate}
                      isSelected={selectedAccount?.address === account.address}
                      onSelect={() => setSelectedAccount(account)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-block px-4 py-2 bg-cyber-dark/30 border border-cyber-blue/20 rounded-lg">
            <p className="text-xs text-gray-500 font-display">
              Built for the XRPL Community · Powered by{" "}
              <span className="text-cyber-blue">xrpl.js</span>
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;
