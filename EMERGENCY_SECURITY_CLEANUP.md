# 🚨 EMERGENCY GIT HISTORY CLEANUP GUIDE

## ⚠️ YOUR SECRET KEY WAS EXPOSED IN PUBLIC REPOSITORY
**Commit**: `1e7f6e7`  
**File**: `z-cresca-vault/relayer/.env`  
**Exposed Key**: `RELAYER_SECRET_KEY=66h8zN...vi15B`

---

## 📋 IMMEDIATE ACTION CHECKLIST

### ✅ Step 1: Generate New Secret Key (DO THIS NOW!)

```powershell
# Generate a brand new relayer keypair
cd f:\W3\gost_protocol\z-cresca-vault\relayer
solana-keygen new --outfile relayer-keypair-NEW.json --no-bip39-passphrase

# Extract the base58 secret key
# Open the JSON file and copy the array values
# Convert to base58 using Python or online tool
```

**OR use Python:**
```python
from solana.keypair import Keypair
import base58

# Generate new keypair
new_keypair = Keypair()
secret_base58 = base58.b58encode(bytes(new_keypair.secret())).decode('ascii')
print(f"New Secret Key: {secret_base58}")
print(f"Public Key: {new_keypair.pubkey()}")
```

### ✅ Step 2: Update Your Local .env File

```bash
# Edit f:\W3\gost_protocol\z-cresca-vault\relayer\.env
# Replace: RELAYER_SECRET_KEY=YOUR_NEW_SECRET_KEY_HERE
# With your newly generated key
```

---

## 🧹 STEP 3: CLEAN GIT HISTORY (CRITICAL!)

Simply deleting the file in a new commit **DOES NOT REMOVE IT FROM HISTORY**.  
Attackers can still access the old key from previous commits.

### Option A: Using BFG Repo-Cleaner (RECOMMENDED)

**Download BFG:**
```powershell
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
# Or use: winget install -e --id BFG
```

**Clean the repository:**
```powershell
cd f:\W3\gost_protocol

# Create a backup first!
git clone --mirror . ../gost_protocol_backup

# Remove the exposed secret from all commits
java -jar bfg.jar --replace-text replacements.txt .git

# Create replacements.txt with:
# 66h8zNExgJahPrpaFxiFVrhLhaUEQKcYzMpmRwxcNky8vvwLgNvJSV7YktKwtMFVbtHAbHtbWywnKPeLNEzvi15B==>***REMOVED***

# Cleanup and force push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force --all origin
```

### Option B: Using git-filter-repo

**Install:**
```powershell
pip install git-filter-repo
```

**Remove the .env file from history:**
```powershell
cd f:\W3\gost_protocol

# This removes z-cresca-vault/relayer/.env from ALL commits
git filter-repo --path z-cresca-vault/relayer/.env --invert-paths

# Force push to GitHub
git push origin --force --all
```

### Option C: Nuclear Option (Delete All History)

**⚠️ WARNING: This deletes ALL commit history!**

```powershell
cd f:\W3\gost_protocol

# Remove all Git history
Remove-Item -Recurse -Force .git

# Reinitialize repository
git init
git add .
git commit -m "🔒 Fresh start after security incident - all secrets rotated"

# Force push to GitHub (will overwrite everything)
git remote add origin https://github.com/Parthkk90/Gost-Protocol.git
git push -u --force origin main
```

---

## 🔐 STEP 4: VERIFY CLEANUP

After cleaning, verify the secret is gone:

```powershell
# Search entire Git history for the exposed key
git log -S "66h8zNExg" --all --oneline

# Should return NO results
```

---

## 🛡️ STEP 5: PREVENTIVE MEASURES (ALREADY DONE)

✅ Updated `.gitignore` to exclude `.env` files  
✅ Created `.env.example` template  
✅ Removed compromised key from `.env` file  

**Still Need To Do:**
- [ ] Generate new secret key
- [ ] Update local `.env` with new key
- [ ] Clean Git history using one of the methods above
- [ ] Force push to GitHub
- [ ] Verify key is completely removed from history

---

## 🚀 STEP 6: FUND NEW KEYPAIR

Once you have your new keypair:

```bash
# Get the public key
solana-keygen pubkey relayer-keypair-NEW.json

# Fund it on devnet
solana airdrop 2 <YOUR_NEW_PUBLIC_KEY> --url devnet

# Test it works
solana balance <YOUR_NEW_PUBLIC_KEY> --url devnet
```

---

## 📞 EMERGENCY CONTACTS

**If the compromised key had real funds:**
1. Transfer all funds to a new wallet immediately
2. Monitor the old wallet address for suspicious activity
3. Report to GitHub Security: security@github.com

**GitHub Secret Scanning:**
- Mark as "Resolved" once you've rotated the key
- Update the developer email: parth122004@gmail.com

---

## ✅ POST-CLEANUP VERIFICATION

After completing all steps:

```powershell
# Verify .env is not in Git
git ls-files | grep ".env"  # Should only show .env.example

# Verify key is not in history
git log --all --source --full-history -- "*/.env" | head -20

# Check GitHub secret scanning
# Visit: https://github.com/Parthkk90/Gost-Protocol/security
```

---

## 📝 LESSONS LEARNED

✅ Always add `.env` to `.gitignore` BEFORE first commit  
✅ Use `.env.example` templates for team collaboration  
✅ Never commit secrets, API keys, or private keys  
✅ Use GitHub Secrets for CI/CD instead of files  
✅ Enable GitHub Secret Scanning alerts (already active)  

---

**Time is critical. Execute these steps NOW!**
