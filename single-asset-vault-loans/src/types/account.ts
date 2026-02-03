export interface XRPLAccount {
  address: string;
  publicKey: string;
  privateKey: string;
  seed: string;
  balance: string;
  sequence?: number;
  createdAt: number;
}
