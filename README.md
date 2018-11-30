# Learning Ethereum

#### 

This is for understainding internal of Ethereum deeply.  

## Getting Started

Downlod it via git:

```shell
$ git clone https://github.com/tagomaru/learning-ethereum.git
$ cd learning-ethereum
$ npm install
```

## Items

### Recovery pubKey from singedTx.

Unlike Bitcoin, Ethereum does not have pubKey in tx. However wallet application shows address which is also not included in tx and generated from pubKey.
This item is understanding how wallet recovers pubKey and generate address.

#### Usage
```shell
$ node ./recover-pubKey-from-rawTx.js <hex of rawSingedTx>
```
#### Example (EIP155)
```shell
$ node ./recover-pubKey-from-rawTx.js 0xf86d820c2585037e11d600825208948d6799a682a78aaba9f8cf36fc66db4a0ac007ab8711c37937e080008025a0c4c03280a6db7d21ff9851419d53f2eb8b4befb2ad9bf643b9270dda94cacd6ba036abad330e204f27dedd601be91735feb285ddfb4d13ae97791442675ebe324e
```

#### 1. Decode rawSignedTX
Tx is RLP encoded format. The below output is showing RLP with JSON format.
```shell
RLP with JSON format of signed TX =>
{
  "nonce": 3109,
  "gasPrice": "0x037e11d600",
  "gasLimit": "0x5208",
  "to": "0x8d6799a682a78aaba9f8cf36fc66db4a0ac007ab",
  "value": "0x11c37937e08000",
  "data": "0x",
  "v": 37,
  "r": "0xc4c03280a6db7d21ff9851419d53f2eb8b4befb2ad9bf643b9270dda94cacd6b",
  "s": "0x36abad330e204f27dedd601be91735feb285ddfb4d13ae97791442675ebe324e"
}
```

#### 2. RLP encode from JSON.
Reverse json to RLP encode with ethereumjs-tx. 
```shell
RLP-Encoded signed Tx: 0xf86d820c2585037e11d600825208948d6799a682a78aaba9f8cf36fc66db4a0ac007ab8711c37937e080008025a0c4c03280a6db7d21ff9851419d53f2eb8b4befb2ad9bf643b9270dda94cacd6ba036abad330e204f27dedd601be91735feb285ddfb4d13ae97791442675ebe324e
```
#### 3. Print pubKey and address with ethereumjs-tx.
Before learning, print pubKey and address for answer matching. 
```shell
pubKey: 0xc3002880390600f9617ee560d9d3b583b036b1feb8d5e4a4ba67c333529375e3aeab5c32849a9838b96759ffcc715fb7c0566041acd1591babc3ed53059b6666

address: 0x2aff290dc6810755667f0113ba3b87fdc1bf3fca
```
#### 4. generate tx hash without sig.
To calculate pubKye later, generate tx hash without sig. When tx is EIP155 format, r=0,s=0, and v=1(mainet chainID) are also used. 
```shell
----------------------------------------
RLP with JSON format of TX to be signed =>
{
  "nonce": 72,
  "gasPrice": "0x028fa6ae00",
  "gasLimit": "0x5208",
  "to": "0x802740f78cdb37ea37e904d183e4cdc59f478f2a",
  "value": "0x0111500e9862582c",
  "data": "0x",
  "v": 1,
  "r": 0,
  "s": 0
}
----------------------------------------

txHash to be signed: 0x9fa9623d8fd37c6db1014c37b82d863e630e7f4a014d89b68bc5893f6935afb5
```

#### 5. generate sage code to learn recovering pubKey math calculation.
```shell
You can paste the below sage code to understand caluculation process to recover pubKey.
Visit https://sagecell.sagemath.org/ and paste this before clicing "Evaluate" button.

----------------------------------------
sage code =>

# input
r=0x1edb0970c736ab030791852660b4784ac3c0df9f446aec5cdd7f54288acb6cdd # r of sig
s=0x7931681a581de9ade569b3ba36ab7ab119789002d36d0829c06a121941ca5e6b # s of sig
z=0x9fa9623d8fd37c6db1014c37b82d863e630e7f4a014d89b68bc5893f6935afb5 # tx hash to be signed
v=37 # v of sig, which indicates chainId and determine y from R and R'
p=115792089237316195423570985008687907853269984665640564039457584007908834671663 # prime
n=115792089237316195423570985008687907852837564279074904382605163141518161494337 # order of EllipticCurve

# EllipticCurve
E = EllipticCurve(GF(p),[0,7])

# Base Point of EllipticCurve
G=E([0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798,0x483ADA772
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
print 'pubKey => 0x' + hex(int(K[0]))[2:-1] + hex(int(K[1]))[2:-1]

----------------------------------------
```

#### 6. Understand recover calculation on sage.
The above sage code paste on https://sagecell.sagemath.org/
The output is like below.

```shell
pubKey => 0xc3002880390600f9617ee560d9d3b583b036b1feb8d5e4a4ba67c333529375e3aeab5c32849a9838b96759ffcc715fb7c0566041acd1591babc3ed53059b6666
```
Yes!. It is same as pubKey on #3 generated with ethereumjs-tx.!

Signed Tx does not pubKey, but it can be recovered mathematically. v is used to determine two y as pubKey which are points on EllipticCurve.
If you know EllipticCurve arithmetic operations, you can understand well what sage code is doing.

#### 7. calculate address
Calcualte address which is last 20 byte of keccak256(SHA3) of pubKey. The below is on geth console.
```shell
> web3.sha3('0xc3002880390600f9617ee560d9d3b583b036b1feb8d5e4a4ba67c333529375e3aeab5c32849a9838b96759ffcc715fb7c0566041acd1591babc3ed53059b6666',{encoding:"hex"}).substr(-40)
"2aff290dc6810755667f0113ba3b87fdc1bf3fca"
```
It is same as address on #3 generated with ethereumjs-tx.!

#### not EIP155
Try it with below tx which is not EIP155.
https://etherscan.io/tx/0x59dfa618d4698bc10e1f61a4802ac4a23db99cd288e9c0258301b54144d75b6c
https://etherscan.io/getRawTx?tx=0x59dfa618d4698bc10e1f61a4802ac4a23db99cd288e9c0258301b54144d75b6c

## License
ISC

