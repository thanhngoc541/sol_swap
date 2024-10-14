import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolPool } from "../target/types/sol_pool";
import { expect } from "chai";

describe("sol_pool", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolPool as Program<SolPool>;
  const connection = provider.connection;
  const wallet = provider.wallet;
  console.log(wallet.publicKey)
  // Test key accounts
  let poolSolAccount: anchor.web3.PublicKey;
  let poolAccount: anchor.web3.Keypair;

  const solAmount = 1_000_000_000; // 1 SOL in lamports

  before(async () => {
    // Create a new SOL account for the pool
    poolSolAccount = await anchor.web3.Keypair.generate().publicKey;

    // Create pool account to store pool information
    poolAccount = anchor.web3.Keypair.generate();
  });

  it("Initializes the pool with SOL", async () => {
    // Initialize the pool by invoking the program's function
    const tx = await program.methods
      .initializePool(new anchor.BN(solAmount))
      .accounts({
        user: wallet.publicKey,
        poolAccount: poolAccount.publicKey,
        poolSolAccount: poolSolAccount,
      })
      .signers([poolAccount])
      .rpc();

    console.log("Transaction signature:", tx);

    // Fetch and validate the pool state
    const poolData = await program.account.poolAccount.fetch(poolAccount.publicKey);

    // Check if the pool balance is correctly set
    expect(poolData.solBalance.toNumber()).to.equal(solAmount);

    console.log("Test passed: Pool initialized with correct SOL balance.");
  });

  it("Deposits more SOL into the pool", async () => {
    const additionalSolAmount = 500_000_000; // 0.5 SOL in lamports

    // Deposit additional SOL into the pool
    const tx = await program.methods
      .depositSol(new anchor.BN(additionalSolAmount))
      .accounts({
        user: wallet.publicKey,
        poolAccount: poolAccount.publicKey,
        poolSolAccount: poolSolAccount,
      })
      .rpc();

    console.log("Transaction signature for deposit:", tx);

    // Fetch and validate the updated pool state
    const poolData = await program.account.poolAccount.fetch(poolAccount.publicKey);

    // Check if the pool balance is updated correctly
    expect(poolData.solBalance.toNumber()).to.equal(solAmount + additionalSolAmount);

    console.log("Test passed: Additional SOL deposited into the pool.");
  });

  it("Fetches all pool accounts", async () => {
    const accounts = await program.account.poolAccount.all();
    console.log("All pool accounts:", accounts);
    expect(accounts.length).to.be.greaterThan(0);
  });
});
