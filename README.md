# Vault
A Multi-Currency Digital Wallet API with Atomic Transfers

Why this project: Every fintech on the continent needs it. If I can explain double-entry bookkeeping, idempotency, and race-condition prevention to an interviewer, the goal is to understand systems

#What Vault Does
User A has a NGN wallet with ₦50,000
User B has a USD wallet with $0.00

User A sends ₦10,000 to User B
→ System converts at rate (or keeps NGN)
→ Debit User A ₦10,000
→ Credit User B ₦10,000
→ Both operations succeed or BOTH fail (atomic)
→ User A gets webhook: "You sent ₦10,000"
→ User B gets webhook: "You received ₦10,000"
→ Audit log shows both legs of the transaction

The hard parts:
Two users can't double-spend the same balance
If the API crashes mid-transfer, money doesn't disappear
Same transfer request twice (network retry) only happens once
Balance reads are fast (Redis) but never wrong (PostgreSQL is truth)

#Architecture
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Client    │──────▶  API Gateway  │──────▶  Auth (JWT/RBAC) │
└─────────────┘      └──────────────┘      └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌──────────┐         ┌──────────┐
   │  Redis  │          │PostgreSQL│         │ Webhook  │
   │ (Cache) │          │ (Ledger) │         │  Queue   │
   └─────────┘          └──────────┘         └──────────┘
