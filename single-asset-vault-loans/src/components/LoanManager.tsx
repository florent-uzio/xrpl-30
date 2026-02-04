import { motion } from "framer-motion";
import { Zap, ExternalLink, Sparkles } from "lucide-react";

export function LoanManager() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-card p-12 text-center relative overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyber-purple rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyber-blue rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyber-purple to-cyber-magenta p-4 relative"
          >
            <Zap className="w-full h-full text-white" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-block px-4 py-1.5 mb-4 bg-gradient-to-r from-cyber-purple/30 to-cyber-magenta/30 border border-cyber-purple/50 rounded-full"
          >
            <span className="text-xs font-display font-semibold text-cyber-purple uppercase tracking-wider">
              XLS-66 Lending Protocol
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-display font-bold text-gray-200 mb-4"
          >
            Lending Coming Soon
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 font-display max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            The XLS-66 Lending Protocol will enable native lending and borrowing on
            XRPL. Create loan offers, borrow against collateral, and earn interest
            on your assets—all secured by the XRP Ledger.
          </motion.p>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8"
          >
            {[
              {
                title: "Create Loans",
                desc: "Offer loans with custom terms",
                icon: "🏦",
              },
              {
                title: "Collateral",
                desc: "Secure loans with vault assets",
                icon: "🔒",
              },
              {
                title: "Interest",
                desc: "Earn or pay interest rates",
                icon: "📈",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-4 bg-cyber-darker/50 border border-cyber-blue/20 rounded-lg"
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <div className="text-sm font-display font-semibold text-gray-300 mb-1">
                  {feature.title}
                </div>
                <div className="text-xs font-display text-gray-500">
                  {feature.desc}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="https://github.com/XRPLF/XRPL-Standards/pull/240"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyber-purple to-cyber-magenta text-white font-display text-sm font-semibold rounded-lg hover:scale-105 transition-all cursor-pointer hover:shadow-lg hover:shadow-cyber-purple/30"
            >
              <span>View XLS-66 Proposal</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://dev.to/ripplexdev/xrp-ledger-lending-protocol-2pla"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-darker/50 border border-cyber-blue/30 text-cyber-blue font-display text-sm font-semibold rounded-lg hover:border-cyber-blue/60 hover:bg-cyber-darker transition-all cursor-pointer"
            >
              <span>Learn More</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-6 border-t border-cyber-blue/20"
          >
            <div className="flex items-center justify-center gap-2 text-xs font-display text-gray-500">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span>In Development · Expected 2026</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Additional Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 cyber-card p-6"
      >
        <h3 className="text-sm font-display font-semibold text-gray-300 mb-3">
          About Native Lending on XRPL
        </h3>
        <p className="text-xs text-gray-500 font-display leading-relaxed mb-4">
          XLS-66 introduces a native lending protocol to the XRP Ledger, allowing
          users to create loan offers with specific terms, accept loans with
          collateral from Single Asset Vaults (XLS-65), and manage repayments and
          interest directly on the ledger without smart contracts.
        </p>
        <div className="flex gap-4 text-xs font-display">
          <a
            href="https://github.com/XRPLF/XRPL-Standards/discussions/192"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyber-blue hover:text-cyber-purple transition-all cursor-pointer hover:translate-x-1"
          >
            Community Discussion →
          </a>
          <a
            href="https://xrpl.org/resources/known-amendments"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyber-blue hover:text-cyber-purple transition-all cursor-pointer hover:translate-x-1"
          >
            Amendment Status →
          </a>
        </div>
      </motion.div>
    </div>
  );
}
