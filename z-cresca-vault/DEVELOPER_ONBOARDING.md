# Z-CRESCA DEVELOPER ONBOARDING CHECKLIST

## 👋 Welcome to the Z-Cresca Team!

This checklist will get you from zero to productive in < 1 day.

---

## ☑️ Day 1: Environment Setup (2-3 hours)

### Prerequisites Installation
- [ ] Install Rust (1.75+)
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  source $HOME/.cargo/env
  rustc --version
  ```

- [ ] Install Solana CLI (1.18+)
  ```bash
  sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
  solana --version
  ```

- [ ] Install Anchor (0.32.1)
  ```bash
  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
  avm install 0.32.1
  avm use 0.32.1
  anchor --version
  ```

- [ ] Install Node.js (v18+) & npm
  ```bash
  # macOS
  brew install node
  
  # Or use nvm
  nvm install 18
  node --version
  ```

- [ ] Install VS Code extensions
  - [ ] rust-analyzer
  - [ ] Solana Tools
  - [ ] Better TOML

### Project Setup
- [ ] Clone repository
  ```bash
  git clone <repo-url>
  cd gost_protocol
  ```

- [ ] Install dependencies
  ```bash
  cd z-cresca-vault
  npm install
  ```

- [ ] Create Solana wallet (if needed)
  ```bash
  solana-keygen new --outfile ~/.config/solana/id.json
  solana address
  ```

- [ ] Configure for devnet
  ```bash
  solana config set --url devnet
  solana airdrop 2
  solana balance
  ```

### Build & Test
- [ ] Build the program
  ```bash
  anchor build
  ```
  **Expected**: Compiles successfully

- [ ] Run tests (once written)
  ```bash
  anchor test
  ```

---

## 📚 Day 1: Codebase Walkthrough (2-3 hours)

### Read Documentation (in order)
1. [ ] [Z_CRESCA_ROADMAP.md](./Z_CRESCA_ROADMAP.md) - Full implementation plan
2. [ ] [README.md](./z-cresca-vault/README.md) - Program overview
3. [ ] [QUICKSTART.md](./z-cresca-vault/QUICKSTART.md) - Quick examples
4. [ ] [IMPLEMENTATION_STATUS.md](./z-cresca-vault/IMPLEMENTATION_STATUS.md) - Current progress

### Understand Core Concepts
- [ ] **What is Z-Cresca?**
  - Self-paying credit card (yield > interest)
  - Privacy-preserving payments (ZK proofs + burner wallets)
  - Backed by DeFi yield (Hyperion CLMM)

- [ ] **How does it work?**
  1. User deposits collateral (USDC)
  2. Vault deploys to Hyperion CLMM
  3. Earns trading fees (12-20% APY)
  4. User gets credit line (1.5x collateral)
  5. Spends on card (3% interest)
  6. Net profit = Yield - Interest

- [ ] **Key innovation?**
  - Card pays YOU instead of charging interest
  - Completely private (merchants can't track wealth)
  - Hardware-backed security (ESP32 card)

### Explore Code Structure
- [ ] Read [lib.rs](./z-cresca-vault/programs/z_cresca_vault/src/lib.rs)
  - Program entrypoint
  - All instruction definitions

- [ ] Read [state/credit_vault.rs](./z-cresca-vault/programs/z_cresca_vault/src/state/credit_vault.rs)
  - Main account structure
  - Helper methods (available_credit, health_factor)

- [ ] Read [instructions/authorize_payment.rs](./z-cresca-vault/programs/z_cresca_vault/src/instructions/authorize_payment.rs)
  - Core payment logic
  - Interest accrual
  - Credit checks

- [ ] Skim other instructions
  - `initialize_vault.rs`
  - `deposit_collateral.rs`
  - `calculate_credit_limit.rs`

### Key Concepts to Grasp
- [ ] **PDA (Program Derived Addresses)**
  - Deterministic account addressing
  - Seeds: `["vault", owner_pubkey, vault_id]`

- [ ] **Basis Points Math**
  - 10000 = 100%
  - 150 = 1.5%
  - Used for LTV, interest rates, utilization

- [ ] **Credit Limit Calculation**
  ```
  Credit Limit = (Collateral + Yield) × LTV / 10000
  ```

- [ ] **Interest Accrual**
  ```
  Interest = Principal × Rate × Time / (Seconds/Year × 10000)
  ```

- [ ] **Health Factor**
  ```
  Health = (Collateral × LTV) / Outstanding Balance
  ```

---

## 🧪 Day 2: First Contribution (3-4 hours)

### Good First Issues (Pick One)

#### Option A: Write Tests
**Difficulty**: 🟢 Easy  
**Time**: 2-3 hours

**Task**: Create `tests/z_cresca_vault.ts`

**Example**:
```typescript
import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";

describe("z_cresca_vault", () => {
  it("Initializes global state", async () => {
    // TODO: Implement
  });
  
  it("Creates user vault", async () => {
    // TODO: Implement
  });
  
  it("Deposits collateral and updates credit limit", async () => {
    // TODO: Implement
  });
});
```

**Acceptance Criteria**:
- [ ] 5+ test cases
- [ ] Tests pass: `anchor test`
- [ ] Code coverage > 50%

---

#### Option B: Implement `repay_credit` Instruction
**Difficulty**: 🟡 Medium  
**Time**: 3-4 hours

**Task**: Complete [instructions/repay_credit.rs](./z-cresca-vault/programs/z_cresca_vault/src/instructions/repay_credit.rs)

**Requirements**:
- [ ] Transfer tokens from user to vault
- [ ] Decrease `outstanding_balance`
- [ ] Update global state statistics
- [ ] Emit `CreditRepaid` event
- [ ] Add tests

**Hints**:
- Look at `deposit_collateral.rs` for SPL token transfer example
- Use `checked_sub` for balance updates
- Don't forget to accrue interest first!

---

#### Option C: Add Documentation Comments
**Difficulty**: 🟢 Easy  
**Time**: 2 hours

**Task**: Add Rust doc comments to all instructions

**Example**:
```rust
/// Repays outstanding credit balance
///
/// This instruction allows users to repay their borrowed amount,
/// reducing the outstanding balance and freeing up credit limit.
///
/// # Arguments
/// * `amount` - Amount to repay (in token units)
///
/// # Errors
/// * `InvalidAmount` - If amount is zero or exceeds outstanding balance
/// * `InsufficientFunds` - If user doesn't have enough tokens
///
/// # Example
/// ```ignore
/// program.methods
///   .repayCredit(new BN(100_000_000))
///   .accounts({ vault, owner })
///   .rpc();
/// ```
pub fn repay_credit(ctx: Context<RepayCredit>, amount: u64) -> Result<()>
```

**Acceptance Criteria**:
- [ ] All public functions documented
- [ ] All structs documented
- [ ] Error codes have descriptions
- [ ] Examples included

---

#### Option D: Research Hyperion Integration
**Difficulty**: 🟡 Medium  
**Time**: 4 hours

**Task**: Create `docs/HYPERION_INTEGRATION.md`

**Research Topics**:
- [ ] How does Hyperion CLMM work?
- [ ] What's the SDK/API?
- [ ] How to deposit liquidity via CPI?
- [ ] How to collect fees?
- [ ] Example Solana programs using Hyperion?

**Deliverable**: Markdown doc with:
- Architecture overview
- CPI account structure
- Code snippets
- Links to docs/examples

---

## 🎯 Week 1 Goals

By end of Week 1, you should be able to:
- [ ] Build the program without errors
- [ ] Explain how credit limits are calculated
- [ ] Run tests (once written)
- [ ] Deploy to devnet
- [ ] Make your first contribution (PR merged)

---

## 📅 Team Rituals

### Daily Standup (15 min)
- What did you do yesterday?
- What will you do today?
- Any blockers?

### Weekly Review (1 hour, Fridays)
- Demo completed work
- Review progress vs. roadmap
- Assign next week's tasks

### Sprint Planning (2 hours, every 2 weeks)
- Review upcoming milestones
- Break down epics into tasks
- Estimate effort

---

## 🆘 Getting Help

### Questions?
1. **Check docs first**: README, roadmap, comments
2. **Search GitHub issues**: Someone may have asked
3. **Ask in Discord**: #dev-help channel
4. **Ping mentor**: @[Your Mentor]

### Stuck on Solana/Anchor?
- [Anchor Book](https://book.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Stack Exchange](https://solana.stackexchange.com/)

### Stuck on DeFi concepts?
- [DeFi Primer](https://ethereum.org/en/defi/)
- [Impermanent Loss Explained](https://academy.binance.com/en/articles/impermanent-loss-explained)
- [Concentrated Liquidity](https://uniswap.org/whitepaper-v3.pdf)

---

## 🏆 Your First PR

### Before Submitting
- [ ] Code compiles: `anchor build`
- [ ] Tests pass: `anchor test`
- [ ] Formatted: `cargo fmt`
- [ ] Linted: `cargo clippy`
- [ ] Documented: Doc comments added

### PR Checklist
- [ ] Descriptive title (e.g., "feat: Add repay_credit instruction")
- [ ] Description explains what/why
- [ ] Screenshots/examples (if UI change)
- [ ] Tests included
- [ ] Docs updated (if API change)
- [ ] Linked to issue (Closes #123)

### Review Process
1. Submit PR
2. CI runs tests
3. Team reviews code
4. Address feedback
5. PR merged 🎉

---

## 🎓 Advanced Topics (Later)

Once comfortable with basics, dive into:
- [ ] **Cross-Program Invocation (CPI)** - Calling other programs
- [ ] **Program Derived Addresses (PDA)** - Advanced patterns
- [ ] **ZK Proofs** - Noir language, circuit design
- [ ] **DeFi Composability** - Yield aggregation strategies
- [ ] **Privacy Protocols** - Mixing, commitments, nullifiers

---

## 🌟 Success Metrics

After 1 week:
- [ ] 1+ PRs merged
- [ ] Can explain Z-Cresca to non-technical person
- [ ] Comfortable with Anchor framework
- [ ] Confident deploying to devnet

After 1 month:
- [ ] 5+ PRs merged
- [ ] Led 1+ feature implementation
- [ ] Reviewed others' code
- [ ] Contributed to architecture decisions

---

## 🎉 Welcome Aboard!

You're building something revolutionary:
- **First** yield-backed credit card
- **First** privacy-preserving card payments on Solana
- **First** card that pays YOU to spend

Let's ship this! 🚀

---

**Questions?** Reach out to:
- Tech Lead: [Name] (@handle)
- Product: [Name] (@handle)
- Community: Discord #dev-chat

**Your Buddy**: [Assigned Mentor] will help you ramp up this week.

---

*Last Updated: January 28, 2026*
