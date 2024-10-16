use anchor_lang::prelude::*;

declare_id!("9jLswiME9Pz1umwhaf24awUCcbmUYDXQuvqkGnCUcM5w");

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

        let new_balance = ctx
            .accounts
            .pool_account
            .sol_balance
            .checked_add(sol_amount)
            .ok_or(ErrorCode::Overflow)?;
        ctx.accounts.pool_account.sol_balance = new_balance;

        msg!("Deposited {} lamports of SOL into the pool", sol_amount);
        Ok(())
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, sol_amount: u64) -> Result<()> {
        msg!("Withdrawing SOL from the pool");

        // Ensure the pool has enough SOL to fulfill the withdrawal
        if ctx.accounts.pool_account.sol_balance < sol_amount {
            msg!(
                "Insufficient funds: Available {}, Requested {}",
                ctx.accounts.pool_account.sol_balance,
                sol_amount
            );
            return Err(ErrorCode::InsufficientFunds.into());
        }

        // Transfer SOL from the pool's PDA to the user
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.pool_sol_account.key(),
            &ctx.accounts.user.key(),
            sol_amount,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &transfer_instruction,
            &[
                ctx.accounts.pool_sol_account.to_account_info(),
                ctx.accounts.user.to_account_info(),
            ],
            &[&[
                b"pool_sol_account",
                ctx.accounts.user.key().as_ref(),
                &[ctx.bumps.pool_sol_account],
            ]],
        )?;

        // Update the pool balance
        ctx.accounts.pool_account.sol_balance -= sol_amount;

        msg!("Withdrew {} lamports of SOL from the pool", sol_amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 8,
        seeds = [b"pool_account", user.key().as_ref()],
        bump
    )]
    pub pool_account: Account<'info, PoolAccount>,
    /// CHECK: We are auto-verifying this PDA with seeds and bump
    #[account(
        mut,
        seeds = [b"pool_sol_account", user.key().as_ref()],
        bump
    )]
    pub pool_sol_account: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool_account", user.key().as_ref()],
        bump
    )]
    pub pool_account: Account<'info, PoolAccount>,
    /// CHECK: We are auto-verifying this PDA with seeds and bump
    #[account(
        mut,
        seeds = [b"pool_sol_account", user.key().as_ref()],
        bump
    )]
    pub pool_sol_account: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool_account", user.key().as_ref()],
        bump
    )]
    pub pool_account: Account<'info, PoolAccount>,
    /// CHECK: We are auto-verifying this PDA with seeds and bump
    #[account(
        mut,
        seeds = [b"pool_sol_account", user.key().as_ref()],
        bump
    )]
    pub pool_sol_account: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PoolAccount {
    pub sol_balance: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds in the pool.")]
    InsufficientFunds,
    #[msg("Overflow occurred.")]
    Overflow,
}
