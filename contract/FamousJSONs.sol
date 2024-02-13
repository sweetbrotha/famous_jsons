// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract FamousJsons is ERC721, Ownable {
    using Strings for uint256;

    uint256 public totalMinted;
    uint256 public lastMintBlock;
    string private _baseURIExtended;

    uint256 public constant TOTAL_SUPPLY = 25;
    uint256[45] private discountFactors;

    constructor() ERC721("Famous JSONs", "JSON") Ownable(msg.sender) {
        totalMinted = 0;
        lastMintBlock = block.number;
        _baseURIExtended = "https://famousjsons.com/metadata/json";
        // Pre-compute discount factors
        uint256 factor = 1 ether;
        for (uint256 i = 0; i < 45; i++) {
            discountFactors[i] = factor;
            factor = (factor * 75) / 100;
        }
    }

    function mintToken(address to, uint256 tokenId) public payable {
        require(tokenId >= 0 && tokenId < TOTAL_SUPPLY, "Invalid token ID");

        uint256 mintPrice = getCurrentMintPrice();
        require(msg.value >= mintPrice, "Insufficient funds sent");

        _safeMint(to, tokenId);

        totalMinted += 1;
        lastMintBlock = block.number;
    }

    function getCurrentMintPrice() public view returns (uint256) {
        if (totalMinted >= TOTAL_SUPPLY) return 0;
        uint256 initialPrice = totalMinted * 10 ether;
        uint256 blocksSinceLastMint = block.number - lastMintBlock;
        uint256 hoursSinceLastMint = blocksSinceLastMint / 300; // assume 12 seconds / block

        if (hoursSinceLastMint >= 45) return 0; // skip looping, price is free

        // Use pre-computed discount factor
        uint256 discountedPrice = (initialPrice * discountFactors[hoursSinceLastMint]) / 1 ether;
        // Truncate to nearest thousandth of ETH
        uint256 currentPrice = (discountedPrice / 1e15) * 1e15;

        if (currentPrice < 0.001 ether) {
            return 0; // price is below minimum threshold
        }
        return currentPrice;
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds available");
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseURIExtended = newBaseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIExtended;
    }
}