const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
const firestoreStateRef = db.doc("state/firestore");

const Web3 = require("web3");
const rpcURL = `https://goerli.infura.io/v3/${functions.config().infura.key}`;
const web3 = new Web3(rpcURL);
const contractAddress = "0x781D0b802A32224f0d6670Bbb5654A90B1C2a6A0";
const fs = require("fs");
const abiJsonFile = "./abi.json";
const abi = JSON.parse(fs.readFileSync(abiJsonFile));
const contract = new web3.eth.Contract(abi, contractAddress);

// blockchain constants
const GENESIS_BLOCK = 10314376;
const BLOCKS_PER_DISCOUNT = 300;
const NEAR_DISCOUNT_THRESHOLD = 20; // update frequently if closer to discount
const FREE_THRESHOLD_WEI = web3.utils.toBN(web3.utils.toWei("0.001", "ether"));
// state fields
const LAST_MINTED_BLOCK = "last_minted_block";
const TOKEN_IDS_MINTED = "token_ids_minted";
const CURRENT_MINT_PRICE = "current_mint_price";
const CURRENT_BLOCK = "current_block";
const BLOCKS_TIL_DISCOUNT = "blocks_til_discount";
const BLOCKS_TIL_FREE = "blocks_til_free";

const express = require("express");
const app = express();
const cors = require("cors")({
  origin: [
    "http://localhost:3000", // TODO: comment this out
    "https://famousjsons.com",
  ],
});

/**
 * Retrieve all 'Transfer' events since last mint
 * @param {number} fromBlock - where on Ethereum to start the scan
 * @return {Array} of matching blockchain events
 */
async function getPastTransferEvents(fromBlock) {
  return await contract.getPastEvents("Transfer", {
    fromBlock: fromBlock,
    toBlock: "latest",
  });
}

/**
 * Get all tokens referenced by events
 * @param {Array} events - blockchain-emitted events
 * @return {Array} of de-duped token IDs
 */
function eventsToTokenIds(events) {
  const tokenIds = new Set();
  events.forEach((event) => {
    const tokenId = event.returnValues.tokenId;
    if (tokenId) {
      tokenIds.add(tokenId);
    }
  });
  return Array.from(tokenIds);
}

/**
 * Get the current project state
 * @return {object} the stored firebase state
 */
async function getCurrentState() {
  const doc = await firestoreStateRef.get();
  if (doc.exists) return doc.data();
  const currentBlock = await web3.eth.getBlockNumber();
  return {
    [LAST_MINTED_BLOCK]: GENESIS_BLOCK,
    [TOKEN_IDS_MINTED]: [],
    [CURRENT_MINT_PRICE]: 0,
    [CURRENT_BLOCK]: currentBlock,
    [BLOCKS_TIL_DISCOUNT]: 0,
    [BLOCKS_TIL_FREE]: 0,
  };
}

/**
 * Re-write the project state
 * @return {object} the new state
 */
async function fetchAndUpdateProjectState() {
  try {
    const oldState = await getCurrentState();
    const oldTokenIds = oldState ? oldState[TOKEN_IDS_MINTED] : [];
    const fromBlock = oldState ? oldState[LAST_MINTED_BLOCK] : GENESIS_BLOCK;
    const pastEvents = await getPastTransferEvents(fromBlock);
    const recentTokenIds = eventsToTokenIds(pastEvents);
    const currentBlock = await web3.eth.getBlockNumber();

    // new state fields
    const allTokenIds =
      Array.from(new Set([...oldTokenIds, ...recentTokenIds]));
    const lastMintedBlock = await contract.methods.lastMintBlock().call();
    const currentMintPrice =
      await contract.methods.getCurrentMintPrice().call();
    let blocksTilDiscount = 0;
    if (currentMintPrice !== "0") {
      blocksTilDiscount = BLOCKS_PER_DISCOUNT -
          ((currentBlock - lastMintedBlock) % BLOCKS_PER_DISCOUNT);
    }
    let blocksTilFree = blocksTilDiscount;
    let price = web3.utils.toBN(currentMintPrice);
    price = price.muln(75).divn(100);
    while (price.gte(FREE_THRESHOLD_WEI)) {
      price = price.muln(75).divn(100);
      blocksTilFree += BLOCKS_PER_DISCOUNT;
    }

    const newState = {
      [LAST_MINTED_BLOCK]: lastMintedBlock,
      [TOKEN_IDS_MINTED]: allTokenIds,
      [CURRENT_MINT_PRICE]: currentMintPrice,
      [CURRENT_BLOCK]: currentBlock,
      [BLOCKS_TIL_DISCOUNT]: blocksTilDiscount,
      [BLOCKS_TIL_FREE]: blocksTilFree,
    };

    // Update Firestore with the new state
    await firestoreStateRef.set(newState);
    return newState;
  } catch (error) {
    console.error("Error fetching and updating project state:", error);
    return {"error": "fetching and updating failed"};
  }
}

// ============================================================================
// =========================== API Endpoints ==================================
// ============================================================================

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers",
      "Content-Type, Authorization, Content-Length, X-Requested-With");
  next();
});

app.post("/updateState", cors, async (_req, res) => {
  try {
    const state = await fetchAndUpdateProjectState();
    res.json({result: JSON.stringify(state)});
  } catch (error) {
    res.status(500).json(
        {error: `Failed to update firebase state: ${error.message}`});
  }
});

app.get("/getState", cors, async (_req, res) => {
  try {
    const state = await getCurrentState();
    res.json(state);
  } catch (error) {
    res.status(500).json(
        {error: `Failed to get firebase state: ${error.message}`});
  }
});

const runtimeOpts = {
  timeoutSeconds: 60, // 1 minute
  memory: "1GB", // Optional, increase the memory allocated
};

exports.fastUpdate = functions
    .runWith(runtimeOpts)
    .pubsub.schedule("every 1 minutes")
    .onRun(async () => {
      try {
        const state = await getCurrentState();
        const blocksTilDiscount = state[BLOCKS_TIL_DISCOUNT];
        if (blocksTilDiscount > 0 &&
            blocksTilDiscount <= NEAR_DISCOUNT_THRESHOLD) {
          // Perform update because we're close to a discount event
          await fetchAndUpdateProjectState();
        }
      } catch (error) {
        console.error("Failure during scheduled fastUpdate:", error);
      }
    });

exports.slowUpdate = functions
    .runWith(runtimeOpts)
    .pubsub.schedule("every 3 minutes")
    .onRun(async () => {
      try {
        await fetchAndUpdateProjectState();
      } catch (error) {
        console.error("Failure during scheduled slowUpdate:", error);
      }
      return null;
    });

// Export the API
exports.api = functions.runWith(runtimeOpts).https.onRequest(app);
