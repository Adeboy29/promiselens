import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const client=createClient({chain:studionet});
const contract='0x29cbdD5c5266693170Ad0920c92776dC45BF3c00';
const promiseId='promiselens-integration-20261009';
const hashes={deploy:'0x719f2696dc631aff85dede4508a1dd1ea12684242bc97a5083a8dfb4e087a9c6',create:'0x6efcc39f1223a8e90dfb2c441e4f17692094bfc453ac36daa9120563ce3cc544',evidence:'0x3e0175ef1688337aba82151951d4f59bfcf5ad96b905aa2fec9d56d7f96c5af5',evaluate:'0xd908f333ca1deb5854215e3490eeae88d7b41d1715736bf0e0db71f3c3ef35bf'};
const receipts={};
for(const [name,hash] of Object.entries(hashes)){
 const tx=await client.getTransaction({hash});
 const status=tx.statusName||tx.status;
 const execution=tx.txExecutionResultName||tx.consensus_data?.leader_receipt?.[0]?.execution_result;
 if(status!=='FINALIZED'||!['SUCCESS','FINISHED_WITH_RETURN'].includes(execution))throw Error(`${name}: ${status}/${execution}`);
 receipts[name]={hash,status,execution,votes:tx.consensus_data?.votes,validators:tx.consensus_data?.validators?.map(v=>({address:v.node_config?.address,vote:v.vote,model:v.node_config?.primary_model?.model})),leaderExecution:tx.consensus_data?.leader_receipt?.map(v=>({execution:v.execution_result,model:v.node_config?.primary_model?.model}))};
 console.log(name,status,execution);
}
const deployedCode=await client.getContractCode(contract);
const normalized=s=>s.replaceAll('\r\n','\n').trim();
if(normalized(deployedCode)!==normalized(readFileSync('contracts/PromiseLens.py','utf8')))throw Error('Source differs from deployed contract');
const codeSha256=createHash('sha256').update(normalized(deployedCode)).digest('hex');
const read=async functionName=>JSON.parse(await client.readContract({address:contract,functionName,args:[promiseId],transactionHashVariant:'latest-final'}));
const promise=await read('get_promise'),history=await read('get_history');
if(history.length!==1||promise.evaluations!==1||history[0].status!=='Insufficient evidence')throw Error('Unexpected finalized verdict');
const proof={verifiedAt:new Date().toISOString(),network:'GenLayer hosted Studio development network (not mainnet or Bradbury)',chainId:61999,rpc:'https://studio.genlayer.com/api',contract,codeSha256,codeMatchesSource:true,promiseId,receipts,promise,history};
writeFileSync('dist/verification.json',JSON.stringify(proof,null,2));
console.log('Verified live evaluation:',history[0].status,'Source matches deployed code.');
