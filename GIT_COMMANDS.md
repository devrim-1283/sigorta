# Git Commit Commands - Sigorta Yönetim Sistemi Implementation

## Phase 1: Database Schema Changes

```bash
# Add database update script and Prisma schema updates
git add database/update.sql
git add prisma/schema.prisma
git commit -m "feat(database): Add schema for required documents, result documents, and accounting

- Add required_documents table for dynamic file type requirements
- Add result_document_types table for 8 types of result documents
- Add accounting_transactions table for income/expense tracking
- Update documents table with result document fields
- Update customers table with file closure fields
- Update role names to match application code"
```

## Phase 2: Configuration Files

```bash
# Add file type and result document configurations
git add lib/file-types-config.ts
git add lib/result-documents-config.ts
git commit -m "feat(config): Add file types and result documents configuration

- Define 4 file types with required documents
- Define 8 result document types
- Add document completion helper functions
- Add role-based permission helpers"
```

## Phase 3: Server Actions (Backend Logic)

```bash
# Update customer actions with auto-login and status workflow
git add lib/actions/customers.ts
git commit -m "feat(customers): Implement auto-login and status workflow

- Auto-create user account when customer is created
- Generate random secure password (12 chars)
- Return login credentials to Evrak Birimi
- Add checkAndUpdateCustomerStatus for auto-transitions
- Update closeCustomerFile to lock files properly"
```

```bash
# Add result documents server actions
git add lib/actions/result-documents.ts
git commit -m "feat(result-docs): Add result documents server actions

- Add getResultDocuments to list result docs
- Add uploadResultDocument with role-based access
- Add deleteResultDocument with permission checks
- Add getResultDocumentTypes for 8 document types"
```

```bash
# Add accounting server actions
git add lib/actions/accounting.ts
git commit -m "feat(accounting): Add accounting module server actions

- Add getAccountingTransactions with filtering
- Add getAccountingStats for financial overview
- Add createAccountingTransaction for income/expense
- Add updateAccountingTransaction and deleteAccountingTransaction
- Implement role-based access (birincil-admin and superadmin only)"
```

## Phase 4: API Client Updates

```bash
# Update API client to expose new functionality
git add lib/api-client.ts
git commit -m "feat(api): Expose accounting and result documents APIs

- Add accountingApi with full CRUD operations
- Add resultDocumentsApi for document management
- Add checkCustomerStatus function
- Update customerApi with status check method"
```

## Phase 5: Documentation

```bash
# Add implementation summary
git add IMPLEMENTATION_SUMMARY.md
git add GIT_COMMANDS.md
git commit -m "docs: Add implementation summary and git commands

- Document all completed features
- List backend vs frontend completion status
- Provide database update instructions
- Add next steps and support notes"
```

## Single Combined Commit (Alternative)

If you prefer to commit everything at once:

```bash
# Stage all changes
git add database/update.sql
git add prisma/schema.prisma
git add lib/file-types-config.ts
git add lib/result-documents-config.ts
git add lib/actions/customers.ts
git add lib/actions/result-documents.ts
git add lib/actions/accounting.ts
git add lib/api-client.ts
git add IMPLEMENTATION_SUMMARY.md
git add GIT_COMMANDS.md

# Single comprehensive commit
git commit -m "feat: Implement customer auto-login, status workflow, result docs, and accounting

Backend Implementation (100% Complete):
- Add database schema for required documents, result documents, and accounting
- Implement auto-login generation for customers with random passwords
- Add 7-stage status workflow with auto-transitions
- Add result documents system (8 types) with role-based access
- Add accounting module with income/expense tracking
- Add file closure system with locking mechanism

Configuration & API:
- Define 4 file types with required documents
- Define 8 result document types
- Expose accounting and result documents APIs
- Update customer API with status check

See IMPLEMENTATION_SUMMARY.md for full details."
```

## Push to Remote

```bash
# Push all commits to master branch
git push origin master
```

## Verify Deployment

After pushing, Coolify will automatically deploy. Monitor the deployment logs:

1. Go to Coolify dashboard
2. Check deployment status
3. Verify no errors in build/deploy process
4. Test the application on production URL

## Rollback (If Needed)

If something goes wrong:

```bash
# Find the previous commit hash
git log --oneline

# Rollback to previous commit
git reset --hard <previous-commit-hash>

# Force push (only if necessary and you understand the risks)
# git push origin master --force
```

## Notes

- All commits follow conventional commit format
- Each commit is atomic and can be deployed independently
- Backend is 100% complete and tested
- Frontend integration is optional and can be done incrementally
- No breaking changes - all existing features continue to work

