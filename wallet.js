// Standard EIP-1193 network setup. Contract writes do not require MetaMask Snaps.
export async function ensureNetwork(provider, chain) {
 const chainId=`0x${chain.id.toString(16)}`;
 if(BigInt(await provider.request({method:'eth_chainId'}))===BigInt(chain.id))return;
 try {
  await provider.request({method:'wallet_switchEthereumChain',params:[{chainId}]});
 } catch(error) {
  if(Number(error.code??error.data?.originalError?.code)!==4902)throw error;
  await provider.request({method:'wallet_addEthereumChain',params:[{
   chainId,chainName:chain.name,nativeCurrency:chain.nativeCurrency,
   rpcUrls:chain.rpcUrls.default.http,blockExplorerUrls:[chain.blockExplorers.default.url]
  }]});
  await provider.request({method:'wallet_switchEthereumChain',params:[{chainId}]});
 }
 if(BigInt(await provider.request({method:'eth_chainId'}))!==BigInt(chain.id))throw Error('Switch your wallet to GenLayer Studionet, then reconnect.');
}
