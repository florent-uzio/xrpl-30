import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Wallet, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { type XRPLAccount } from "../types/account";
import { shortenAddress } from "../utils/xrpl";

interface AccountSelectorProps {
  accounts: XRPLAccount[];
  selectedAccount: XRPLAccount | null;
  onSelect: (account: XRPLAccount) => void;
  label?: string;
}

export const AccountSelector = ({
  accounts,
  selectedAccount,
  onSelect,
  label = "Select Account",
}: AccountSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-display text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full cyber-card p-4 flex items-center justify-between hover:border-cyber-blue/60 transition-all"
      >
        {selectedAccount ? (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyber-blue/20 to-cyber-purple/20 rounded">
              <Wallet className="w-4 h-4 text-cyber-blue" />
            </div>
            <div className="text-left">
              <div className="text-sm font-display text-gray-300">
                {shortenAddress(selectedAccount.address, 8)}
              </div>
              <div className="text-xs text-gray-500 font-display">
                {parseFloat(selectedAccount.balance).toFixed(2)} XRP
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500 font-display text-sm">
            No account selected
          </span>
        )}

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 cyber-card p-2 max-h-64 overflow-y-auto"
          >
            {accounts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-display text-sm">
                No accounts available
              </div>
            ) : (
              accounts.map((account) => (
                <button
                  key={account.address}
                  onClick={() => {
                    onSelect(account);
                    setIsOpen(false);
                  }}
                  className="w-full p-3 flex items-center justify-between hover:bg-cyber-blue/10 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-cyber-blue/10 to-cyber-purple/10 rounded group-hover:from-cyber-blue/20 group-hover:to-cyber-purple/20 transition-all">
                      <Wallet className="w-4 h-4 text-cyber-blue" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-display text-gray-300">
                        {shortenAddress(account.address, 8)}
                      </div>
                      <div className="text-xs text-gray-500 font-display">
                        {parseFloat(account.balance).toFixed(2)} XRP
                      </div>
                    </div>
                  </div>

                  {selectedAccount?.address === account.address && (
                    <Check className="w-4 h-4 text-cyber-green" />
                  )}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
