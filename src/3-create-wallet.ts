import { Client, ECDSA, Wallet } from "xrpl";

export const createWallet = async () => {
  const client = new Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  // There is no need to use the client to generate a new wallet with Wallet.generate() as it is cryptography.
  const wallet = Wallet.generate(ECDSA.secp256k1); // Wallet.generate() uses by default ed25519 (faster performance, stronger security, and simpler implementation compared to secp256k1).
  console.log(wallet);

  try {
    // create a new wallet with 100 XRP (on test networks) - No need of Wallet.generate() with this option.
    // const response = await client.fundWallet();

    // Fund an existing wallet
    const fundedWallet = await client.fundWallet(wallet, { amount: "20" });
    console.log(fundedWallet);

    // Check the enabled account on the ledger
    const account = await client.request({
      command: "account_info",
      account: wallet.address,
    });
    console.log(account);
  } catch (error) {
    console.log(error);
  }

  await client.disconnect();
};
