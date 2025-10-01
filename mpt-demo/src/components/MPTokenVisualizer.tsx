import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ArrowRight, Users, Coins } from "lucide-react";

interface Account {
  address: string;
  secret: string;
  balance: string;
  mptokens: any[];
}

interface MPTokenVisualizerProps {
  accounts: Account[];
  selectedAccount: Account | null;
}

const MPTokenVisualizer: React.FC<MPTokenVisualizerProps> = (
  {
    // accounts,
    // selectedAccount,
  }
) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [transferDirection, setTransferDirection] = useState<"left" | "right">(
    "right"
  );

  const demoMPTokens = [
    {
      id: "1",
      name: "DEMO",
      color: "from-blue-500 to-blue-600",
      amount: "1000",
    },
    {
      id: "2",
      name: "TEST",
      color: "from-green-500 to-green-600",
      amount: "500",
    },
    {
      id: "3",
      name: "COIN",
      color: "from-purple-500 to-purple-600",
      amount: "250",
    },
  ];

  const startAnimation = () => {
    setIsAnimating(true);
    setAnimationStep(0);

    const interval = setInterval(() => {
      setAnimationStep((prev) => {
        if (prev >= 3) {
          setIsAnimating(false);
          clearInterval(interval);
          return 0;
        }
        return prev + 1;
      });
    }, 2000);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    setAnimationStep(0);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setAnimationStep(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Play className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            MPT Visualization
          </h2>
          <p className="text-gray-600">
            Visualize Multi-Purpose Token transfers and interactions
          </p>
        </div>
      </div>

      {/* Animation Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Animation Controls
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={startAnimation}
              disabled={isAnimating}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Start</span>
            </button>
            <button
              onClick={stopAnimation}
              disabled={!isAnimating}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
            <button
              onClick={resetAnimation}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            Watch how Multi-Purpose Tokens move between accounts with different
            capabilities and restrictions.
          </p>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="card">
        <div className="relative h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden">
          {/* Accounts */}
          <div className="absolute inset-0 flex items-center justify-between p-8">
            {/* Issuer Account */}
            <motion.div
              initial={{ scale: 1 }}
              animate={{
                scale: animationStep === 1 ? 1.1 : 1,
                boxShadow:
                  animationStep === 1
                    ? "0 0 30px rgba(59, 130, 246, 0.5)"
                    : "0 0 10px rgba(0, 0, 0, 0.1)",
              }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                I
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900">Issuer</h4>
                <p className="text-sm text-gray-600">Creates & Manages</p>
                <div className="mt-2 space-y-1">
                  {demoMPTokens.map((token, index) => (
                    <motion.div
                      key={token.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: animationStep >= 1 ? 1 : 0,
                        scale: animationStep >= 1 ? 1 : 0,
                      }}
                      transition={{ delay: index * 0.2 }}
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-white text-xs font-bold shadow-md`}
                    >
                      {token.name[0]}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Transfer Animation */}
            <div className="flex-1 flex items-center justify-center">
              <AnimatePresence>
                {isAnimating && animationStep >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="flex items-center space-x-4"
                  >
                    {demoMPTokens.map((token, index) => (
                      <motion.div
                        key={token.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          x: transferDirection === "right" ? 100 : -100,
                        }}
                        transition={{
                          delay: index * 0.3,
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                        className={`w-12 h-12 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-white font-bold shadow-lg`}
                      >
                        {token.name[0]}
                      </motion.div>
                    ))}
                    <ArrowRight className="w-8 h-8 text-gray-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Holder Account */}
            <motion.div
              initial={{ scale: 1 }}
              animate={{
                scale: animationStep === 3 ? 1.1 : 1,
                boxShadow:
                  animationStep === 3
                    ? "0 0 30px rgba(34, 197, 94, 0.5)"
                    : "0 0 10px rgba(0, 0, 0, 0.1)",
              }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                H
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900">Holder</h4>
                <p className="text-sm text-gray-600">Receives & Uses</p>
                <div className="mt-2 space-y-1">
                  {demoMPTokens.map((token, index) => (
                    <motion.div
                      key={token.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: animationStep >= 3 ? 1 : 0,
                        scale: animationStep >= 3 ? 1 : 0,
                      }}
                      transition={{ delay: index * 0.2 }}
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-white text-xs font-bold shadow-md`}
                    >
                      {token.name[0]}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Animation Steps Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center space-x-1">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      animationStep >= step ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 ml-2">
                {animationStep === 0 && "Ready"}
                {animationStep === 1 && "Creating MPTs"}
                {animationStep === 2 && "Transferring"}
                {animationStep === 3 && "Complete"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MPT Features Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: Users,
            title: "Authorization",
            desc: "Control who can hold your tokens",
            color: "from-blue-500 to-blue-600",
          },
          {
            icon: Coins,
            title: "Transfer Fees",
            desc: "Earn from secondary sales",
            color: "from-green-500 to-green-600",
          },
          {
            icon: ArrowRight,
            title: "DEX Trading",
            desc: "Trade on XRPL decentralized exchange",
            color: "from-purple-500 to-purple-600",
          },
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card text-center hover:shadow-lg transition-shadow"
          >
            <div
              className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-3`}
            >
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">
              {feature.title}
            </h4>
            <p className="text-sm text-gray-600">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MPTokenVisualizer;
