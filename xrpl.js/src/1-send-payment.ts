import { Client, Payment, xrpToDrops } from "xrpl";

export const sendPayment = async () => {
  // initialize the client
  const client = new Client("wss://s.altnet.rippletest.net:51233");

  // always remember to connect to the network
  await client.connect();

  // sender wallet
  const { wallet: sender, balance: senderBalance } = await client.fundWallet();
  console.log("Sender wallet: ", sender.address);
  console.log("Sender balance: ", senderBalance);

  // receiver wallet
  const { wallet: receiver, balance: receiverBalance } =
    await client.fundWallet();
  console.log("Receiver wallet: ", receiver.address);
  console.log("Receiver balance: ", receiverBalance);

  // construct Payment JSON object, https://xrpl.org
  const payment: Payment = {
    Account: sender.address,
    TransactionType: "Payment",
    Destination: receiver.address,
    Amount: xrpToDrops(15),
  };

  // Autofill, sign, and submit the payment in one function
  const response = await client.submitAndWait(payment, {
    autofill: true,
    wallet: sender,
  });
  console.log("Payment response: ", response);

  // always remember to disconnect from the network
  await client.disconnect();
};
