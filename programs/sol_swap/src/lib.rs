use anchor_lang::prelude::*;

declare_id!("4M7DxWhHoXJopYBCB6SRJzygd6qYK8YfEehSj92FFVZR");

#[program]
pub mod sol_pool {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>, sol_amount: u64) -> Result<()> {
        msg!("Initializing SOL pool");

        // Transfer SOL from the user to the pool's SOL account using SystemProgram::transfer
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.pool_sol_account.key(),
            sol_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.pool_sol_account.to_account_info(),
            ],
        )?;

        // Store the SOL balance in the PoolAccount state
        ctx.accounts.pool_account.sol_balance = sol_amount;

        msg!("Pool initialized with {} lamports of SOL", sol_amount);
        Ok(())
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, sol_amount: u64) -> Result<()> {
        msg!("Depositing SOL into pool");

        // Transfer SOL from user to pool using SystemProgram::transfer
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.pool_sol_account.key(),
            sol_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.pool_sol_account.to_account_info(),
            ],
        )?;

        // Update pool balance
        ctx.accounts.pool_account.sol_balance += sol_amount;

        msg!("Deposited {} lamports of SOL into the pool", sol_amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + 8,
    )]
    pub pool_account: Account<'info, PoolAccount>,
    /// CHECK: We are auto-verifying this PDA with seeds and bump
    #[account(
        mut,
        seeds = [b"pool_sol_account", user.key().as_ref()],
        bump
    )]
    pub pool_sol_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub pool_account: Account<'info, PoolAccount>,
    /// CHECK: We are auto-verifying this PDA with seeds and bump
    #[account(
        mut,
        seeds = [b"pool_sol_account", user.key().as_ref()],
        bump
    )]
    pub pool_sol_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PoolAccount {
    pub sol_balance: u64,
}
