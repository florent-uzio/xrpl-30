export interface NetworkConfig {
  label: string;
  wss: string;
  faucetHost: string;
  faucetPath: string;
  explorerUrl: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  devnet: {
    label: "Devnet",
    wss: "wss://s.devnet.rippletest.net:51233",
    faucetHost: "faucet.devnet.rippletest.net",
    faucetPath: "/accounts",
    explorerUrl: "https://devnet.xrpl.org",
  },
  pdenv: {
    label: "PDenv",
    wss: "wss://pdenv.devnet.rippletest.net:51233/",
    faucetHost: "pdenv-faucet.devnet.rippletest.net",
    faucetPath: "/accounts/",
    explorerUrl: "https://custom.xrpl.org/pdenv.devnet.rippletest.net:51233",
  },
};

export const DEFAULT_NETWORK_KEY = "devnet";
