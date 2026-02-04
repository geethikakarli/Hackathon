import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ConsentRegistryABI from './ConsentRegistry.json';

const Web3Context = createContext();

// Default to Hardhat local network - update for production
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const HARDHAT_CHAIN_ID = "0x7a69"; // 31337 in hex

export function Web3Provider({ children }) {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    const connectWallet = async () => {
        if (!window.ethereum) {
            setError("Please install MetaMask!");
            alert("Please install MetaMask from https://metamask.io/");
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            // Try to switch to Hardhat network
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: HARDHAT_CHAIN_ID }],
                });
            } catch (switchError) {
                // If network doesn't exist, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: HARDHAT_CHAIN_ID,
                            chainName: 'Hardhat Local',
                            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                            rpcUrls: ['http://127.0.0.1:8545'],
                        }],
                    });
                }
            }

            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const web3Signer = web3Provider.getSigner();
            const consentContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ConsentRegistryABI.abi,
                web3Signer
            );

            setProvider(web3Provider);
            setSigner(web3Signer);
            setContract(consentContract);
            setAccount(accounts[0]);

        } catch (err) {
            console.error("Connection failed:", err);
            setError(err.message);
        } finally {
            setIsConnecting(false);
        }
    };

    // Listen for account changes
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    setAccount(null);
                    setContract(null);
                }
            });
        }
    }, []);

    return (
        <Web3Context.Provider value={{
            account,
            provider,
            signer,
            contract,
            isConnecting,
            error,
            connectWallet
        }}>
            {children}
        </Web3Context.Provider>
    );
}

export function useWeb3() {
    return useContext(Web3Context);
}
