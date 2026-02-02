import { Keypair } from '@solana/web3.js';
import fs from 'fs';

const keypairData = JSON.parse(fs.readFileSync('./target/deploy/z_cresca_vault-keypair.json', 'utf8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
console.log('Program ID:', keypair.publicKey.toString());
