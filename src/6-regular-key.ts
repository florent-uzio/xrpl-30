import { Client, Payment, SetRegularKey, xrpToDrops } from "xrpl";

// Connect to XRPL testnet
const TESTNET = "wss://s.altnet.rippletest.net:51233";

/**
 * Demonstrates the usage of regular keys in XRPL:
 * 1. Sets up a regular key pair for an account
 * 2. Makes a payment using the regular key
 * 3. Removes the regular key
 */
export const regularKey = async () => {
  // Initialize and connect to XRPL client
  const client = new Client(TESTNET);
  await client.connect();

  // Step 1: Create two wallets
  // - masterWallet: The main account that will delegate authority
  // - regularWallet: The account that will receive delegated authority
  const { wallet: masterWallet } = await client.fundWallet();
  const { wallet: regularWallet } = await client.fundWallet();

  console.log("Created wallets:", {
    masterWallet,
    regularWallet,
  });

  // Step 2: Set up regular key
  // This allows the regularWallet to sign transactions on behalf of masterWallet
  const setRegularKeyTxn: SetRegularKey = {
    Account: masterWallet.address,
    TransactionType: "SetRegularKey",
    RegularKey: regularWallet.address,
  };

  console.log("Setting regular key...");
  const response = await client.submitAndWait(setRegularKeyTxn, {
    autofill: true,
    wallet: masterWallet,
  });
  console.log("Regular key set successfully:", response);

  // Step 3: Demonstrate regular key usage
  // Create and submit a payment transaction signed by the regular key
  const payment: Payment = {
    Account: masterWallet.address,
    Destination: regularWallet.address,
    Amount: xrpToDrops("1"), // Send 1 XRP
    TransactionType: "Payment",
  };

  const autofilled = await client.autofill(payment);

  console.log("Signing payment transaction with regular key...");
  const signed = regularWallet.sign(autofilled);

  console.log("Submitting payment transaction...");
  const paymentResponse = await client.submitAndWait(signed.tx_blob);
  console.log("Payment successful:", paymentResponse);

  // Step 4: Clean up - Remove the regular key
  // This revokes the regular key's authority
  console.log("Removing regular key...");
  const removeRegularKeyTxn: SetRegularKey = {
    Account: masterWallet.address,
    TransactionType: "SetRegularKey",
  };

  const removeResponse = await client.submitAndWait(removeRegularKeyTxn, {
    autofill: true,
    wallet: masterWallet,
  });
  console.log("Regular key removed successfully:", removeResponse);

  // Clean up connection
  await client.disconnect();
};
