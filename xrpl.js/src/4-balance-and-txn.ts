import { Client } from "xrpl";

const ACCOUNT_ADR = "rBN6rAeF7X3uoTBjH66URUYJKwSLMKLYFh"; // change it to your account address

export const balanceAndTransactions = async () => {
  const client = new Client("wss://s.altnet.rippletest.net:51233");

  // Always connect the client
  await client.connect();

  // Retrieve XRP Balance and other account info
  const accountInfo = await client.request({
    command: "account_tx",
    account: ACCOUNT_ADR,
  });

  console.log(accountInfo);

  // Retrieve trustlines for the account, including the balances
  const accountLines = await client.request({
    command: "account_lines",
    account: ACCOUNT_ADR,
  });

  console.log(JSON.stringify(accountLines, null, 2));

  // Retrieve transactions for the account
  const result = await client.request({
    command: "account_tx",
    account: ACCOUNT_ADR,
  });

  // Filter the results to only include the hash and type of transaction
  const filtered = result.result.transactions.map((tx) => {
    return {
      hash: tx.hash,
      type: tx.tx_json?.TransactionType,
    };
  });

  console.log(JSON.stringify(filtered, null, 2));

  // Disconnect the client
  await client.disconnect();
};
