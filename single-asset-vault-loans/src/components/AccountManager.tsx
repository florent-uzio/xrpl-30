import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, AlertCircle, Download, X } from "lucide-react";
import { useState } from "react";
import { Client, dropsToXrp, Wallet } from "xrpl";
import { type XRPLAccount } from "../types";

interface AccountManagerProps {
  client: Client;
  onAccountCreated: (account: XRPLAccount) => void;
}

export const AccountManager = ({
  client,
  onAccountCreated,
}: AccountManagerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importSeed, setImportSeed] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const createAccount = async () => {
    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Ensure client is connected
      if (!client.isConnected()) {
        await client.connect();
      }

      // Fund a new wallet on devnet
      const { wallet } = await client.fundWallet();

      // Get account info for sequence
      const accountInfo = await client.request({
        command: "account_info",
        account: wallet.address,
        ledger_index: "validated",
      });

      const account: XRPLAccount = {
        address: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        seed: wallet.seed!,
        balance: dropsToXrp(accountInfo.result.account_data.Balance).toString(),
        sequence: accountInfo.result.account_data.Sequence,
        createdAt: Date.now(),
      };

      onAccountCreated(account);
      setSuccessMessage("Account created and funded successfully!");

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error creating account:", err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsCreating(false);
    }
  };

  const importAccount = async () => {
    if (!importSeed.trim()) {
      setError("Please enter a seed");
      return;
    }

    setIsImporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Ensure client is connected
      if (!client.isConnected()) {
        await client.connect();
      }

      // Create wallet from seed
      const wallet = Wallet.fromSeed(importSeed.trim());

      // Get account info for balance and sequence
      const accountInfo = await client.request({
        command: "account_info",
        account: wallet.address,
        ledger_index: "validated",
      });

      const account: XRPLAccount = {
        address: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        seed: wallet.seed!,
        balance: dropsToXrp(accountInfo.result.account_data.Balance).toString(),
        sequence: accountInfo.result.account_data.Sequence,
        createdAt: Date.now(),
      };

      onAccountCreated(account);
      setSuccessMessage("Account imported successfully!");
      setImportSeed("");
      setShowImport(false);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error importing account:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to import account";

      // Provide helpful error message if account not found
      if (errorMessage.includes("actNotFound")) {
        setError("Account not found on the ledger. Make sure it's funded first.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={createAccount}
          disabled={isCreating || isImporting}
          className="cyber-button flex items-center justify-center gap-2 text-sm py-2.5"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>New</span>
            </>
          )}
        </button>
        <button
          onClick={() => setShowImport(!showImport)}
          disabled={isCreating || isImporting}
          className={`flex items-center justify-center gap-2 text-sm py-2.5 transition-all ${
            showImport
              ? "cyber-button"
              : "cyber-button-secondary"
          }`}
        >
          {showImport ? (
            <>
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Import</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="cyber-card p-3 space-y-3">
              <div>
                <label className="block text-xs font-display font-medium text-gray-400 mb-1.5">
                  Account Seed
                </label>
                <input
                  type="text"
                  value={importSeed}
                  onChange={(e) => setImportSeed(e.target.value)}
                  placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="cyber-input text-xs"
                  disabled={isImporting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      importAccount();
                    }
                  }}
                />
                <p className="mt-1 text-[10px] text-gray-500 font-display">
                  Enter your XRPL account seed (starts with 's')
                </p>
              </div>
              <button
                onClick={importAccount}
                disabled={isImporting || !importSeed.trim()}
                className="w-full cyber-button flex items-center justify-center gap-2 text-xs py-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    <span>Import Account</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs font-display text-red-300">{error}</div>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg"
        >
          <div className="text-xs font-display text-cyber-green">
            {successMessage}
          </div>
        </motion.div>
      )}

      {isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="cyber-card p-3"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-cyber-blue/30 border-t-cyber-blue animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-cyber-blue/20" />
              </div>
            </div>
            <div>
              <div className="text-xs font-display font-medium text-gray-200">
                Generating account...
              </div>
              <div className="text-[10px] text-gray-500 font-display">
                Funding via devnet faucet
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
