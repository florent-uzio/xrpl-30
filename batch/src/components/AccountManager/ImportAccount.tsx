import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface ImportAccountProps {
  isLoading: boolean;
  disabled: boolean;
  onImport: (seed: string) => Promise<string | null>;
}

const ImportAccount: React.FC<ImportAccountProps> = ({
  isLoading,
  disabled,
  onImport,
}) => {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    const err = await onImport(seed.trim());
    if (err) {
      setError(err);
    } else {
      setSeed("");
      setOpen(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSeed("");
    setError(null);
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading || disabled}
        className="w-full flex items-center justify-center space-x-2 px-2 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Import</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Import Wallet from Seed
              </h3>
              <button onClick={handleClose} className="p-1 hover:bg-gray-200 rounded">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Seed (Secret)
                </label>
                <input
                  type="password"
                  value={seed}
                  onChange={(e) => { setSeed(e.target.value); setError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleImport(); }}
                  placeholder="s..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
              <button
                onClick={handleImport}
                disabled={isLoading || disabled || !seed.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isLoading ? "Importing..." : "Import Account"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImportAccount;
