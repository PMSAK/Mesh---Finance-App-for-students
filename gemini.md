# MESH — Complete Product Vision, Feature Specification & Implementation Requirements

## 1. PRODUCT OVERVIEW

### Product Name
Mesh

### Product Category
Student personal finance, shared expense management, budgeting and financial coordination.

### Product Vision
Mesh is a mobile-first personal finance and group-expense management application designed specifically for college students. It helps students understand how long their money will last, make better spending decisions, split shared expenses with friends, track money owed between group members and settle debts without the awkwardness of repeatedly requesting small payments.

Traditional budgeting applications often assume predictable monthly income, consistent salaries and formal financial habits. Many students operate differently. They receive allowances, family transfers, scholarships, stipends or freelance payments irregularly. Their expenses fluctuate throughout the semester, and a significant portion of their spending happens socially: meals with friends, groceries, trips, shared subscriptions and hostel purchases.

Mesh is built around these real student behaviours.

It combines two interconnected systems:

1. **Personal Money Management:** A Student Runway Meter that calculates a practical spending limit and estimates how long a student's money will last.
2. **Group Money Management:** Circles, group expense splitting, an AI-powered receipt scanner, the Vibe Ledger and simplified debt settlement.

These systems must work together. A shared expense should update the relevant balances and obligations without incorrectly counting unpaid reimbursements as available cash. Money management should feel consistent whether a student spends independently or with friends.

### Core Product Promise

**Know how long your money will last. Split expenses without the awkwardness. Keep your finances clear without obsessing over every transaction.**

### Target Audience

The primary audience is college and university students, initially focused on Indian students.

Typical users include:

- Students receiving a fixed or irregular allowance from their families.
- Students managing a monthly or weekly hostel budget.
- Students who share meals, groceries, subscriptions or travel costs with friends.
- Students who frequently pay on behalf of a group and collect reimbursements later.
- Students who find traditional financial applications overly complicated.
- Students who want to spend responsibly without maintaining an elaborate spreadsheet.

### Product Personality

Mesh should feel approachable, modern, friendly, intelligent and trustworthy.

It should not feel like enterprise accounting software or a bank's administrative portal. Financial information must remain accurate and transparent, but the experience should feel lightweight enough for students to use every day.

The application should be welcoming without being childish. Use clear language, helpful explanations and a small amount of personality. Avoid shaming users for spending, making assumptions about their lifestyle or turning finance into a competitive game.

### Primary Differentiation Hypothesis

Expense tracking, budgeting and group splitting are established product categories. Mesh should not claim that these individual capabilities are inherently unique.

The proposed differentiation is the combination of:

- A spending runway designed around irregular student income.
- A clear distinction between available cash, upcoming obligations and money owed by friends.
- A low-friction social ledger that can accumulate small debts before settlement.
- AI receipt parsing connected directly to itemized expense splitting and personal cash-flow tracking.

The product should make these components feel like one coherent system instead of separate utilities.

---

## 2. PRODUCT PRINCIPLES

All implementation decisions should follow these principles.

### 2.1 Financial accuracy comes first

Financial calculations must be deterministic, testable and handled by application code. Do not delegate essential arithmetic to an AI model.

Use integer monetary units internally, preferably paise for INR, to avoid floating-point rounding errors.

### 2.2 Actual cash and outstanding debts are different

Money someone owes a user is not the same as money already available in the user's account.

Likewise, an unpaid expense owed by the user is not the same as an expense already paid in cash.

Maintain separate representations for cash balance, personal expenses, receivables, payables and upcoming commitments.

### 2.3 Small debts should be easier to manage, not invisible

The Vibe Ledger may postpone settlement requests for small expenses, but it must never hide a user's balance or discard transaction history.

All group members must be able to inspect and reconcile their balances.

### 2.4 AI output requires verification

AI-generated receipt data is a draft, not an authoritative financial record.

Users must be able to review and edit extracted information before it changes balances or creates debts.

### 2.5 Student-friendly over feature-heavy

Prefer fast entry, clear defaults and a small number of intuitive screens. Avoid overwhelming students with unnecessary analytics, configuration options or enterprise terminology.

### 2.6 The app must work without external financial integrations

The MVP should support manual entry and receipt uploads. Do not depend on bank integrations, payment gateways, UPI transaction access or automatic financial-account synchronization.

Mesh tracks expenses; it does not move money between accounts.

---

## 3. INFORMATION ARCHITECTURE AND MAIN NAVIGATION

Design Mesh as a responsive, mobile-first web application that also works well on desktop.

The principal navigation areas should be:

1. **Home:** Personal balance, spending runway, recent activity and important upcoming obligations.
2. **Expenses:** Personal transaction history, manual expense entry and upcoming commitments.
3. **Circles:** Shared expenses, group balances, receipt splitting and the Vibe Ledger.
4. **Activity:** A chronological view of important spending, expense changes and settlements.
5. **Profile and Settings:** Personal details, currency preferences, safety buffer, notification preferences and account management.

On mobile, use a clean bottom navigation bar with a prominent expense-add action. On desktop, use a slim sidebar or another layout appropriate to the existing project.

Avoid duplicating every feature across several navigation areas. Each screen should have a clear primary purpose.

---

## 4. FEATURE ONE: STUDENT RUNWAY METER

### Purpose

The Student Runway Meter is the main feature on the home dashboard.

Its purpose is to answer:

- How much cash do I currently have?
- How much of it is already committed?
- How much can I reasonably spend each day?
- When is my next allowance expected?
- If I continue spending at my current rate, approximately how long will my money last?

It should be the first useful thing a returning user sees.

### 4.1 Onboarding

When a new user first opens Mesh, provide a short onboarding experience.

Collect:

- Display name.
- Current available cash balance.
- Currency, with INR as the default.
- Next allowance or income date, if known.
- Upcoming essential expenses.
- Optional safety buffer.
- Optional recent or estimated daily spending.

The onboarding must not require every field to be completed before the user can start.

Provide three income-tracking modes:

**Mode A: Exact Date**

The user knows when the next allowance is expected. Collect the target date.

**Mode B: Target Days**

The user does not know the exact date but wants to budget for a chosen number of days. Collect a positive integer representing the desired planning period.

**Mode C: Unknown**

The next allowance date is unknown. Estimate the user's remaining financial runway using their recent average spending.

Clearly explain that forecasts depend on the accuracy of the user's inputs.

### 4.2 Data Model

Maintain the following logical fields:

- `currentBalance`: Current cash balance tracked by the user.
- `currency`: Currency code, defaulting to INR.
- `incomeMode`: `ExactDate`, `TargetDays` or `Unknown`.
- `nextIncomeDate`: Optional date for the next expected allowance.
- `targetDays`: Optional positive integer for the planning horizon.
- `trailingDailySpend`: Average recent daily spending, based on user-entered history or an explicitly identified estimate.
- `upcomingCommitments`: Unpaid expenses that must be reserved for.
- `safetyBuffer`: Configurable amount the user prefers not to spend.
- `lastUpdatedAt`: Timestamp of the last relevant update.

Do not pretend to know historical expenses when the user has not entered them. In that situation, allow a clearly labelled estimate and explain the limitations.

### 4.3 Runway Calculation

Let:

- `B` = current available cash.
- `C` = total eligible unpaid upcoming commitments.
- `R` = chosen safety buffer.
- `D` = positive number of days in the selected planning horizon.

Calculate:

`FlexibleBalance = max(0, B - C - R)`

For ExactDate:

`DaysRemaining = number of calendar days between today and the selected income date`

Use local calendar dates, not a raw difference in hours. If the income is expected today, treat the current planning day as one day. If the date is in the past, flag the stale date and prompt the user to update it rather than silently producing a negative or misleading result.

`DailyLimit = FlexibleBalance / max(1, DaysRemaining)`

For TargetDays:

`DailyLimit = FlexibleBalance / targetDays`

Reject zero or negative target-day values.

For Unknown:

If `trailingDailySpend > 0`:

`EstimatedDaysLeft = FlexibleBalance / trailingDailySpend`

Show an estimated runway in days. Do not fabricate a reliable safe daily limit when neither an income horizon nor a reasonable spending estimate is available.

If recent spending is zero or unavailable, explain that more spending data is needed for an estimate. Permit manual configuration of a planning horizon if the user would like one.

All displays must use sensible currency formatting. Internally use integer paise and maintain explicit rounding rules.

### 4.4 Dashboard Display

The Runway Meter should be visually prominent.

Display:

- Current cash balance.
- Recommended daily spending limit.
- Days until the expected allowance, where applicable.
- Flexible balance after commitments and buffer.
- Total reserved for upcoming expenses.
- Current safety buffer.
- A compact visual runway indicator.
- A clear explanation of how the daily limit was calculated.

The meter should use restrained, meaningful visual states:

- Comfortable: The balance is sufficient relative to the configured plan.
- Caution: Spending is approaching the available daily limit or obligations are becoming difficult to cover.
- At risk: The available balance is below important obligations or the current plan is not feasible.

Do not use arbitrary thresholds while presenting them as scientifically validated. Choose simple documented rules, make warning reasons visible and clearly label any heuristic.

Avoid communicating that the app can guarantee future affordability.

### 4.5 Add Expense

Place a prominent `+ Add Expense` action on the dashboard.

The manual expense form should support:

- Amount.
- Expense title.
- Category.
- Date.
- Optional note.
- Optional associated Circle.
- Whether the transaction has already been paid.
- Optional confirmation of how the payment affects the user's tracked cash.

Provide sensible default categories such as Food, Groceries, Transport, Education, Shopping, Entertainment, Subscriptions, Bills, Health and Other.

When a personal expense is actually paid from cash being tracked, reduce the cash balance immediately.

Then recalculate the Runway Meter and update the activity history.

If the entry represents an unpaid obligation, do not subtract it as though cash has already left. Record it as a liability or upcoming commitment instead.

### 4.6 Upcoming Commitments

Users should be able to create upcoming expenses for items such as hostel payments, groceries, travel, bills, subscriptions and semester costs.

Each commitment should have:

- Name.
- Amount.
- Expected due date.
- Category.
- Paid/unpaid status.
- Optional recurrence.
- Optional note.

Unpaid commitments should reduce the flexible balance used by the Runway Meter. Once paid and recorded as a cash transaction, they must stop being counted as unpaid commitments.

This distinction prevents double-counting.

The dashboard should allow users to mark an obligation as paid, edit its due date or amount, and remove an obligation that is no longer expected.

### 4.7 Automatic Recalculation

Recalculate the Runway Meter whenever a relevant event occurs:

- A tracked cash expense is added, edited or deleted.
- A payment is recorded.
- An upcoming commitment is created, paid, edited or removed.
- The allowance date or planning horizon changes.
- The safety buffer changes.
- A group expense or settlement changes the user's actual cash or outstanding obligations.

Show changes immediately in the interface without requiring a page refresh.

### 4.8 Purchase Impact Preview

Where practical, provide a small `Can I afford this?` action.

The user enters a proposed amount and sees:

- Current flexible balance.
- Proposed purchase amount.
- Projected flexible balance afterward.
- Updated daily limit or estimated runway.
- Whether the purchase would interfere with upcoming commitments or reduce the balance below the safety buffer.

This is a preview only. It must not change recorded balances until the user confirms the actual expense.

---

## 5. FEATURE TWO: CIRCLES AND GROUP EXPENSE SPLITTING

### Purpose

Circles let friends coordinate shared expenses in one place.

Examples include:

- Hostel friends purchasing groceries.
- Friends sharing meals.
- A group going on a trip.
- Roommates splitting utilities.
- Students sharing subscriptions or event costs.

### 5.1 Create a Circle

Allow a user to create a Circle with:

- Circle name.
- Optional image or emoji.
- Description or purpose.
- Currency.
- Members.
- Optional settlement preferences.

Examples include `Hostel Room 204`, `Goa Trip` or `Weekend Food`.

Each Circle should have a clear overview showing members, total recorded expenses, each member's net balance, recent activity and available actions.

### 5.2 Add Members

Support a simple MVP membership workflow.

Users should be able to add members through a demo-friendly member picker or invite link/code, depending on the authentication and backend architecture.

For a single-user demo, make it possible to create sample participants and clearly label demo data. Do not pretend that invitations or accounts work unless the underlying functionality exists.

Real group data must be scoped to authorized members only.

### 5.3 Add a Group Expense

A group expense should contain:

- Expense title.
- Gross amount paid.
- Payer.
- Date.
- Circle.
- Participants.
- Split method.
- Per-person shares.
- Optional itemized receipt.
- Tax and tip information, if applicable.
- Notes.
- Payment/settlement status.

Support these allocation methods:

**Equal Split:** Divide the total evenly among selected participants.

**Unequal Split:** Let users specify different amounts or shares.

**Percentage Split:** Allocate by percentages that sum to 100%.

**Itemized Split:** Assign receipt items to the individuals who consumed or purchased them.

Allow a shared expense to include only selected Circle members rather than forcing every member to participate.

For any split, validate that the individual allocations sum exactly to the amount being split. Handle the smallest currency unit deterministically.

### 5.4 Financial Accounting Rules

This part is critical.

Maintain the distinction between cash transactions and obligations.

Example:

A user pays ₹600 for a meal shared equally by three people.

- The payer's actual cash balance decreases by ₹600.
- The payer's own share is ₹200.
- The other two participants owe ₹200 each to the payer.
- The payer should see ₹400 as outstanding receivables.
- The ₹400 owed by friends must not be treated as cash already available to spend.

If a friend pays the full amount for the user's share, the user's cash balance does not immediately decrease. The user's obligation increases by their share until it is settled.

When the user later pays the friend:

- The user's cash balance decreases by the actual payment made.
- The corresponding outstanding payable decreases.
- The settlement must not create a second copy of the original expense.

Never deduct the entire group purchase from every participant's actual cash balance. Never count an unpaid reimbursement as money already received.

### 5.5 Expense History and Corrections

Every Circle should have a chronological expense history.

Members should be able to inspect an expense, its payer, its participants, each person's share and its remaining unsettled balance.

Provide edit and correction flows with confirmation where changes affect other members' balances.

If an existing expense is edited, recalculate the relevant balances from the revised ledger rather than applying an additional adjustment that double-counts the change.

Do not allow unauthorized members to alter the ledger.

---

## 6. FEATURE THREE: AI RECEIPT SCANNER

### Purpose

Reduce manual entry by extracting line items and prices from uploaded receipts or supported payment screenshots.

AI is an assistant for data entry, not an authority over the financial ledger.

### 6.1 User Flow

1. The user opens a Circle and taps `Add Expense`.
2. They choose `Scan Receipt`.
3. They upload or capture an image.
4. The image is sent to a server-side route that calls the configured Gemini vision model.
5. The model extracts structured receipt information.
6. Mesh validates the response and displays an editable review screen.
7. The user selects the payer and assigns individual items to Circle members.
8. Mesh calculates allocations, taxes, tips and rounding adjustments deterministically.
9. The user confirms the final split.
10. Only then does the app save the expense, update member balances and refresh the relevant Runway Meters.

### 6.2 Data Extracted

Extract these fields when present and readable:

- Merchant or shop name.
- Receipt date.
- Currency.
- Item description.
- Quantity.
- Unit price.
- Line-item total.
- Subtotal.
- Discount.
- Tax.
- Tip or service charge.
- Grand total.

The extraction may also identify uncertainty or unreadable fields. Do not invent missing amounts.

### 6.3 Structured Output

Use a defined JSON schema for the receipt extraction response.

Conceptual example:

{
  "merchant": "Campus Cafe",
  "date": "2026-10-24",
  "currency": "INR",
  "items": [
    {
      "name": "Sandwich",
      "quantity": 2,
      "unit_price_minor": 12000,
      "line_total_minor": 24000
    },
    {
      "name": "Coffee",
      "quantity": 1,
      "unit_price_minor": 8000,
      "line_total_minor": 8000
    }
  ],
  "subtotal_minor": 32000,
  "tax_minor": 1600,
  "tip_minor": 0,
  "total_minor": 33600,
  "uncertain_fields": []
}

In this example, monetary values use minor units: 12000 paise represents ₹120.00.

This is only an example of the output shape. Actual receipt data must come from the uploaded image.

The server should validate the response against the schema. Reject malformed output, handle missing values gracefully and do not insert arbitrary model output into the financial ledger.

### 6.4 Editable Review Screen

After extraction, present a clean interface containing:

- Receipt header.
- Merchant and date.
- Editable line-item names.
- Quantity and price controls.
- Subtotal, taxes, tips and grand total.
- Payer selector.
- Member avatars or initials.
- Item-assignment controls.
- Final totals for each person.

The user must be able to correct inaccurate OCR, delete incorrect rows, add missing items and manually enter unreadable fields.

If the receipt total and calculated total do not reconcile, show the discrepancy and request correction.

### 6.5 Allocation of Tax and Tip

When itemized expenses include shared taxes or tips, allocate those charges according to a clearly defined rule.

Recommended default: distribute shared tax and tip proportionally to each participant's eligible item subtotal. Offer an equal allocation option when appropriate.

Ensure that the sum of the final member shares equals the confirmed receipt total exactly. Perform calculations using integer minor units and apply a documented rounding-remainder rule.

The app should not automatically add taxes or tips that are not supported by the receipt or explicitly entered by the user.

### 6.6 API and Privacy Requirements

The receipt image must be processed through a server-side API route.

- Keep API keys exclusively in server-side environment variables.
- Never expose secret keys in frontend code.
- Validate image type and size.
- Validate all model output.
- Handle timeout, rate-limit and provider errors.
- Provide manual entry as a fallback.
- Avoid sending images to external services without a clear user action.
- Avoid retaining receipt images unnecessarily.
- Restrict access to saved receipt data to authorized users.

Do not claim a receipt was successfully scanned if the backend integration has not actually completed.

---

## 7. FEATURE FOUR: THE VIBE LEDGER

### Purpose

The Vibe Ledger is Mesh's social debt-management experience.

Small expenses among friends can become awkward when someone repeatedly asks for tiny payments. The Vibe Ledger keeps a visible running tally while allowing the group to postpone individual settlements until an agreed threshold or time.

The principle is:

**Track everything. Settle when it makes sense. Never lose track of who owes whom.**

### 7.1 How It Works

Consider three friends who repeatedly share small expenses.

- Friend A pays ₹40 for snacks.
- Friend B pays ₹60 for drinks.
- Friend C pays ₹30 for a shared item.

The app records each expense and recalculates the net positions of all members.

Rather than prompting the group to settle every tiny amount immediately, the app can accumulate small outstanding balances in the Vibe Ledger.

The expenses remain visible in the history. The outstanding balances remain accurate. The group can choose to settle later.

### 7.2 Buffering Rules

Use a configurable threshold in the Circle's currency, with a suggested Indian demo default such as ₹50.

The threshold is a presentation and settlement-prompt preference. It must not alter the underlying accounting.

For example:

- Small outstanding balances can be marked `Buffered`.
- Crossing the threshold can produce a `Ready to settle` suggestion.
- Members can settle earlier at any time.
- The group may configure weekly or manual settlement.
- A member can inspect every transaction contributing to their current balance.

Use neutral language. Avoid implying that buffered amounts have been forgiven, paid or erased.

### 7.3 Vibe Ledger UI

Display:

- Current net amount owed by each member.
- Small debts currently buffered.
- Overall amount owed to and by the current user.
- Recent expenses contributing to each balance.
- Settlement suggestions.
- A `Settle up` action.

The interface should make the direction of the debt unambiguous. Use explanatory text and clear labels rather than relying on colour alone.

### 7.4 Net Balance Calculations

For a group member:

`Net Position = Total Credits - Total Debits`

Positive positions indicate that the member is owed money. Negative positions indicate that the member owes money.

This is a conceptual model; implement the exact sign convention consistently across the application.

Whenever an expense or settlement changes, recalculate the affected net positions using the underlying ledger.

Buffered debt remains part of the member's net position.

### 7.5 Important Accounting Requirement

The Vibe Ledger must use the same underlying expense and settlement data as Circle balances.

Do not maintain unrelated, manually mutated debt totals that can drift away from the transaction history.

Any cached balances must be reproducible from the underlying records.

---

## 8. FEATURE FIVE: SMART SETTLE-UP

### Purpose

Reduce the number of individual transfers needed to settle a group's outstanding balances.

When several members have paid different expenses, the net debt relationships can become unnecessarily complicated.

Mesh should suggest a simpler settlement plan.

### 8.1 Example

Suppose:

- A owes B ₹300.
- B owes C ₹300.

Instead of requiring A to pay B and B to pay C separately, the app can suggest:

- A pays C ₹300.

This is a simplified illustration. The application must calculate the actual net balances before generating a settlement plan.

### 8.2 Algorithm

Build a deterministic net-balance settlement algorithm.

1. Calculate each member's net position from all confirmed group expenses and completed settlements.
2. Separate net debtors from net creditors.
3. Sort or iterate through each group deterministically.
4. Match debtors with creditors, transferring the minimum of the outstanding debtor amount and creditor amount.
5. Continue until all net balances have been matched, subject to any minor rounding remainder.
6. Display the proposed transfers and the reasoning behind them.

The goal is to reduce the number of suggested transfers while respecting all net positions.

Do not treat suggested transfers as completed payments. They remain proposals until users explicitly confirm settlement.

### 8.3 Settlement Flow

1. The user opens a Circle.
2. Mesh displays outstanding balances.
3. The user taps `Simplify settle-up`.
4. The app presents suggested transfers.
5. Each suggestion shows payer, recipient and amount.
6. Users can mark a transfer as settled when it has actually occurred.
7. Mesh records the settlement and updates both parties' outstanding balances.
8. Cash balances are adjusted only for the users who record an actual cash payment, according to the tracked account and payment flow.

Do not initiate UPI transfers or claim money has moved. The MVP is a tracking and coordination tool, not a payment processor.

---

## 9. FEATURE SIX: PERSONAL AND GROUP ACTIVITY

Create a coherent activity history across personal transactions and group events.

Useful activity events include:

- A personal expense added.
- An upcoming commitment created or paid.
- A Circle expense recorded.
- A receipt scanned and confirmed.
- An expense edited.
- A debt threshold crossed.
- A settlement suggested.
- A settlement confirmed.
- A recorded payment corrected.

Each activity item should include its date, title, amount where relevant, associated Circle and clear context.

Avoid showing sensitive details to users who are not authorized to see them.

Do not generate misleading fake system events. Demo activity must be clearly associated with demo data.

---

## 10. FEATURE SEVEN: HOME DASHBOARD

The dashboard should summarize the user's financial situation without overwhelming them.

Recommended sections:

### A. Greeting and Profile

Show the user's name or a friendly greeting, an avatar or initials and a settings entry point.

### B. Runway Meter

Display the current balance, recommended daily limit or estimated days remaining, next allowance information and a clear explanation of the calculation.

### C. Reserved Money

Show how much cash is reserved for unpaid upcoming expenses and the safety buffer.

### D. Recent Activity

List the latest personal and relevant group transactions.

### E. Money Owed and Receivable

Show the user's net group position and make the distinction between money owed by friends and cash already received clear.

### F. Upcoming Commitments

Show the next few unpaid obligations with due dates and amounts.

### G. Quick Actions

Provide fast access to:

- Add expense.
- Scan receipt.
- Create a Circle.
- Split an expense.
- Review debts.
- Update next allowance information.

The most important information should be visible immediately. Use progressively disclosed details rather than placing every metric on the initial screen.

---

## 11. FEATURE EIGHT: PROFILE AND SETTINGS

Implement a straightforward settings area with:

- Display name and avatar.
- Currency preference, with INR as the default.
- Preferred income-tracking mode.
- Next allowance date or target planning horizon.
- Safety buffer.
- Recent-spending estimate where applicable.
- Vibe Ledger preferences.
- Default expense categories.
- Notification preferences, if notifications are implemented.
- Data export or account deletion options appropriate to the backend and privacy requirements.

Store and display settings consistently. Avoid adding controls that do nothing.

---

## 12. COMPLETE USER FLOWS

### Flow A: New User and Runway Meter

1. User opens Mesh.
2. User completes a brief introduction.
3. User enters their current cash balance.
4. User chooses Exact Date, Target Days or Unknown.
5. User enters the relevant date or planning horizon.
6. User optionally adds upcoming commitments and a safety buffer.
7. Mesh calculates the initial spending runway.
8. The home dashboard explains the daily limit or estimated remaining days.
9. User adds a personal expense.
10. Mesh adjusts the tracked cash balance and recalculates the runway.
11. User can preview the impact of a proposed purchase before deciding.

### Flow B: Create a Circle and Split an Expense

1. User opens Circles.
2. User creates a Circle and adds members.
3. User starts a new shared expense.
4. User chooses a payer and participants.
5. User selects equal, unequal, percentage or itemized splitting.
6. Mesh calculates each participant's share.
7. User reviews and confirms the expense.
8. Mesh records the payment and creates the corresponding debts.
9. The payer's cash balance changes according to the actual payment.
10. Other participants see their outstanding obligations.
11. Relevant Runway Meters update without double-counting expenses.
12. Members can review the expense later and settle outstanding amounts.

### Flow C: Scan a Receipt

1. User opens a Circle.
2. User taps Add Expense and selects Scan Receipt.
3. User provides an image.
4. Mesh calls the server-side Gemini integration.
5. The server validates the extracted response.
6. Mesh displays editable receipt items.
7. User corrects details if necessary.
8. User selects the payer and assigns the items.
9. Mesh calculates tax/tip allocations and rounding.
10. The user confirms the split.
11. Mesh saves the expense and updates the ledger.
12. The dashboard and member balances refresh.

### Flow D: Vibe Ledger and Settle-Up

1. Several shared expenses accumulate.
2. Mesh records them individually.
3. Circle members see their running net balances.
4. Small balances remain recorded but do not trigger unnecessary individual settlement prompts.
5. When the agreed threshold or settlement period is reached, Mesh suggests reviewing balances.
6. User opens Smart Settle-Up.
7. Mesh calculates net positions and proposes simplified transfers.
8. The user reviews the suggestions.
9. Actual settlements are recorded only after confirmation.
10. The ledger and relevant personal cash balances update.

### Flow E: Correct an Expense

1. A member opens a previously recorded expense.
2. They edit an amount, participant, item or split.
3. Mesh validates the change and explains when other members' balances will be affected.
4. After confirmation, the expense is updated.
5. Net balances and cash-flow projections are recalculated from the corrected data.
6. The activity history records the correction appropriately.

---

## 13. DATA MODEL AND ENTITY RELATIONSHIPS

Design the data layer around distinct financial concepts.

### User

Suggested fields:

- `id`
- `displayName`
- `email` or authentication identity, if required
- `avatarUrl` or avatar initials
- `currency`
- `createdAt`

### Personal Finance Profile

- `userId`
- `currentBalanceMinor`
- `incomeMode`
- `nextIncomeDate`
- `targetDays`
- `trailingDailySpendMinor`
- `safetyBufferMinor`
- `createdAt`
- `updatedAt`

If recurring spending history is not available, distinguish an estimate from measured transaction history.

### Personal Expense

- `id`
- `userId`
- `title`
- `amountMinor`
- `category`
- `date`
- `notes`
- `paymentStatus`
- Optional Circle or group-expense reference
- `createdAt`
- `updatedAt`

Avoid recording the same financial event twice when linking personal and group expenses.

### Upcoming Commitment

- `id`
- `userId`
- `title`
- `amountMinor`
- `dueDate`
- `category`
- `status`
- `recurrenceRule`, if implemented
- Optional related transaction or settlement reference

### Circle

- `id`
- `name`
- `currency`
- `createdBy`
- `createdAt`

### Circle Membership

- `circleId`
- `userId` or demo participant ID
- `role`
- `joinedAt`
- Membership status, where appropriate

### Circle Expense

- `id`
- `circleId`
- `title`
- `payerId`
- `totalAmountMinor`
- `currency`
- `date`
- `splitMethod`
- `notes`
- `receiptReference`, if applicable
- `createdBy`
- `createdAt`
- `updatedAt`

### Expense Participant / Split

- `expenseId`
- `participantId`
- `shareAmountMinor`
- Item assignments or allocation metadata when relevant
- `settledAmountMinor`, or an equivalent derived representation

### Receipt Item

- `id`
- `expenseId` or draft reference
- `name`
- `quantity`
- `unitPriceMinor`
- `lineTotalMinor`
- Item assignments
- Optional tax-allocation metadata

### Settlement

- `id`
- `circleId`
- `payerId`
- `recipientId`
- `amountMinor`
- `currency`
- `status`
- `createdAt`
- Optional confirmed-at timestamp

### Activity Event

- `id`
- `actorId`
- `circleId`, if applicable
- `eventType`
- `relatedEntityId`
- `createdAt`
- Appropriate non-sensitive summary data

Use proper foreign keys, access controls and validation appropriate to the chosen storage system.

This is a logical schema, not a requirement to create every table independently. Keep the implementation proportionate to the MVP while ensuring accounting relationships remain consistent.

---

## 14. EDGE CASES AND VALIDATION

Do not implement only the happy path.

### Runway Meter

- Balance is zero.
- Balance is negative due to an adjustment.
- Commitments exceed the available cash.
- Safety buffer exceeds the available cash.
- Target date is today.
- Target date is in the past.
- Target-day input is zero, negative or invalid.
- Spending history is empty.
- Trailing daily spending is zero.
- A user edits or deletes an expense.
- The user changes the income mode.
- A commitment is marked paid.
- A commitment is counted in a group expense elsewhere.

### Group Splitting

- An expense has one participant.
- The payer is also a participant.
- The payer is not a participant.
- Participants have unequal shares.
- A member is removed or leaves a Circle.
- The split does not add up to the total.
- Rounding leaves a remainder.
- A receipt contains an unknown field.
- A confirmed expense is edited.
- A settlement is cancelled or corrected.
- The same expense is submitted more than once.

### Vibe Ledger

- A member has both credits and debits.
- Several members owe each other money.
- Some debts are buffered and others are ready to settle.
- A settlement partially pays an outstanding balance.
- An expense is corrected after a settlement suggestion has been generated.
- Rounding produces a small remainder.

### Receipt Scanner

- An invalid or unsupported image is uploaded.
- The provider returns malformed JSON.
- A field cannot be read reliably.
- The extracted subtotal differs from the line-item sum.
- The receipt total differs from the calculated total.
- The API times out or returns an error.
- The user cancels the upload.
- The user edits the extracted items before confirmation.

Validation errors should be understandable and actionable. Never silently discard a financial discrepancy.

---

## 15. VISUAL DESIGN AND USER EXPERIENCE

The quality of the visual implementation matters. Mesh should feel like a polished consumer product, not a generic admin dashboard.

### Overall Design Direction

Use a modern, friendly financial-product aesthetic with:

- Clean typography.
- Clear visual hierarchy.
- Generous whitespace.
- Rounded but restrained surfaces.
- A consistent spacing system.
- Simple line icons.
- Carefully chosen colour accents.
- Readable financial figures.
- Small, purposeful animations.
- A coherent set of design tokens.

Consider a calm neutral background, deep ink-coloured text, one distinctive primary accent and restrained semantic colours for success, caution and errors. Do not use bright colours everywhere.

Avoid excessive glassmorphism, unnecessary gradients, randomly coloured cards, giant empty spaces, too many pills and badges, gratuitous shadows or emoji used as substitutes for interface design.

### Data Visualisation

Make the Runway Meter visually distinctive and instantly understandable.

For example, use a horizontal or circular indicator, a clear daily amount and a compact breakdown of spendable, reserved and buffered money.

Use colour in combination with text and icons so users can understand warnings without relying on colour alone.

### Microinteractions

Use purposeful interactions such as:

- Smooth recalculation when expenses are added.
- Subtle feedback when an expense is saved.
- Clear transitions into the receipt review flow.
- Responsive item assignment controls.
- Immediate visual confirmation when a settlement is recorded.

Animations must not delay important actions or hide changing financial values.

### Responsive Behaviour

Start with the mobile experience because students are likely to use the app on their phones.

Then ensure the interface adapts elegantly to tablets and desktop browsers.

Avoid cramped tables on mobile; use responsive rows, compact cards or well-designed expandable details as appropriate.

### Accessibility

Provide:

- Readable text sizes.
- Sufficient contrast.
- Keyboard navigation.
- Visible focus states.
- Accessible form labels.
- Clear validation messages.
- Properly labelled buttons and icon controls.
- Touch targets appropriate for mobile use.

---

## 16. TECHNICAL ARCHITECTURE

Inspect the existing repository before making changes. Respect any already established frameworks, dependencies and working code.

If the repository is empty, choose a practical modern web stack. A reasonable starting point is:

- Next.js with TypeScript.
- React.
- Tailwind CSS.
- A consistent accessible UI component library where useful.
- A relational database for persistent financial records.
- A server-side route for Gemini receipt extraction.
- Schema validation for API inputs and outputs.
- Automated tests for financial calculations.

Do not replace an existing viable architecture without a clear reason.

### Separation of Responsibilities

Keep these layers distinct:

1. **Presentation:** Screens, forms, reusable components and visual states.
2. **Application state:** Current user's profile, transactions, Circles and UI interactions.
3. **Business logic:** Cash-flow calculations, expense allocations, debt balances, settlement algorithms and validation.
4. **Persistence:** Database operations, data access controls and migrations.
5. **AI integration:** Receipt image uploads, model invocation, schema validation and error handling.

Use pure functions for core calculations whenever practical. This makes them easier to test and protects them from accidental changes during UI work.

Do not put all application logic in a massive component.

### Environment and API Keys

Use environment variables for secret keys.

The Gemini API key must remain on the server. Never expose it in browser bundles, client components, source code committed to the repository or visible URLs.

Provide an `.env.example` containing variable names and descriptions but no real credentials.

### Persistence

Use a suitable persistence layer for user accounts, personal transactions, Circle membership, group expenses, splits and settlements.

If backend credentials or external services are unavailable during development, implement a clearly identified demo mode using realistic sample data and a reliable local persistence strategy.

Do not pretend a local-only demo is a production multi-user backend.

### Data Access and Security

Financial and group data are private.

Implement access control so users cannot read or modify another user's personal finances or a Circle they do not have permission to access.

Validate all user-supplied data and all server requests. Protect API endpoints and avoid trusting user IDs or financial totals supplied by the client.

---

## 17. AI RESPONSIBILITIES AND NON-AI RESPONSIBILITIES

Use AI where it provides real value.

### AI may handle:

- Extracting receipt information from images.
- Identifying potential line items and prices.
- Describing uncertain receipt fields.
- Producing friendly explanations of already calculated financial information.
- Providing a natural-language summary of an expense split.

### Deterministic application code must handle:

- Runway calculations.
- Currency arithmetic.
- Tax and tip allocation.
- Individual expense shares.
- Net member positions.
- Outstanding balances.
- Settlement calculations.
- Balance and obligation updates.
- Validation and reconciliation.

AI output must never directly alter confirmed balances without passing through validated application logic and an explicit user-confirmation flow.

---

## 18. TESTING REQUIREMENTS

Write and execute tests for all financial logic before treating the application as complete.

Minimum test categories:

### Runway Tests

- Exact-date calculation.
- Target-days calculation.
- Unknown-date runway estimate.
- Zero balance.
- Reservations exceeding balance.
- Safety-buffer handling.
- Same-day and past dates.
- Zero or invalid planning horizons.
- Expense addition and deletion.
- Commitment creation and payment.
- Correct recalculation after changes.

### Expense Split Tests

- Equal split.
- Unequal split.
- Percentage split.
- Itemized split.
- Payer included in or excluded from participants.
- Rounding and exact reconciliation.
- Tax and tip allocation.
- Edit and correction behaviour.

### Accounting Tests

- Payer's cash decreases by the actual amount paid.
- Receivables are not counted as cash received.
- Unpaid group shares remain obligations.
- Settlement decreases the outstanding obligation.
- Confirmed settlements update tracked cash appropriately.
- No expense or payment is deducted twice.
- The ledger and member balances remain consistent after edits.

### Vibe Ledger Tests

- Threshold handling.
- Buffered balance visibility.
- Accumulated small debts.
- Simplified settlement examples.
- Partial settlement.
- Several debtors and creditors.
- Correct handling of rounding remainders.

### AI Integration Tests

- Valid extracted JSON.
- Invalid JSON.
- Missing fields.
- Incorrect or inconsistent totals.
- Provider errors and timeouts.
- User edits before confirmation.
- Confirmation required before committing an expense.

Use realistic INR test cases and verify the numerical results explicitly.

---

## 19. IMPLEMENTATION PRIORITIES FOR A 24-HOUR HACKATHON

Build a coherent, testable product rather than a large collection of incomplete features.

### Priority 1: Essential

- Responsive product shell and navigation.
- Onboarding.
- Student Runway Meter.
- Manual expense entry.
- Upcoming commitments and safety buffer.
- Correct accounting for actual cash versus outstanding debts.
- Persistent or clearly identified demo data.

### Priority 2: Core Group Workflow

- Create Circles.
- Add members.
- Add shared expenses.
- Support equal and itemized splitting.
- Display net group balances.
- Update the personal runway correctly.

### Priority 3: Vibe Ledger

- Running balances for small debts.
- Configurable buffering threshold.
- Visible expense history.
- Suggested smart settle-up transfers.
- Confirmed settlement tracking.

### Priority 4: AI Receipt Scanning

- Receipt upload.
- Server-side Gemini integration.
- Structured extraction.
- Editable review interface.
- Item assignment.
- Tax/tip allocation.
- Confirmation and ledger update.

If time becomes limited, prioritize correct accounting and a polished end-to-end demo over additional features. Receipt scanning should have a dependable manual-entry fallback.

Do not add bank integrations, payment processing, automatic UPI access, elaborate investment features or unrelated AI chat functionality to the MVP.

---

## 20. EXPECTED QUALITY OF THE FINAL PRODUCT

The completed application should satisfy these criteria:

1. A new user can understand Mesh's purpose within seconds.
2. A user can set up their financial runway quickly.
3. Adding a real cash expense updates the spending limit correctly.
4. Upcoming obligations and the safety buffer are clearly explained.
5. A user can create a Circle and record a shared expense.
6. Every participant's share is calculated and displayed correctly.
7. Group debts are distinguishable from money already received.
8. The Vibe Ledger can accumulate small debts without hiding them.
9. Smart settle-up generates valid transfer suggestions from net balances.
10. A confirmed payment updates the correct cash balance and outstanding debt.
11. Receipt scanning, when configured, produces editable structured data.
12. AI extraction errors cannot silently corrupt financial records.
13. All primary interactions work; there are no dead buttons or fake integrations.
14. The interface is responsive, visually consistent and usable on mobile.
15. Important calculations have automated tests.
16. Demo data is realistic and clearly separated from real financial information.
17. Errors, loading states, empty states and success feedback are implemented.
18. Privacy, permissions and API keys are handled appropriately for the chosen architecture.

---

## 21. INSTRUCTIONS FOR THE CODING AGENT

Treat this document as the central product specification for Mesh.

Before implementation:

1. Inspect the existing repository and identify its frameworks, conventions and current state.
2. Identify the main screens and user journeys required.
3. Establish a sensible shared design system and data model.
4. Implement the core financial calculations as tested, reusable functions.
5. Build the UI around those working calculations rather than hard-coded display values.
6. Connect each feature to the relevant application state and persistence layer.
7. Verify that updates propagate correctly between personal finances, Circles, expenses, debts and settlements.

During implementation:

- Write maintainable TypeScript.
- Use reusable components.
- Avoid unnecessary dependencies.
- Keep business logic separate from presentation.
- Use realistic data only for explicitly identified demos.
- Handle errors and loading states.
- Do not silently skip requested features.
- Do not implement buttons that merely look functional.
- Do not invent completed API integrations.
- Do not expose API keys.
- Do not sacrifice calculation correctness for animations or visual effects.

Use the configured Claude model for UI and general implementation where appropriate, and Gemini for the server-side vision and structured-output receipt workflow. The particular model used to write code must not change the product requirements.

After implementation, run the available build, type-check and test commands. Fix errors rather than merely describing them. Test the primary user flows from beginning to end, especially the connection between a group expense, a member's outstanding obligation and their personal Runway Meter.

If a required external credential is not available, build the integration boundary and a clear fallback mode. State exactly what is operational and what still requires configuration.

The final result must be a working, coherent application—not merely a static design or a dashboard with simulated financial calculations.

## FINAL PRODUCT SUMMARY

Mesh is a student-focused money management application that combines personal spending runway with group expense coordination.

The Student Runway Meter helps users understand their available cash, upcoming commitments, daily spending limit and estimated financial runway. Circles allow friends to share expenses and track their individual obligations. The AI receipt scanner reduces manual data entry, the Vibe Ledger makes small shared debts easier to manage, and Smart Settle-Up simplifies settlement suggestions.

The essential product experience is:

**Know your money. Understand what you owe. Split expenses easily. Settle up without the awkwardness.**

Every feature should reinforce that experience, and every financial calculation must remain understandable, auditable and correct.
