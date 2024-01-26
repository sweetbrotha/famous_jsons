import React, { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';
import abi from '../contract_abi.json';
import { CONTRACT_ADDRESS } from './constants';

const Web3Context = createContext(null);

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    initializeWeb3();
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        // Handle the network change
        console.log("Network changed to:", chainId);
        initializeWeb3(); // Re-initialize Web3 with the new network
      });
    }
  }, []);

  const initializeWeb3 = () => {
    let web3Instance;
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      web3Instance = new Web3(window.ethereum);
    } else {
      const fallbackProvider = new Web3.providers.HttpProvider(
        `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`
      );
      web3Instance = new Web3(fallbackProvider);
    }
    setWeb3(web3Instance);
    const contractInstance = new web3Instance.eth.Contract(abi, CONTRACT_ADDRESS);
    setContract(contractInstance);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setUserAddress(accounts[0]);
        setIsWalletConnected(true);
        return "Wallet connected!";
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        setIsWalletConnected(false);
        return "Connection failed, please retry or check console for details.";
      }
    } else {
      setIsWalletConnected(false);
      return "Please install MetaMask or another web3 wallet.";
    }
  };

  return (
    <Web3Context.Provider value={{ web3, contract, userAddress, isWalletConnected, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
};
