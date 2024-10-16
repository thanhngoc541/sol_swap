import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolPool } from "../target/types/sol_pool";
import { expect } from "chai";

describe("sol_pool", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolPool as Program<SolPool>;
  const connection = provider.connection;
  const wallet = provider.wallet;
  console.log("Wallet Public Key:", wallet.publicKey.toString());

  let poolSolAccount;
  let poolAccount;
  const solAmount = 1_000_000_000; // 1 SOL in lamports
  const additionalSolAmount = 500_000_000; // 0.5 SOL in lamports

  before(async () => {
    [poolSolAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("pool_sol_account"), wallet.publicKey.toBuffer()],
      program.programId
    );

    poolAccount = anchor.web3.Keypair.generate();
  });

  it("Initializes the pool with SOL", async () => {
    const tx = await program.methods
      .initializePool(new anchor.BN(solAmount))
      .accounts({
        user: wallet.publicKey,
        poolAccount: poolAccount.publicKey,
      })
      .signers([poolAccount])
      .rpc();

    console.log("Transaction signature for initializing pool:", tx);

    const poolData = await program.account.poolAccount.fetch(poolAccount.publicKey);
    expect(poolData.solBalance.toNumber()).to.equal(solAmount);
    console.log("Test passed: Pool initialized with correct SOL balance.");
  });

  it("Deposits more SOL into the pool", async () => {
    const tx = await program.methods
      .depositSol(new anchor.BN(additionalSolAmount))
      .accounts({
        user: wallet.publicKey,
        poolAccount: poolAccount.publicKey,
      })
      .rpc();

    console.log("Transaction signature for deposit:", tx);

    const poolData = await program.account.poolAccount.fetch(poolAccount.publicKey);
    expect(poolData.solBalance.toNumber()).to.equal(solAmount + additionalSolAmount);
    console.log("Test passed: Additional SOL deposited into the pool.");
  });

  it("Checks the balance of poolSolAccount", async () => {
    const poolSolBalance = await connection.getBalance(poolSolAccount);
    const expectedBalance = solAmount + additionalSolAmount;
    expect(poolSolBalance).to.equal(expectedBalance);
    console.log("Test passed: poolSolAccount balance is correct.");
  });
});
