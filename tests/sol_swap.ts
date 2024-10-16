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
  const depositAmount = 500_000_000; // 0.5 SOL in lamports
  const withdrawAmount = 300_000_000;
  before(async () => {
    [poolSolAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pool_sol_account"), wallet.publicKey.toBuffer()],
      program.programId
    );

    [poolAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pool_account"), provider.wallet.publicKey.toBuffer()],
      program.programId,
    );
  });



  it("Initializes the pool with SOL", async () => {
    const tx = await program.methods
      .initializePool(new anchor.BN(solAmount))
      .accounts({
        user: wallet.publicKey,
      })
      .rpc();

    console.log("Transaction signature for initializing pool:", tx);

    const poolData = await program.account.poolAccount.fetch(poolAccount);
    expect(poolData.solBalance.toNumber()).to.equal(solAmount);
    console.log("Test passed: Pool initialized with correct SOL balance.");
  });

  it("Deposits more SOL into the pool", async () => {
    const tx = await program.methods
      .depositSol(new anchor.BN(depositAmount))
      .accounts({
        user: wallet.publicKey,
      })
      .rpc();

    console.log("Transaction signature for deposit:", tx);

    const poolData = await program.account.poolAccount.fetch(poolAccount);
    expect(poolData.solBalance.toNumber()).to.equal(solAmount + depositAmount);
    console.log("Test passed: Additional SOL deposited into the pool.");
  });

  it("Checks the balance of poolSolAccount after deposited", async () => {
    const poolSolBalance = await connection.getBalance(poolSolAccount);
    const expectedBalance = solAmount + depositAmount;
    expect(poolSolBalance).to.equal(expectedBalance);
    console.log("Test passed: poolSolAccount balance is correct.");
  });

  it("Withdraws SOL from the pool", async () => {
    const tx = await program.methods
      .withdrawSol(new anchor.BN(withdrawAmount))
      .accounts({
        user: wallet.publicKey,
      })
      .rpc();

    console.log("Transaction signature for withdrawal:", tx);

    // Fetch and validate the updated pool state
    const poolData = await program.account.poolAccount.fetch(poolAccount);
    expect(poolData.solBalance.toNumber()).to.equal(solAmount + depositAmount - withdrawAmount);
    console.log("Test passed: SOL successfully withdrawn from the pool.");

    // Check the balance of the poolSolAccount
    const poolSolBalance = await connection.getBalance(poolSolAccount);
    const expectedBalance = solAmount + depositAmount - withdrawAmount;
    expect(poolSolBalance).to.equal(expectedBalance);
    console.log("Test passed: poolSolAccount balance is correct after withdrawal.");
  });

  it("Checks the balance of poolSolAccount after withdraw", async () => {
    const poolSolBalance = await connection.getBalance(poolSolAccount);
    const expectedBalance = solAmount + depositAmount - withdrawAmount;
    expect(poolSolBalance).to.equal(expectedBalance);
    console.log("Test passed: poolSolAccount balance is correct.");
  });
});
