import {
  AccountSet,
  AccountSetAsfFlags,
  Client,
  convertStringToHex,
  Payment,
  TrustSet,
  TrustSetFlags,
  Wallet,
} from "xrpl";
import dotenv from "dotenv";
dotenv.config();

export const issueToken = async () => {
  const client = new Client("wss://s.altnet.rippletest.net:51233");

  // Always connect the client
  await client.connect();

  const issuer = Wallet.fromSeed(process.env.SEED_1 || "");
  const holder1 = Wallet.fromSeed(process.env.SEED_2 ?? "");
  const holder2 = Wallet.fromSeed(process.env.SEED_3 ?? "");

  const myToken = "MY_SUPER_TOKEN";
  // If the token has more than 3 characters, pad it with zeros
  const myTokenConverted =
    myToken.length > 3
      ? convertStringToHex(myToken).padEnd(40, "0").toUpperCase()
      : myToken;

  // Enable Rippling on the issuer (AccountSet) - ONLY ONCE GENERALLY TO SET THE RIGHT SETTINGS
  const accountSet: AccountSet = {
    Account: issuer.address,
    TransactionType: "AccountSet",
    SetFlag: AccountSetAsfFlags.asfDefaultRipple,
  };

  const response = await client.submitAndWait(accountSet, {
    autofill: true,
    wallet: issuer,
  });

  console.log(response);

  // Issue a TrustSet from the holder account (Charlie...) - ONLY ONCE PER HOLDER GENERALLY BUT CAN BE DONE SEVERAL TIMES IF THE TRUSTLINE NEEDS TO BE UPDATED
  const trustset: TrustSet = {
    Account: holder2.address,
    TransactionType: "TrustSet",
    LimitAmount: {
      currency: myTokenConverted,
      issuer: issuer.address,
      value: "10000",
    },
    Flags: TrustSetFlags.tfSetNoRipple,
  };

  const response1 = await client.submitAndWait(trustset, {
    autofill: true,
    wallet: holder2,
  });

  console.log(response1);

  // Payment from the Issuer to the holder accounts - CAN BE DONE SEVERAL TIMES
  const payment: Payment = {
    Account: issuer.address,
    TransactionType: "Payment",
    Destination: holder2.address,
    Amount: {
      currency: myTokenConverted,
      value: "10",
      issuer: issuer.address,
    },
  };

  const response2 = await client.submitAndWait(payment, {
    autofill: true,
    wallet: issuer,
  });

  console.log(response2);

  await client.disconnect();
};
