// Auto-generated from contracts/NullhoodMarkets.sol by scripts/compile-contract.mjs
export const NULLHOOD_MARKETS_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "ContractPaused",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "unlockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "CreatorSeedLocked",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyQuestion",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InsufficientShares",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidFeeConfiguration",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidMarket",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuard",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SlippageExceeded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SolvencyInvariantViolated",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "StringTooLong",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "provided",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minimum",
        "type": "uint256"
      }
    ],
    "name": "TradeBelowMinimum",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Unauthorized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAmount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "claimIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CreatorFeesClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "creatorFeeBps",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "protocolFeeBps",
        "type": "uint256"
      }
    ],
    "name": "FeeConfigurationUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "question",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "imageUri",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "sourceHandle",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "MarketCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "trader",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isYes",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isBuy",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ethAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "shareAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newYesPriceWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newNoPriceWei",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "yesSentimentBps",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "OpinionTraded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isPaused",
        "type": "bool"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "triggeredBy",
        "type": "address"
      }
    ],
    "name": "PausedStateChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "ProtocolFeesClaimed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BPS_DENOMINATOR",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CREATOR_FEE_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CREATOR_SEED_LOCK_PERIOD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CURVE_INVARIANT_K",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "INITIAL_VIRTUAL_ETH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "INITIAL_VIRTUAL_SHARES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_STRING_LENGTH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_TOTAL_FEE_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_TRADE_ETH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PROTOCOL_FEE_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TOTAL_FEE_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isYes",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "minSharesOut",
        "type": "uint256"
      }
    ],
    "name": "buyShares",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "sharesOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimCreatorFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "claimProtocolFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "claimableCreatorFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "claimedCreatorFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "question",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imageUri",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "sourceHandle",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "initialSideIsYes",
        "type": "bool"
      }
    ],
    "name": "createMarket",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "creatorClaimCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creatorFeeBps",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "creatorSeedLockUntil",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "creatorVolumeGeneratedWei",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllMarkets",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "question",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "category",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "imageUri",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "sourceHandle",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalTrades",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "creatorFeesEarned",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesRealEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noRealEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesTotalShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noTotalShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesVolumeEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noVolumeEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesPriceWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noPriceWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesSentimentBps",
            "type": "uint256"
          }
        ],
        "internalType": "struct NullhoodMarkets.MarketSummary[]",
        "name": "list",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      }
    ],
    "name": "getMarket",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "question",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "category",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "imageUri",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "sourceHandle",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalTrades",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "creatorFeesEarned",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesRealEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noRealEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesTotalShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noTotalShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesVolumeEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noVolumeEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesPriceWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noPriceWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesSentimentBps",
            "type": "uint256"
          }
        ],
        "internalType": "struct NullhoodMarkets.MarketSummary",
        "name": "summary",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      }
    ],
    "name": "getMarketAnalytics",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "yesBuyVolumeEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesSellVolumeEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noBuyVolumeEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noSellVolumeEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesTrades",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noTrades",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "uniqueTraders",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "peakYesPriceWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "peakNoPriceWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastTradeAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct NullhoodMarkets.MarketAnalytics",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getMarketsPaginated",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "question",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "category",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "imageUri",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "sourceHandle",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalTrades",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "creatorFeesEarned",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesRealEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noRealEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesTotalShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noTotalShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesVolumeEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noVolumeEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesPriceWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noPriceWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesSentimentBps",
            "type": "uint256"
          }
        ],
        "internalType": "struct NullhoodMarkets.MarketSummary[]",
        "name": "list",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserPositions",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "marketId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noShares",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "yesValueEth",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "noValueEth",
            "type": "uint256"
          }
        ],
        "internalType": "struct NullhoodMarkets.UserPosition[]",
        "name": "positions",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "marketsCreated",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalTrades",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalVolumeWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "uniqueMarketsTraded",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "creatorVolumeGeneratedWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "claimableCreatorFeesWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lifetimeCreatorFeesWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalCreatorFeesClaimedWei",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "creatorClaimCount",
            "type": "uint256"
          }
        ],
        "internalType": "struct NullhoodMarkets.UserOnChainStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasTradedMarket",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "lifetimeCreatorFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "marketCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "noBalances",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "protocolFeeBps",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "protocolFeesAccrued",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isYes",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "ethIn",
        "type": "uint256"
      }
    ],
    "name": "quoteBuy",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "sharesOut",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "feeEth",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "newPriceWei",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isYes",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "sharesIn",
        "type": "uint256"
      }
    ],
    "name": "quoteSell",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "netEthOut",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "feeEth",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "newPriceWei",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isYes",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "sharesIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minEthOut",
        "type": "uint256"
      }
    ],
    "name": "sellShares",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "netEthOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_creatorFeeBps",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_protocolFeeBps",
        "type": "uint256"
      }
    ],
    "name": "setFeeConfiguration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_paused",
        "type": "bool"
      }
    ],
    "name": "setPaused",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalClaimableCreatorFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalFeeBps",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRealEthLocked",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userMarketsCreated",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userTotalTrades",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userTotalVolumeWei",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userUniqueMarketsTraded",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "verifyProtocolSolvency",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isSolvent",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "contractEthBalance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "realEthReserves",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pendingCreatorFees",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pendingProtocolFees",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "surplusWei",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "yesBalances",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const NULLHOOD_MARKETS_BYTECODE: `0x${string}` = "0x608080604052346035576064600281905560035560016017555f80546001600160a01b03191633179055613151908161003a8239f35b5f80fdfe608060405260033611610010575f80fd5b5f3560e01c80630176aa87146121e057806304cada1f146121a857806306e2d39c14612170578063113838a11461214c57806316c38b3c146120d457806317773ebb146120b75780631bb190af1461207f5780631f7f12dc146120365780632443200714611ffe57806326d7700714611fde5780632a6bc2dd14611d6d57806334ccc5ea14611d51578063351fee4614611c6557806335659fb814611c485780633654ff9614611c105780633678923a14611be557806339b4637214611955578063431a9caa1461193957806345b18f2514611917578063478ba675146118df5780634b812414146111765780634e43603a1461101957806350a87b3b14610fd55780635c975abb14610fb057806367eb3ed114610f9357806369ce6d4714610ee65780636f28507c14610ecb578063717bd21d14610e9657806373673f93146108a157806379ba5097146108305780638da5cb5b146108095780638f1a5f4f146107d157806394af82011461077f5780639a75ea6c14610705578063aec572f9146106cd578063b0772d0b1461063e578063b621e75a14610621578063be37822814610569578063be489060146105dd578063c3c9c97a146105b3578063c55b5f6114610597578063c56f84cf1461056e578063cc3cbd2a14610569578063cd03ada81461054c578063d3519aa314610514578063d8a8f35a146104dc578063e1a45218146104c0578063e30c397814610498578063eb44fdd314610459578063ec9790821461043c578063f2fde38b146103aa5763f8ff0b0b14610254575f80fd5b346103a65760203660031901126103a6576004355f610120604051610278816124c1565b8281528260208201528260408201528260608201528260808201528260a08201528260c08201528260e08201528261010082015201528015801561039b575b61038c575f52600960205261014060405f206040516102d5816124c1565b81549182825260018101546020830190815260028201546040840190815260038301546060850190815260048401546080860190815260058501549160a0870192835260068601549360c0880194855260078701549560e08901968752610120600960088a0154996101008c019a8b5201549901988952604051998a525160208a01525160408901525160608801525160808701525160a08601525160c08501525160e08401525161010083015251610120820152f35b639db8d5b160e01b5f5260045ffd5b5060045481116102b7565b5f80fd5b346103a65760203660031901126103a6576103c3612252565b5f546001600160a01b0316903382900361042e576001600160a01b031690811561041f57600180546001600160a01b031916831790557f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227005f80a3005b63d92e233d60e01b5f5260045ffd5b6282b42960e81b5f5260045ffd5b346103a6575f3660031901126103a6576020600454604051908152f35b346103a65760203660031901126103a65761049461048060043561047b612957565b612af7565b60405191829160208352602083019061231b565b0390f35b346103a6575f3660031901126103a6576001546040516001600160a01b039091168152602090f35b346103a6575f3660031901126103a65760206040516127108152f35b346103a65760203660031901126103a6576001600160a01b036104fd612252565b165f526014602052602060405f2054604051908152f35b346103a65760203660031901126103a6576001600160a01b03610535612252565b165f526013602052602060405f2054604051908152f35b346103a6575f3660031901126103a6576020600654604051908152f35b612471565b346103a6575f3660031901126103a657602061058f6002546003549061248c565b604051908152f35b346103a6575f3660031901126103a65760206040516107088152f35b346103a65760203660031901126103a6576004355f526011602052602060405f2054604051908152f35b346103a65760403660031901126103a6576105f6612268565b6004355f52600c60205260405f209060018060a01b03165f52602052602060405f2054604051908152f35b346103a6575f3660031901126103a6576020600754604051908152f35b346103a6575f3660031901126103a65760045461065a816129dc565b9060015b8181111561067c576040516020808252819061049490820186612419565b6106888161047b612957565b5f19820191908183116106b957826106ae916106a76106b49588612576565b5285612576565b5061254d565b61065e565b634e487b7160e01b5f52601160045260245ffd5b346103a6576106fb6106e76106e1366122e1565b90612a2b565b604051928392604084526040840190612419565b9060208301520390f35b346103a657610713366122e1565b5f546001600160a01b0316330361042e576101f4610731828461248c565b1161077057816040917fb811794cdbbd3b3edd8c81a126a22715321f54152ed5a78b0be23b6b76ee79bc936002558060035582519182526020820152a1005b63369276d760e11b5f5260045ffd5b346103a65761078d36612291565b8291921580156107c6575b61038c57610494926107a992612828565b604080519384526020840192909252908201529081906060820190565b506004548211610798565b346103a65760203660031901126103a6576001600160a01b036107f2612252565b165f526012602052602060405f2054604051908152f35b346103a6575f3660031901126103a6575f546040516001600160a01b039091168152602090f35b346103a6575f3660031901126103a6576001546001600160a01b038116903382900361042e575f80546001600160a01b0319808216851783559092166001556001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b346103a65760803660031901126103a6576024356004358115158083036103a65760443591600160175403610e8757600260175560ff60015460a01c16610e785780158015610e6d575b61038c578215610dc2575f8181526008602052604090206001810180546001600160a01b0316959194919033871480610e58575b610e38578115610e1a575f848152600b602090815260408083203384529091529020545b838110610e0b578215610e0257600987015b600181019061096586835461248c565b916969e10de76676d08000008311610df0575b6c02deaf189c140c16b7c528f67960281b92808401908185116106b9575f1982019182116106b9576109a99161267e565b6706f05b59d3b200008110610de1575b82549080821115610dd9576109cd91612499565b809b60028401918254809111610dd1575b508c15610dc2578c9b8c916002546109f6908461227e565b61271090048093600354610a099161227e565b61271090049e8f91610a1a91612499565b90610a2491612499565b9d8e60643511610db357600793610a96925f52600d60205260405f20610a4b82825461248c565b905560018060a01b038b54165f52600e60205260405f20610a6d82825461248c565b9055610a7b8160065461248c565b600655610a8d6008850191825461248c565b9055835461248c565b825501805490600182018092116106b95755610ab38c8254612499565b8091556706f05b59d3b2000001806706f05b59d3b20000116106b957825560038201610ae0888254612499565b8091556969e10de76676d080000003916969e10de76676d080000083116106b957610b3092825560048101610b168d825461248c565b9055610b248c600554612499565b6005555490549061227e565b10610da457838315610d7d57610b4591612499565b5f858152600b602090815260408083203384529091529020555b545f848152600960209081526040808320600a835281842033855290925282205491936001600160a01b0390931692909160ff1615610d21575b15610cfb576004810180549060018201809211610ce757558215610cd157610bc288825461248c565b81555b60094291015533825260136020526040822080549060018201809211610cbd57906040939291553382526014602052828220610c0289825461248c565b90558152601660205220610c1786825461248c565b90555f80808087335af1610c296125b9565b5015610cae57602094610c3a612c51565b825f5260088652610c4d60405f2061307c565b9390926040519687525f8988015260408701526060860152608085015260a084015260c08301524260e08301527f119770bcf0c9631339b568a4dcc973c3f05919742aafd1488cfab86e81be8fc96101003393a36001601755604051908152f35b6312171d8360e31b5f5260045ffd5b634e487b7160e01b84526011600452602484fd5b60018101610ce089825461248c565b9055610bc5565b634e487b7160e01b85526011600452602485fd5b915060058201805490600182018092116106b957555f9160038101610ce089825461248c565b855f52600a60205260405f2060018060a01b0333165f5260205260405f20600160ff1982541617905560068201805490600182018092116106b95755335f52601560205260405f20805490600182018092116106b95755610b99565b610d8691612499565b5f858152600c60209081526040808320338452909152902055610b5f565b63e8a51ef360e01b5f5260045ffd5b638199f5f360e01b5f5260045ffd5b631f2a200560e01b5f5260045ffd5b9c508d6109de565b50505f6109cd565b506706f05b59d3b200006109b9565b6969e10de76676d08000009250610978565b600e8701610955565b633999656760e01b5f5260045ffd5b5f848152600c60209081526040808320338452909152902054610943565b5f84815260116020526040812054632d382c6160e01b8252600452602490fd5b50835f52601160205260405f2054421061091f565b5060045481116108eb565b63ab35696f60e01b5f5260045ffd5b6345f5ce8b60e11b5f5260045ffd5b346103a657610ea436612291565b829192158015610ec0575b61038c57610494926107a99261273d565b506004548211610eaf565b346103a6575f3660031901126103a657602060405160c88152f35b346103a65760203660031901126103a657610eff612252565b600160175403610e875760026017555f546001600160a01b0316330361042e576001600160a01b03811690811561041f57600754908115610dc2575f8080848194826007555af1610f4e6125b9565b5015610cae5760407ffb2ef6ae65fe7cd7752678feb2a45eaee660236a6a14f929449fecb75118e9a491610f80612c51565b8151908152426020820152a26001601755005b346103a6575f3660031901126103a6576020600554604051908152f35b346103a6575f3660031901126103a657602060ff60015460a01c166040519015158152f35b346103a65760403660031901126103a657610fee612268565b6004355f52600b60205260405f209060018060a01b03165f52602052602060405f2054604051908152f35b346103a65760203660031901126103a657610120611035612252565b5f610100604051611045816124dd565b8281528260208201528260408201528260608201528260808201528260a08201528260c08201528260e0820152015260018060a01b0316805f52601260205260405f205490805f52601360205260405f205490805f52601460205260405f2054815f52601560205260405f2054825f52601660205260405f2054835f52600d60205260405f205491845f52600e60205260405f205493855f52600f60205260405f2054955f52601060205260405f205496610100604051611105816124dd565b8a81526020810192835260408101938452606081019485526080810195865260a0810196875260c0810197885260e08101988952019788526040519889525160208901525160408801525160608701525160808601525160a08501525160c08401525160e083015251610100820152f35b60a03660031901126103a6576004356001600160401b0381116103a6576111a19036906004016122b4565b6024356001600160401b0381116103a6576111c09036906004016122b4565b6044929192356001600160401b0381116103a6576111e29036906004016122b4565b91906064356001600160401b0381116103a6576112039036906004016122b4565b96906084359788151589036103a657600160175403610e8757600260175560ff60015460a01c16610e785786156118d057610200871180156118c6575b80156118bb575b80156118b1575b6118a257341515968780611893575b6118765761126c60045461254d565b9889600455895f52600860205260405f20968a885560018801336bffffffffffffffffffffffff60a01b825416179055600288016001600160401b0384116116ea576112c2846112bc83546125e8565b83612620565b5f84601f811160011461181257806112ee925f91611672575b508160011b915f199060031b1c19161790565b90555b806117db575050604051611306604082612515565b60088152675472656e64696e6760c01b6020820152955b865160038201976001600160401b0382116116ea57611346826113408b546125e8565b8b612620565b602090601f83116001146117785761137592915f918361176d575b50508160011b915f199060031b1c19161790565b87555b600481016001600160401b0389116116ea57611398896112bc83546125e8565b5f89601f811160011461170957806113c3925f916116fe57508160011b915f199060031b1c19161790565b90555b600581016001600160401b0384116116ea576113e6846112bc83546125e8565b835f601f821160011461167d5791611417825f9593601295879161167257508160011b915f199060031b1c19161790565b90555b42600682015582608060405161142f816124a6565b6706f05b59d3b2000081526969e10de76676d0800000602082015282604082015282606082015201526706f05b59d3b2000060098201556969e10de76676d0800000600a82015582600b82015582600c82015582600d820155826080604051611497816124a6565b6706f05b59d3b2000081526969e10de76676d0800000602082015282604082015282606082015201526706f05b59d3b20000600e8201556969e10de76676d0800000600f82015582601082015582601182015501556040516114f8816124c1565b5f815260098a602083015f8152604084015f8152606085015f8152608086015f815260a08701905f825260c08801925f845260e089019464e8d4a5100086526101008a019664e8d4a5100088526101208b0198428a525f528960205260405f209a518b555160018b01555160028a015551600389015551600488015551600587015551600686015551600785015551600884015551910155335f52601260205260405f2094855497600189018099116106b9576115fe8b986115f061161a9861160c9660a09d7fb7aef9931b82010147e88d0a62eac57cb50e3c5d582574439492e5ebf0af70349c556040519d8e818152019161269c565b908b820360208d01526126bc565b9189830360408b015261269c565b91868303606088015261269c565b924260808201528033940390a3611644575b602090611637612c51565b6001601755604051908152f35b61070842018042116106b95760209261166c91835f526011855260405f205534903384612c74565b5061162c565b90508901355f6112db565b5f8381526020812092508690601f198216905b8181106116cf5750915f95939160129593106116b6575b5050600186811b01905561141a565b851960f88960031b161c19908901351690558e806116a7565b89840135855560019094019360209384019389935001611690565b634e487b7160e01b5f52604160045260245ffd5b90508901358f6112db565b50601f198a1690825f528a60205f20925f5b8b8282106117535750501061173a575b5050600189811b0190556113c6565b8801355f1960038c901b60f8161c191690558c8061172b565b84013585556001909401936020938401938e93500161171b565b015190508e80611361565b90601f198316918a5f52815f20925f5b8181106117c357509084600195949392106117ab575b505050811b018755611378565b01515f1960f88460031b161c191690558d808061179e565b92936020600181928786015181550195019301611788565b6117e48161259e565b916117f26040519384612515565b81835236828201116103a657815f9260209283860137830101529561131d565b50601f19851690825f528560205f20925f5b8b82821061185c57505010611843575b5050600184811b0190556112f1565b8801355f19600387901b60f8161c191690558d80611834565b840135855560019094019360209384019389935001611824565b6308b504ff60e31b5f5234600452655af3107a400060245260445ffd5b50655af3107a4000341061125d565b631623655b60e31b5f5260045ffd5b506080811161124e565b506102008611611247565b5060408511611240565b630d5003f360e01b5f5260045ffd5b346103a65760203660031901126103a6576001600160a01b03611900612252565b165f526016602052602060405f2054604051908152f35b346103a6575f3660031901126103a65760206040516706f05b59d3b200008152f35b346103a6575f3660031901126103a65760206040516101f48152f35b61195e36612291565b90600160175403610e8757600260175560ff60015460a01c16610e785782158015611bda575b61038c573415610dc257655af3107a4000341061187657825f52600860205260405f2090805f14611bd157600982015b6127106119c36002543461227e565b04926127106119d46003543461227e565b04916119e9836119e48734612499565b612499565b600282016119f882825461248c565b92836706f05b59d3b2000001806706f05b59d3b20000116106b9576c02deaf189c140c16b7c528f67960281b948186018087116106b9575f1981019081116106b95782611a449161267e565b60018401805490959180821115611bc857611a5e91612499565b9b5b8c15908115611bbe575b50610db35755815560038101611a818a825461248c565b8091556969e10de76676d0800000036969e10de76676d080000081116106b957611ac493610b2491845560048301611aba34825461248c565b905560055461248c565b10610da457611b49600792845f14611b8e57875f52600b60205260405f2060018060a01b0333165f5260205260405f20611aff88825461248c565b90555b600183019560018060a01b038754165f52600d60205260405f20611b2782825461248c565b905560018060a01b038754165f52600e60205260405f20610a6d82825461248c565b82550193845491600183018093116106b957611b7d611b8694869460209855823491339060018060a01b0390541686612e76565b34913390612fc7565b611637612c51565b875f52600c60205260405f2060018060a01b0333165f5260205260405f20611bb788825461248c565b9055611b02565b90508c108e611a6a565b50505f9b611a60565b600e82016119b4565b506004548311611984565b346103a6575f3660031901126103a65760206c02deaf189c140c16b7c528f67960281b604051908152f35b346103a65760203660031901126103a6576001600160a01b03611c31612252565b165f526010602052602060405f2054604051908152f35b346103a6575f3660031901126103a6576020600354604051908152f35b346103a6575f3660031901126103a657600160175403610e87576002601755335f52600d60205260405f20548015610dc257335f52600d6020525f6040812055611cb181600654612499565b600655335f52600f60205260405f20611ccb82825461248c565b9055335f52601060205260405f2090611ce4825461254d565b8092555f80808084335af1611cf76125b9565b5015610cae57602091611d08612c51565b604080518381526020810192909252429082015233907f5c0244eed6965417b3a6bf8a8f7d0f39a05e2c1c362b34d9bc88f936b7905b7190606090a26001601755604051908152f35b346103a6575f3660031901126103a65760206040516102008152f35b346103a65760203660031901126103a657611d86612252565b60045490611d9382612536565b91611da16040519384612515565b808352601f19611db082612536565b015f5b818110611fa9575090916001600160a01b0316905060015b82811115611e4357836040518091602082016020835281518091526020604084019201905f5b818110611dff575050500390f35b91935091602060a060019260808751805183528481015185840152604081015160408401526060810151606084015201516080820152019401910191849392611df1565b805f52600b60205260405f20825f5260205260405f205490805f52600c60205260405f20835f5260205260405f20545f5f9184611f49575b80611ecf575b60405194611e8e866124a6565b84865260208601526040850152606084015260808301525f198101918183116106b957826106ae91611ec3611eca9589612576565b5286612576565b611dcb565b91506040516394af820160e01b81528360048201525f6024820152826044820152606081606481305afa908115611f3e575f91611f0e575b5091611e81565b611f2f915060603d8111611f37575b611f278183612515565b81019061255b565b505088611f07565b503d611f1d565b6040513d5f823e3d90fd5b90506040516394af820160e01b815283600482015260016024820152846044820152606081606481305afa908115611f3e575f91611f89575b5090611e7b565b611fa1915060603d8111611f3757611f278183612515565b505088611f82565b602090604051611fb8816124a6565b5f81525f838201525f60408201525f60608201525f608082015282828801015201611db3565b346103a6575f3660031901126103a6576020604051655af3107a40008152f35b346103a65760203660031901126103a6576001600160a01b0361201f612252565b165f52600e602052602060405f2054604051908152f35b346103a65760403660031901126103a65761204f612268565b6004355f52600a60205260405f209060018060a01b03165f52602052602060ff60405f2054166040519015158152f35b346103a65760203660031901126103a6576001600160a01b036120a0612252565b165f526015602052602060405f2054604051908152f35b346103a6575f3660031901126103a6576020600254604051908152f35b346103a65760203660031901126103a6576004358015158091036103a6575f546001600160a01b0316330361042e576001805460ff60a01b191660a083901b60ff60a01b1617905560405190815233907f553d0173aaf3da5fa192882a6593e57e95cbf10b294e2e1d5e60806cbeced46290602090a2005b346103a6575f3660031901126103a65760206040516969e10de76676d08000008152f35b346103a65760203660031901126103a6576001600160a01b03612191612252565b165f52600f602052602060405f2054604051908152f35b346103a65760203660031901126103a6576001600160a01b036121c9612252565b165f52600d602052602060405f2054604051908152f35b346103a6575f3660031901126103a65760c04760055490600654600754906122118261220c838761248c565b61248c565b808410801595919061224a576122279085612499565b935b604051958652602086015260408501526060840152608083015260a0820152f35b505f93612229565b600435906001600160a01b03821682036103a657565b602435906001600160a01b03821682036103a657565b818102929181159184041417156106b957565b60609060031901126103a6576004359060243580151581036103a6579060443590565b9181601f840112156103a6578235916001600160401b0383116103a657602083818601950101116103a657565b60409060031901126103a6576004359060243590565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b908151815260018060a01b0360208301511660208201526102208061239061237e61236c61235a604088015161024060408901526102408801906122f7565b606088015187820360608901526122f7565b608087015186820360808801526122f7565b60a086015185820360a08701526122f7565b9360c081015160c085015260e081015160e08501526101008101516101008501526101208101516101208501526101408101516101408501526101608101516101608501526101808101516101808501526101a08101516101a08501526101c08101516101c08501526101e08101516101e0850152610200810151610200850152015191015290565b9080602083519182815201916020808360051b8301019401925f915b83831061244457505050505090565b9091929394602080612462600193601f19868203018752895161231b565b97019301930191939290612435565b346103a6575f3660031901126103a657602060405160648152f35b919082018092116106b957565b919082039182116106b957565b60a081019081106001600160401b038211176116ea57604052565b61014081019081106001600160401b038211176116ea57604052565b61012081019081106001600160401b038211176116ea57604052565b61024081019081106001600160401b038211176116ea57604052565b90601f801991011681019081106001600160401b038211176116ea57604052565b6001600160401b0381116116ea5760051b60200190565b5f1981146106b95760010190565b908160609103126103a6578051916040602083015192015190565b805182101561258a5760209160051b010190565b634e487b7160e01b5f52603260045260245ffd5b6001600160401b0381116116ea57601f01601f191660200190565b3d156125e3573d906125ca8261259e565b916125d86040519384612515565b82523d5f602084013e565b606090565b90600182811c92168015612616575b602083101461260257565b634e487b7160e01b5f52602260045260245ffd5b91607f16916125f7565b919091601f8311612631575b505050565b81831161263d57505050565b5f5260205f206020601f830160051c9210612676575b81601f9101920160051c03905f5b8281101561262c575f82820155600101612661565b5f9150612653565b8115612688570490565b634e487b7160e01b5f52601260045260245ffd5b908060209392818452848401375f828201840152601f01601f1916010190565b5f92918154916126cb836125e8565b808352926001811690811561272057506001146126e757505050565b5f9081526020812093945091925b838310612706575060209250010190565b6001816020929493945483858701015201910191906126f5565b915050602093945060ff929192191683830152151560051b010190565b821561281d575f52600860205260405f20905f1461281457600901915b6127976127906127896127106127726002548761227e565b046127106127826003548861227e565b049061248c565b8094612499565b845461248c565b6c02deaf189c140c16b7c528f67960281b8181018091116106b9575f1981019081116106b9576127c98260019261267e565b940154848082111561280c576127de91612499565b93670de0b6b3a7640000820291808304670de0b6b3a764000014901517156106b9576128099161267e565b90565b50505f6127de565b600e019161275a565b5050505f905f905f90565b90821561281d57612854915f52600860205260405f20905f1461294e57600901915b600183015461248c565b916969e10de76676d0800000831161293c575b6c02deaf189c140c16b7c528f67960281b8381018091116106b9575f1981019081116106b957836128979161267e565b926706f05b59d3b20000841061292c575b82549380851115612925576128bd9085612499565b60028194015480911161291d575b506128f26128e16127106127726002548761227e565b936128ec8582612499565b95612499565b90670de0b6b3a7640000820291808304670de0b6b3a764000014901517156106b9576128099161267e565b92505f6128cb565b505f6128bd565b6706f05b59d3b2000093506128a8565b6969e10de76676d08000009250612867565b600e019161284a565b60405190612964826124f9565b5f610220838281528260208201526060604082015260608082015260606080820152606060a08201528260c08201528260e08201528261010082015282610120820152826101408201528261016082015282610180820152826101a0820152826101c0820152826101e0820152826102008201520152565b906129e682612536565b6129f36040519182612515565b8281528092612a04601f1991612536565b01905f5b828110612a1457505050565b602090612a1f612957565b82828501015201612a08565b9160045491828410801590612aef575b612ab357612a498484612499565b90808211612aab575b50612a5c816129dc565b935f5b828110612a6b57505050565b612a75818361248c565b90600182018092116106b957612a8f60019261047b612957565b612a998289612576565b52612aa48188612576565b5001612a5f565b90505f612a52565b50909150604051612ac5602082612515565b5f81525f805b818110612ad85750509190565b602090612ae3612957565b82828601015201612acb565b508015612a3b565b5080158015612c46575b61038c575f52600860205260405f20612b198161307c565b91835493600160a01b6001900360018201541690600681015460078201546008830154600b840154601085015491600c86015493601187015495600d880154976012810154996040519e8f90612b6e826124f9565b8152602001526040518e81612b8681600286016126bc565b03612b919083612515565b604001528d6040519081806003850190612baa916126bc565b03612bb59083612515565b606001526040518e81612bcb81600486016126bc565b03612bd69083612515565b608001528d60405180600581940190612bee916126bc565b03612bf99083612515565b60a0015260c08d015260e08c01526101008b01526101208a01526101408901526101608801526101808701526101a08601526101c08501526101e084015261020083015261022082015290565b506004548111612b01565b612c6c612c636005546006549061248c565b6007549061248c565b4710610da457565b91909392825f52600860205260405f2091805f14612e6c5760098301955b612710612ca16002548561227e565b0494612710612cb26003548661227e565b04612cc1816119e48988612499565b9560028a0199612cd2888c5461248c565b97886706f05b59d3b2000001806706f05b59d3b20000116106b9576c02deaf189c140c16b7c528f67960281b928184018085116106b9575f1981019081116106b95782612d1e9161267e565b60018201805490939180821115612e6357612d3891612499565b9b5b8c9f8d158015612e5c575b610db35755815560038101612d5b8c825461248c565b8091556969e10de76676d0800000036969e10de76676d080000081116106b957612d9493610b2491845560048301611aba8d825461248c565b10610da457612df7600792865f14612e2c57845f52600b60205260405f2060018060a01b0387165f5260205260405f20612dcf8a825461248c565b90555b600183019960018060a01b038b54165f52600d60205260405f20610a4b82825461248c565b825501805496600188018098116106b95784848792612e2a9a612e25955560018060a01b0390541685612e76565b612fc7565b565b845f52600c60205260405f2060018060a01b0387165f5260205260405f20612e558a825461248c565b9055612dd2565b505f612d45565b50505f9b612d3a565b600e830195612c92565b9092815f52600960205260405f2091805f52600a60205260405f2060018060a01b0385165f5260205260ff60405f20541615612f60575b5015612f375760048101805490600182018092116106b95755612ed184825461248c565b81555b60094291015560018060a01b0316805f52601360205260405f20805490600182018092116106b957555f52601460205260405f20612f1383825461248c565b905560018060a01b03165f526016602052612f3360405f2091825461248c565b9055565b60058101805490600182018092116106b9575560028101612f5985825461248c565b9055612ed4565b5f52600a60205260405f2060018060a01b0384165f5260205260405f20600160ff1982541617905560068201805490600182018092116106b957556001600160a01b0383165f908152601560205260409020805460018101919082106106b957555f612ead565b92907f119770bcf0c9631339b568a4dcc973c3f05919742aafd1488cfab86e81be8fc9929461010092855f52600860205261300460405f2061307c565b939092885f52600960205283600860405f20856007820180548211613074575b5050018054821161306c575b5050604080519a15158b52600160208c01528a01526060890152608088015260a087015260c08601524260e08601526001600160a01b031693a3565b55835f613030565b55855f613024565b906009820154670de0b6b3a7640000810290808204670de0b6b3a764000014901517156106b957600a8301546130b19161267e565b91600e810154670de0b6b3a7640000810290808204670de0b6b3a764000014901517156106b957600f6130e69201549061267e565b906130f1828461248c565b806130fd575061138890565b61271084029084820461271014851517156106b9576128099161267e56fea264697066735822122034ff9fb5697caa5d83f87f455d3078834e35c620264ef39a0edbaf87a0fbdda964736f6c63430008260033";

export const TIRED_FUN_MARKETS_ABI = NULLHOOD_MARKETS_ABI;
export const TIRED_FUN_MARKETS_BYTECODE = NULLHOOD_MARKETS_BYTECODE;
