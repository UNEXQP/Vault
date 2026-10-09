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



my explnation of the login flow 


user sends both email and password to the db 
-- the password senst is then hashed and comapred to the hash i the db 
-- if correct we proceed else error
-- the comparison is done by selecting both the id the email and the password from the users table then 
-- then use a varriable to represent the user password then use bcrypt comapre to compare them

creating token using jwt
-- we first make a create token function where:
     well use jwt.sign to for user id and add the ammount of time that token is allowed to be relevant with the jwt secret key
-- using the create token function:
    we want to remmber that the token is user id that can also be described as the id of the row the email were using to log in so we use he create token function while passing r userid as an argiment

-- auth middleware 
   we first have to determine what our token will be so the token from the create token function will be put next to our bearer and this will be used to identify what each user will be allowed to do     