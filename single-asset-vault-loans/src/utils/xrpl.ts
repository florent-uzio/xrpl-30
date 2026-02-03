import { Client } from "xrpl";

export const DEVNET_URL = "wss://s.devnet.rippletest.net:51233";

export const createClient = () => {
  return new Client(DEVNET_URL);
};

export const shortenAddress = (address: string, chars = 8): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
