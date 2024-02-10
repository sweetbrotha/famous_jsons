import React, { useState, useEffect, useCallback } from 'react';
import { useProjectState } from './ProjectStateProvider';
import { useWeb3 } from './Web3Provider';
import BigNumber from 'bignumber.js';
import { CONTRACT_ADDRESS } from './constants';

function MintModal({ isOpen, jsonFiles, selectedJsonName, onClose }) {
  const [selectedJson, setSelectedJson] = useState(selectedJsonName);
  const [isMinting, setIsMinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const { projectState, updateProjectState, isFetched } = useProjectState();
  const { web3, contract, userAddress, isWalletConnected, connectWallet } = useWeb3();

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    // Cleanup function to ensure we remove the class when the component unmounts
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);

  const getIndexByName = useCallback((name) => {
    return jsonFiles.findIndex(file => file.jsonName === name);
  }, [jsonFiles]);

  // Reset selectedJson, statusMessage when modal opens or selectedJsonName changes
  useEffect(() => {
    setSelectedJson(selectedJsonName);
  }, [isOpen, selectedJsonName]);

  useEffect(() => {
    setStatusMessage('');
    if (isFetched) {
      const selectedIndex = getIndexByName(selectedJson);
      if (projectState.token_ids_minted.includes(selectedIndex.toString())) {
        setSelectedJson(''); // unselect already-minted JSON
      }
    }
  }, [isOpen, selectedJson, projectState, isFetched, getIndexByName]);

  const getErrorMessage = (error) => {
    if (error.code === 4001) {
      return 'transaction canceled';
    }
    // Default error message
    return 'error sending transaction, please try again.';
  };

  const waitForTransactionReceipt = async (txHash) => {
    let receipt = null;
    const maxAttempts = 60; // two minutes of attempts
    let attempts = 0;
    while (receipt === null && attempts < maxAttempts) {
      try {
        receipt = await web3.eth.getTransactionReceipt(txHash);
      } catch (error) {
        // swallow error and wait to retry, apparently this is expected
      }
      if (receipt === null) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // retry after 2s
        attempts++;
      }
    }
    if (receipt === null) {
      throw new Error('Transaction receipt not found.');
    }
    return receipt;
  };

  const handleMintClick = async () => {
    if (!isWalletConnected) {
      const statusMessage = await connectWallet();
      setStatusMessage(statusMessage);
      return;
    }
    if (selectedJson && isFetched) {
      const tokenId = jsonFiles.findIndex(file => file.jsonName === selectedJson);
      const valueInHex = new BigNumber(projectState.current_mint_price).toString(16);

      const transactionParameters = {
        to: CONTRACT_ADDRESS,
        from: userAddress,
        value: valueInHex,
        data: contract.methods.mintToken(userAddress, tokenId).encodeABI()
      };
      console.log("Transaction Parameters:", transactionParameters);
      setIsMinting(true);
      try {
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionParameters],
        });
        console.log("Transaction sent! Awaiting blockchain confirmation...");
        setStatusMessage("Transaction sent! Awaiting blockchain confirmation...");
        const receipt = await waitForTransactionReceipt(txHash);
        if (receipt.status) {
          setStatusMessage("Transaction successful! Site will update momentarily...");
          await updateProjectState();
        } else {
          setStatusMessage("Transaction failed :/ Please refresh and try again.");
        }
      } catch (error) {
        console.error('Error sending transaction:', error);
        setStatusMessage(getErrorMessage(error));
      }
      setIsMinting(false);
    }
  };

  const weiToEth = (weiValue) => {
    const etherValue = web3.utils.fromWei(weiValue, 'ether');
    const formattedEther = parseFloat(etherValue).toFixed(3); // max three decimal places
    return formattedEther.replace(/\.?0+$/, ''); // remove trailing zeroes and decimal point
  };

  function formatBlockCountdown(blocks) {
    if (blocks <= 4) {
      return '<1m';
    }
    const minutes = blocks / 5; // 12 seconds per block
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `~ ${hours}hrs ${mins}mins`;
    }
    return `~ ${mins}mins`;
  }

  if (!isOpen) return null;

  const selectedSvgUrl = selectedJson ? `/json_art/${selectedJson}.svg` : '';
  const isMinted = selectedJson && isFetched && projectState.token_ids_minted.includes(selectedJson);

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-darkgray bg-opacity-95 flex flex-col items-center justify-center z-50 overflow-hidden">
      <button
        onClick={onClose}
        className="absolute top-3 md:top-8 right-4 md:right-8 text-white text-xl font-bold font-courier hover:text-cybergold"
      >
        ×
      </button>

      {/* Modal Content Container */}
      <div className="w-56 md:w-1/2 h-4/5 flex flex-col items-center relative bg-black rounded ring-2 ring-cybergreen overflow-y-auto custom-scrollbar">

        <div className="w-4/5 flex flex-col justify-start mt-4 text-xs md:text-sm text-mediumgray font-courier">
          <p className="text-cybergreen">Mint a JSON!</p>
          <ul className="ml-1 md:ml-2 mb-2 md:mb-4 list-disc list-inside">
            <li>Mint price starts at 10 ETH &times; # JSONs minted
              <span className="font-bold text-white"> ({(projectState.token_ids_minted || []).length})</span>
            </li>
            <li>Mint price drops by <span className="italic">25%</span> every hour!</li>
            <li>Mint price resets to new base value with each mint!</li>
            <li>
              Current price:{' '}
              <span className="text-cybergreen font-bold">
                {weiToEth(projectState.current_mint_price) === '0' ? 'FREE' : `${weiToEth(projectState.current_mint_price)} ETH`}
              </span>
            </li>
            {weiToEth(projectState.current_mint_price) !== '0' && (
              <>
                <li>Next 25% discount in: <span className="text-cybergreen font-bold">{formatBlockCountdown(projectState.blocks_til_discount)}</span></li>
                <li>Free after: <span className="text-cybergreen font-bold">{formatBlockCountdown(projectState.blocks_til_free)}</span></li>
              </>
            )}
          </ul>
        </div>
        {/* Dropdown Selection for JSON names */}
        <div className="flex flex-col items-center justify-center p-2 md:p-6 w-4/5 md:w-3/4">
          <div className="text-cybergold font-courier text-xs md:text-base">Select a JSON to mint!</div>
          <select
            className="w-48 md:w-64 m-1 px-2 md:px-4 py-1.5 md:py-2 text-sm md:text-base font-courier text-darkgray bg-lightgray rounded focus:outline-none focus:ring-2 focus:ring-cybergold"
            value={selectedJson}
            onChange={(e) => setSelectedJson(e.target.value)}
          >
            <option value="">{"<none selected>"}</option>
            {jsonFiles.map(({ jsonName }, index) => (
              <option
                key={index}
                value={jsonName}
                disabled={projectState.token_ids_minted.includes(index.toString())}
              >
                {jsonName}
              </option>
            ))}
          </select>
        </div>

        {selectedJson && (
          <div className="m-2">
            <img src={selectedSvgUrl} alt={selectedJson} className="w-40 h-40 md:w-64 md:h-64" />
          </div>
        )}

        {/* Button Container */}
        <div className="flex flex-col w-full justify-center items-center my-2 md:my-4">
          <button
            onClick={handleMintClick}
            className={`w-40 h-10 my-2 text-cybergreen bg-darkgray ring-2 ring-cybergreen font-bold font-courier rounded focus:outline-none ${isWalletConnected && (!selectedJson || isMinted || isMinting) ? 'opacity-50 cursor-not-allowed' : 'md:hover:text-black md:hover:bg-cybergreen'}`}
            disabled={isWalletConnected && (!selectedJson || isMinted || isMinting)}
            style={{ backgroundImage: isMinting ? 'url(/loading_mint.gif)' : 'none', backgroundSize: 'cover' }}
          >
            {!isMinting ? (isWalletConnected ? 'Mint!' : 'Connect Wallet') : ''}
          </button>
          <button
            onClick={onClose}
            className="w-40 h-10 my-2 text-cybergold bg-darkgray ring-2 ring-cybergold font-bold font-courier rounded focus:outline-none"
          >
            Close
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="text-cyberyellow text-sm font-courier text-center mb-2 px-2">
            {statusMessage}
          </div>
        )}
      </div>


    </div>
  );
}

export default MintModal;
