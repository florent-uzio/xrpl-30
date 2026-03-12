import React, { useState } from "react";
import { Plus } from "lucide-react";

interface GenerateAccountsProps {
  isLoading: boolean;
  disabled: boolean;
  onGenerate: (count: number) => void;
}

const GenerateAccounts: React.FC<GenerateAccountsProps> = ({
  isLoading,
  disabled,
  onGenerate,
}) => {
  const [count, setCount] = useState(1);

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setCount(Math.max(1, Math.min(10, val)));
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="number"
        min={1}
        max={10}
        value={count}
        onChange={handleCountChange}
        disabled={isLoading || disabled}
        className="w-14 shrink-0 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        title="Number of accounts to generate (max 10)"
      />
      <button
        onClick={() => onGenerate(count)}
        disabled={isLoading || disabled}
        className="flex-1 flex items-center justify-center space-x-2 px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>{isLoading ? "Generating..." : "Generate"}</span>
      </button>
    </div>
  );
};

export default GenerateAccounts;
