'use strict';

// Require section
const txDecoder = require('ethereum-tx-decoder');
const ethTx = require('ethereumjs-tx');
const ethUtil = require('ethereumjs-util');

// Entry Point
main();

function main() {
  // get rawTx from console argument
  const rawTx = process.argv[2];

  // deocde raxTx
  const decodedTx = txDecoder.decodeTx(rawTx);

  // get data from rawTx
  const nonce = decodedTx.nonce;
  const gasPrice = decodedTx.gasPrice.toHexString();
  const gasLimit = decodedTx.gasLimit.toHexString();
  const to = decodedTx.to;
  const value = decodedTx.value.toHexString();
  const data = decodedTx.data;
  const v = decodedTx.v;
  const r = decodedTx.r;
  const s = decodedTx.s;

  // rlp input
  const txData = {
    nonce,
    gasPrice,
    gasLimit,
    to,
    value,
    data,
    v,
    r,
    s
  };

  // print rlp
  console.log("----------------------------------------");
  console.log("RLP with JSON format of signed TX => ");
  console.log(JSON.stringify(txData,null,2));
  console.log("----------------------------------------");
  console.log();

  // generate rlp-encoded tx
  const tx = new ethTx(txData);
  console.log('RLP-Encoded signed Tx: 0x' + tx.serialize().toString('hex'));
  console.log();

  // print pubKey and address
  console.log('pubKey: ' + ethUtil.bufferToHex(tx.getSenderPublicKey()));
  console.log();
  console.log('address: ' + ethUtil.bufferToHex(tx.getSenderAddress()));
  console.log();

  // genereate tx hash for signing or pubKey recovery.
  let txHash;
  let includeSig = true;
  if(v === 37 || v === 38) {
    // case of EIP155 https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
    txData.v = 1;
    txData.r = 0;
    txData.s = 0;
  } else if(v === 27 || v === 28 ) {
    delete txData.v;
    delete txData.r;
    delete txData.s;
    includeSig = false;
  } else {
    console.log("Error: This suuports only mainet for generate tx hash.");
    process.exit(1);
  }

  console.log("----------------------------------------");
  console.log("RLP with JSON format of TX to be signed => ");
  console.log(JSON.stringify(txData,null,2));
  console.log("----------------------------------------");
  console.log();

  //console.log(txData);
  txHash = new ethTx(txData).hash(includeSig);
  console.log('txHash to be signed: 0x' + txHash.toString('hex'));
  console.log();

  // generate sage code
  const sageCode = `
# input
r=` + r + ` # r of sig
s=` + s + ` # s of sig
z=0x` + txHash.toString('hex') + ` # tx hash to be signed
v=` + v + ` # v of sig, which indicates chainId and determine y from R and R'
p=115792089237316195423570985008687907853269984665640564039457584007908834671663 # prime
n=115792089237316195423570985008687907852837564279074904382605163141518161494337 # order of EllipticCurve 

# EllipticCurve
E = EllipticCurve(GF(p),[0,7])

# Base Point of EllipticCurve
G=E([0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798,0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8])

# Calculate R(or R')
Ry_even = 0
Ry_odd = 1
if mod(E.lift_x(r,true)[0][1],2) == 0:
    Ry_even = E.lift_x(r,true)[0][1]
    Ry_odd = E.lift_x(r,true)[1][1]
else:
    Ry_even = E.lift_x(r,true)[1][1]
    Ry_odd = E.lift_x(r,true)[0][1]

# determine R by v
Ry = Ry_odd if v % 2 == 0 else Ry_even
R = E([r,Ry])

# Calculate K(pubKey)
K = inverse_mod(r,n) * (s * R - z * G)

# show pubKey
print 'pubKey => 0x' + hex(int(K[0]))[2:-1] + hex(int(K[1]))[2:-1]`;

// print sage code
console.log('You can paste the below sage code to understand caluculation process to recover pubKey.');
console.log('Visit https://sagecell.sagemath.org/ and paste this before clicing "Evaluate" button.');
console.log();
console.log('----------------------------------------');
console.log('sage code => ');
console.log(sageCode);
console.log();
console.log('----------------------------------------');
}