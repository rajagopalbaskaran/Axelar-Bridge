import { Contract, getDefaultProvider } from 'ethers';
import { AxelarQueryAPI, Environment, EvmChain, GasToken } from '@axelar-network/axelarjs-sdk';

import ERC721 from '../artifacts/contracts/ERC721demo.sol/ERC721Demo.json';
import NftLinker from '../artifacts/contracts/NFTLinker.sol/NFTLinker.json';
import { isTestnet, wallet } from '../config/constants';
import { defaultAbiCoder, keccak256 } from 'ethers/lib/utils';
import { sleep } from './sleep';

const tokenId = 0;

let chains = isTestnet ? require('../config/testnet.json') : require('../config/local.json');

const moonbeamChain = chains.find((chain: any) => chain.name === 'Moonbeam') as any;
const avalancheChain = chains.find((chain: any) => chain.name === 'Avalanche') as any;
// const ethereumChain = chains.find((chain: any) => chain.name === 'Ethereum') as any;
// const fantomChain = chains.find((chain: any) => chain.name === 'Fantom') as any;
// const polygonChain = chains.find((chain: any) => chain.name === 'Polygon') as any;

export function updateContractsOnChainConfig(chain: any): void {
    chain.wallet = wallet.connect(getDefaultProvider(chain.rpc));
    chain.contract = new Contract(chain.nftLinker as string, NftLinker.abi, chain.wallet);
    chain.erc721 = new Contract(chain.erc721 as string, ERC721.abi, chain.wallet);
}
updateContractsOnChainConfig(moonbeamChain);
updateContractsOnChainConfig(avalancheChain);
// updateContractsOnChainConfig(ethereumChain);
// updateContractsOnChainConfig(fantomChain);
// updateContractsOnChainConfig(polygonChain);

export async function sendNftToDest(onSrcConfirmed: (txHash: string) => void, onSent: (ownerInfo: any) => void) {
    const owner = await ownerOf();

    console.log({owner})

    console.log('--- Initially ---', owner);
    await print();

    const gasFee = getGasFee(EvmChain.MOONBEAM , EvmChain.AVALANCHE, GasToken.AVAX);

    await (await moonbeamChain.erc721.approve(moonbeamChain.contract.address, owner.tokenId)).wait();
    const tx = await (
        await moonbeamChain.contract.sendNFT(moonbeamChain.erc721.address, owner.tokenId, avalancheChain.name, wallet.address, {
            value: gasFee,
        })
    ).wait();

    console.log('tx', tx);

    onSrcConfirmed(tx.transactionHash);

    while (true) {
        const owner = await ownerOf();
        if (owner.chain == avalancheChain.name) {
            onSent(owner);
            break;
        }
        await sleep(2000);
    }

    console.log('--- Then ---');
    await print();
}
// export async function sendNftToPoly(onSrcConfirmed: (txHash: string) => void, onSent: (ownerInfo: any) => void) {
//     const owner = await ownerOf();

//     console.log({owner})

//     console.log('--- Initially ---', owner);
//     await print();

//     const gasFee = getGasFee(EvmChain.FANTOM , EvmChain.POLYGON, GasToken.AVAX);

//     await (await fantomChain.erc721.approve(fantomChain.contract.address, owner.tokenId)).wait();
//     const tx = await (
//         await fantomChain.contract.sendNFT(fantomChain.erc721.address, owner.tokenId, polygonChain.name, wallet.address, {
//             value: gasFee,
//         })
//     ).wait();

//     console.log('tx', tx);

//     onSrcConfirmed(tx.transactionHash);

//     while (true) {
//         const owner = await ownerOf();
//         if (owner.chain == polygonChain.name) {
//             onSent(owner);
//             break;
//         }
//         await sleep(2000);
//     }

//     console.log('--- Then ---');
//     await print();
// }

export async function sendNftBack(onSrcConfirmed: (txHash: string) => void, onSent: (ownerInfo: any) => void) {
    const owner = await ownerOf();

    console.log('--- Initially ---', owner);
    await print();

    const gasFee = getGasFee(EvmChain.AVALANCHE, EvmChain.MOONBEAM, GasToken.GLMR);

    const tx = await (
        await avalancheChain.contract.sendNFT(avalancheChain.contract.address, owner.tokenId, moonbeamChain.name, wallet.address, {
            value: gasFee,
        })
    ).wait();

    console.log('tx back', tx);

    onSrcConfirmed(tx.transactionHash);

    while (true) {
        const owner = await ownerOf();
        if (owner.chain == moonbeamChain.name) {
            onSent(owner);
            break;
        }
        await sleep(2000);
    }

    console.log('--- Then ---');
    await print();
}

// export async function sendNftBackToPoly(onSrcConfirmed: (txHash: string) => void, onSent: (ownerInfo: any) => void) {
//     const owner = await ownerOf();

//     console.log('--- Initially ---', owner);
//     await print();

//     const gasFee = getGasFee(EvmChain.POLYGON, EvmChain.FANTOM, GasToken.GLMR);

//     const tx = await (
//         await polygonChain.contract.sendNFT(polygonChain.contract.address, owner.tokenId, fantomChain.name, wallet.address, {
//             value: gasFee,
//         })
//     ).wait();

//     console.log('tx back', tx);

//     onSrcConfirmed(tx.transactionHash);

//     while (true) {
//         const owner = await ownerOf();
//         if (owner.chain == fantomChain.name) {
//             onSent(owner);
//             break;
//         }
//         await sleep(2000);
//     }

//     console.log('--- Then ---');
//     await print();
// }

// export async function sendNftFromEthToPoly(onSrcConfirmed: (txHash: string) => void, onSent: (ownerInfo: any) => void) {
//     const owner = await ownerOf();

//     console.log('--- Initially ---', owner);
//     await print();

//     const gasFee = getGasFee(EvmChain.ETHEREUM, EvmChain.POLYGON, GasToken.GLMR);

//     const tx = await (
//         await ethereumChain.contract.sendNFT(ethereumChain.contract.address, owner.tokenId, polygonChain.name, wallet.address, {
//             value: gasFee,
//         })
//     ).wait();

//     console.log('tx back', tx);

//     onSrcConfirmed(tx.transactionHash);

//     while (true) {
//         const owner = await ownerOf();
//         if (owner.chain == polygonChain.name) {
//             onSent(owner);
//             break;
//         }
//         await sleep(2000);
//     }

//     console.log('--- Then ---');
//     await print();
// }
export function truncatedAddress(address: string): string {
    return address.substring(0, 6) + '...' + address.substring(address.length - 10);
}

export const ownerOf = async (chain = moonbeamChain) => {
    const operator = chain.erc721;
    const owner = await operator.ownerOf(tokenId);
    const metadata = await operator.tokenURI(tokenId);

    if (owner != chain.contract.address) {
        return { chain: chain.name, address: owner, tokenId: BigInt(tokenId), tokenURI: metadata };
    } else {
        const newTokenId = BigInt(
            keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256', 'string'], [chain.name, operator.address, tokenId, metadata]))
        );
        for (let checkingChain of [moonbeamChain, avalancheChain]) {
            if (checkingChain == chain) continue;
            try {
                const address = await checkingChain.contract.ownerOf(newTokenId);
                return { chain: checkingChain.name, address: address, tokenId: newTokenId, tokenURI: metadata };
            } catch (e) {}
        }
    }
    return { chain: '' };
};

async function print() {
    for (const chain of chains) {
        const owner = await ownerOf(chain);
        console.log(`Token that was originally minted at ${chain.name} is at ${owner.chain}.`);
    }
}

const getGasFee = async (
    sourceChainName: EvmChain,
    destinationChainName: EvmChain,
    sourceChainTokenSymbol: GasToken | string,
    estimatedGasUsed?: number
) => {
    const api = new AxelarQueryAPI({ environment: Environment.TESTNET });
    const gasFee = isTestnet ? await api.estimateGasFee(sourceChainName, destinationChainName, sourceChainTokenSymbol) : 3e6;
    return gasFee;
};
