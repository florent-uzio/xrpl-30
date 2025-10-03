interface TransactionRecord {
  id: string;
  sourceAccount: string;
  transactionType: string;
  hash: string;
  validated: boolean;
  timestamp: Date;
  ledgerIndex?: number;
  fee?: string;
  result?: string;
}

class TransactionTracker {
  private static instance: TransactionTracker;
  private transactions: TransactionRecord[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): TransactionTracker {
    if (!TransactionTracker.instance) {
      TransactionTracker.instance = new TransactionTracker();
    }
    return TransactionTracker.instance;
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem("xrpl-transactions");
      if (saved) {
        const parsed = JSON.parse(saved).map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        }));
        this.transactions = parsed;
      }
    } catch (error) {
      console.error("Failed to load transactions from storage:", error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        "xrpl-transactions",
        JSON.stringify(this.transactions)
      );
    } catch (error) {
      console.error("Failed to save transactions to storage:", error);
    }
  }

  public addTransaction(
    sourceAccount: string,
    transactionType: string,
    hash: string,
    validated: boolean = false,
    ledgerIndex?: number,
    fee?: string,
    result?: string
  ): void {
    const transaction: TransactionRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceAccount,
      transactionType,
      hash,
      validated,
      timestamp: new Date(),
      ledgerIndex,
      fee,
      result,
    };

    this.transactions.unshift(transaction); // Add to beginning
    this.saveToStorage();

    // Notify components that transactions have been updated
    window.dispatchEvent(
      new CustomEvent("transactionsUpdated", {
        detail: { transactions: [...this.transactions] },
      })
    );
  }

  public updateTransaction(
    hash: string,
    updates: Partial<TransactionRecord>
  ): void {
    const index = this.transactions.findIndex((tx) => tx.hash === hash);
    if (index !== -1) {
      this.transactions[index] = { ...this.transactions[index], ...updates };
      this.saveToStorage();

      // Notify components that transactions have been updated
      window.dispatchEvent(
        new CustomEvent("transactionsUpdated", {
          detail: { transactions: [...this.transactions] },
        })
      );
    }
  }

  public getTransactions(): TransactionRecord[] {
    return [...this.transactions];
  }

  public clearTransactions(): void {
    this.transactions = [];
    this.saveToStorage();

    // Notify components that transactions have been updated
    window.dispatchEvent(
      new CustomEvent("transactionsUpdated", {
        detail: { transactions: [] },
      })
    );
  }

  public getTransactionByHash(hash: string): TransactionRecord | undefined {
    return this.transactions.find((tx) => tx.hash === hash);
  }
}

export default TransactionTracker;
export type { TransactionRecord };
