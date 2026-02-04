import { type XRPLAccount } from "../types/account";

const STORAGE_KEY = "xrpl_accounts";

export const loadAccounts = (): XRPLAccount[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading accounts:", error);
    return [];
  }
};

export const saveAccounts = (accounts: XRPLAccount[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error("Error saving accounts:", error);
  }
};

export const addAccount = (account: XRPLAccount): XRPLAccount[] => {
  const accounts = loadAccounts();
  const updated = [...accounts, account];
  saveAccounts(updated);
  return updated;
};

export const removeAccount = (address: string): XRPLAccount[] => {
  const accounts = loadAccounts();
  const updated = accounts.filter((acc) => acc.address !== address);
  saveAccounts(updated);
  return updated;
};

export const updateAccountBalance = (
  address: string,
  balance: string,
  sequence?: number,
): XRPLAccount[] => {
  const accounts = loadAccounts();
  const updated = accounts.map((acc) =>
    acc.address === address ? { ...acc, balance, sequence } : acc,
  );
  saveAccounts(updated);
  return updated;
};

export const updateAccountLabel = (
  address: string,
  label: string,
): XRPLAccount[] => {
  const accounts = loadAccounts();
  const updated = accounts.map((acc) =>
    acc.address === address ? { ...acc, label } : acc,
  );
  saveAccounts(updated);
  return updated;
};
