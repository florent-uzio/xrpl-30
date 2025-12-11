import React from "react";
import { Layers, Coins } from "lucide-react";

interface CreatedToken {
  id: string;
  type: "MPT" | "IOU";
  issuer: string;
  currency: string;
  name?: string;
  createdAt: Date;
  mptIssuanceId?: string;
}

interface TokenListProps {
  tokens: CreatedToken[];
}

const TokenList: React.FC<TokenListProps> = ({ tokens }) => {
  // Deduplicate IOUs by issuer+currency combination
  const uniqueTokens = tokens.filter((token, index, self) => {
    if (token.type === "MPT") return true; // Keep all MPTs
    // For IOUs, keep only the first occurrence of each issuer+currency combination
    return (
      index ===
      self.findIndex(
        (t) =>
          t.type === "IOU" &&
          t.issuer === token.issuer &&
          t.currency === token.currency
      )
    );
  });

  if (uniqueTokens.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 mb-4">
          <Layers className="w-5 h-5" />
          <span>Created Tokens</span>
        </h2>
        <div className="text-center py-4 text-gray-500 text-sm">
          No tokens created yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 mb-4">
        <Layers className="w-5 h-5" />
        <span>Created Tokens</span>
      </h2>
      <div className="space-y-3">
        {uniqueTokens.map((token) => (
          <div
            key={token.id}
            className="p-3 border border-gray-200 rounded-lg bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {token.type === "MPT" ? (
                  <Layers className="w-4 h-4 text-blue-600" />
                ) : (
                  <Coins className="w-4 h-4 text-purple-600" />
                )}
                <span className="text-sm font-semibold text-gray-900">
                  {token.currency}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    token.type === "MPT"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {token.type}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <div>Issuer: {token.issuer.slice(0, 8)}...{token.issuer.slice(-6)}</div>
              {token.mptIssuanceId && (
                <div className="mt-1 font-mono text-xs">
                  ID: {token.mptIssuanceId.slice(0, 16)}...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenList;

