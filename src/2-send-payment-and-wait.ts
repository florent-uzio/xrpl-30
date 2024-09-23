import { Client, Payment, SubmitResponse, Wallet, xrpToDrops } from "xrpl";
import { sleep } from "./helpers";
import dotenv from "dotenv";
dotenv.config();

export const sendPaymentAndWait = async () => {
  // initialize the client
  const client = new Client("wss://s.altnet.rippletest.net:51233");

  // always remember to connect to the network
  await client.connect();

  const { SEED_1 = "", SEED_2 = "" } = process.env;

  // sender wallet
  const sender = Wallet.fromSeed(SEED_1);

  // receiver wallet
  const receiver = Wallet.fromSeed(SEED_2);

  // construct Payment JSON object, https://xrpl.org
  const payment: Payment = {
    Account: sender.address,
    TransactionType: "Payment",
    Destination: receiver.address,
    Amount: xrpToDrops(15),
  };

  // Autofill, sign, and submit the payment in one function
  const response = await client.submit(payment, {
    autofill: true,
    wallet: sender,
  });
  console.log("Payment response: ", response);

  // logic to wait and validate the txn
  const validatedTx = await wait(response, client);
  console.log("Validated transaction: ", validatedTx);

  // always remember to disconnect from the network
  await client.disconnect();
};

/** Logic to check if a transaction is validated in a ledger (handled already by the submitAndWait method provided by xrpl.js) */
const wait = async (tx: SubmitResponse, client: Client) => {
  await sleep(1000);

  // extract hash and LastLedgerSequence from tx
  const { hash, LastLedgerSequence } = tx.result.tx_json;

  // check that they are defined
  if (!hash || !LastLedgerSequence) {
    throw new Error("No hash or LastLedgerSequence provided");
  }

  // get the last validated ledger sequence from the client
  const lastValidatedLedger = await client.getLedgerIndex();

  if (lastValidatedLedger > LastLedgerSequence) {
    throw new Error("LastLedgerSequence has already passed");
  }

  try {
    // use the 'tx' method to get the transaction
    const txResponse = await client.request({
      command: "tx",
      transaction: hash,
    });

    // check if 'validated' is true
    if (txResponse.result.validated) {
      return txResponse;
    }
    return wait(tx, client);
  } catch (error) {
    // @ts-expect-error
    const { error: err } = error?.data;

    // check if the error is a txnNotFound error
    if (err === "txnNotFound") {
      return wait(tx, client);
    }

    throw new Error("something went wrong");
  }
};
