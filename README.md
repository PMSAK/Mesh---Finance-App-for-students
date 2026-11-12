# Mesh

### Personal money and shared spending, connected.

**Mesh** is a student-focused personal finance and shared-expense management application. It brings individual budgeting, allowance planning, upcoming commitments, group expenses, and debt settlement into one workflow.

> **The idea:** Knowing who owes you money is useful. Knowing how that spending affects the money you need to live on is even more useful.

Mesh was developed as a hackathon project to explore how students can make better spending decisions when their money needs to last until their next allowance or income.

---


## 1. The Problem

College students often have to manage a limited or irregular allowance while paying for essentials such as hostel fees, food, transport, and subscriptions. At the same time, they share costs with friends for meals, groceries, outings, and trips.

These two areas of money management affect each other, but they are often handled separately:

- **Personal spending:** How much money is available, which bills are coming up, and how long funds need to last.
- **Shared spending:** Who paid, who participated, who owes whom, and when debts should be settled.

An expense-splitting tool can correctly report that a friend owes someone money without showing whether the person who paid can comfortably cover their own upcoming commitments.

A receivable is not the same as cash already in hand.

**Mesh addresses the connection between these two problems.**

---

## 2. The Solution

Mesh combines personal financial planning with shared-expense tracking. Instead of treating a group purchase as an isolated bill, Mesh is designed to show how it relates to the user's cash, reserved commitments, safety buffer, and remaining spending runway.

The product revolves around three actions:

1. **Understand your runway** — know your cash, commitments, buffer, and estimated spending capacity.
2. **Manage shared spending** — track group expenses, individual balances, and settlements in Circles.
3. **Make informed decisions** — review the potential effect of spending and debt repayment on your remaining money.

---

## 3. Core Features

### 3.1 Student Runway Meter

The Runway Meter is Mesh's central budgeting feature. It provides a practical view of how much money a student can use while accounting for upcoming obligations.

| Term | Meaning |
|---|---|
| **Tracked cash** | Money currently recorded as available to the user. |
| **Unpaid commitments** | Upcoming obligations that should be reserved, such as hostel fees or subscriptions. |
| **Safety buffer** | Money the user chooses to protect against unexpected needs. |
| **Flexible balance** | Cash remaining after eligible commitments and the safety buffer are reserved. |
| **Daily spending limit** | A planning estimate based on flexible balance and the number of days the money must last. |

**Core formulas:**

```text
Flexible balance = max(0, tracked cash - eligible unpaid commitments - safety buffer)

Daily spending limit = flexible balance / remaining planning days
```

The daily limit is a planning guideline, not a guarantee that a purchase is affordable or that future expenses will match the estimate.

#### Allowance planning modes

- **Exact date:** The user knows when the next allowance or income is expected.
- **Target days:** The user wants current money to last for a chosen number of days.
- **Not sure:** The next income date is unknown. Mesh can estimate a runway using observed spending or a user-provided fallback daily spending estimate, while clearly identifying the uncertainty.

### 3.2 Personal Expenses and Income

Mesh tracks everyday money movements, including personal spending and income.

The expense workflow is intended to support transaction details such as amount, date, category, and description, along with reviewing and correcting entries.

Accurate edits and deletions are important because financial summaries must reflect the current ledger rather than stale totals.

### 3.3 Upcoming Commitments

Students can plan for obligations that have not yet been paid, such as recurring subscriptions, hostel fees, or other bills.

An unpaid commitment reserves spending capacity but does not itself mean cash has already left the account.

Once a commitment is paid, the application should record the actual payment and remove or update the reservation so the amount is not deducted twice.

### 3.4 Circles — Shared Expenses with Friends

**Circles** are groups for managing shared spending. A Circle can represent roommates, classmates, friends on a trip, or another group that regularly shares costs.

The shared-expense workflow covers:

- Group members and shared transactions.
- Who paid for an expense.
- Which members participated.
- Allocation of each participant's share.
- Balances between members.
- A history of shared expenses and settlements.

Mesh's product design includes equal and more flexible splitting methods; availability of individual split types should be checked against the current build.

### 3.5 Vibe Ledger — Small Debts Without Unnecessary Pressure

**Vibe Ledger** gives shared balances a less awkward social workflow. Small debts remain visible, but a group can choose not to prompt immediate settlement of every minor amount.

Two important states are:

- **Buffered:** The debt is still owed and tracked, but it is below the configured suggestion threshold or otherwise not being prompted for immediate settlement.
- **Ready to settle:** The balance meets the configured settlement-suggestion condition.

A settlement threshold is a reminder preference, not a payment deadline or proof of affordability.

A buffered debt is never forgiven, deleted, or marked paid merely because it is buffered.

For clarity, threshold comparisons should use a consistently defined balance (for example, the net balance between two members) and explain that rule in the interface.

### 3.6 Smart Settle-Up

Smart Settle-Up is designed to suggest a simpler set of payments for resolving group balances. It uses the members' net positions to identify valid transfers and reduce unnecessary back-and-forth payments where practical.

Important rules:

- Suggested transfers are proposals, not completed payments.
- A user must confirm an actual settlement before the ledger changes.
- The settlement history should remain traceable.
- The total owed across the group must reconcile correctly.

### 3.7 "Can I Afford This?" — Spending Impact Preview

This feature is intended to help a student consider a proposed purchase before committing to it.

A preview can show:

- The amount the user would actually pay.
- Their projected cash balance.
- Their projected flexible balance and daily spending limit.
- Whether the purchase could affect upcoming commitments or the safety buffer.

For group purchases, it is essential to distinguish the full cash payment from the user's own share and any amounts other members still owe them.

A preview should never mutate the ledger until the transaction is confirmed.

### 3.8 AI-Assisted Receipt Scanning

The receipt-scanning workflow is designed to reduce manual entry for shared purchases:

1. Upload a receipt image.
2. Extract merchant, date, line items, and prices with an AI model.
3. Review and correct the extracted fields.
4. Assign items or shares to Circle members.
5. Confirm the expense only after the application validates the amounts.

AI extraction can be inaccurate.

**The app, not the language model, should perform final arithmetic**, including rounding and reconciliation of totals.


### 3.9 Activity and Settings

Mesh also brings together transaction history and user preferences.

Relevant settings include the safety buffer, allowance planning, and Vibe Ledger settlement-suggestion behavior.

---

## 4. How Mesh Handles Money

Financial correctness is central to Mesh.

| Event | Correct financial treatment |
|---|---|
| Personal expense | Reduces tracked cash when paid. |
| Income received | Increases tracked cash. |
| Unpaid commitment | Reserves flexible spending capacity; does not yet reduce cash. |
| Commitment paid | Reduces cash and releases or updates its unpaid reservation without double-counting. |
| User pays a shared expense | Reduces their cash by the full amount they actually paid. |
| Other members owe the user | Creates receivables; does not increase cash until repayment is received. |
| User owes another member | Creates a payable; does not reduce cash until payment occurs. |
| Settlement suggestion | Does not change money or debt balances. |
| Confirmed settlement | Updates the appropriate cash and debt records exactly once. |

Where possible, monetary calculations should use **integer paise** rather than floating-point arithmetic to prevent rounding discrepancies.

---

## 5. Typical User Workflow

```text
Set cash and allowance preferences
              |
              v
Reserve commitments and safety buffer
              |
              v
View flexible balance and runway
              |
              v
Record personal or Circle expenses
              |
              v
Review balances and Vibe Ledger status
              |
              v
Preview purchases or suggested settlements
              |
              v
Confirm actual payments and refresh the runway
```

The aim is a connected experience: updates in one part of the app should be reflected consistently wherever the same financial information appears.

---

## 6. Mesh vs Splitwise

[Splitwise](https://www.splitwise.com/) is an established shared-expense management product. It supports groups, expense tracking, balances, and debt-management workflows.

Mesh is not differentiated simply by offering bill splitting, settlement simplification, or receipt scanning.

Mesh's intended differentiation is its **student-focused combination** of shared expenses and personal money planning:

| Area | Splitwise's primary focus | Mesh's product focus |
|---|---|---|
| Shared expenses | Track and organize shared costs | Track shared costs in Circles |
| Balances and settling | Understand who owes whom | Manage balances with Vibe Ledger and Smart Settle-Up |
| Personal runway | Not established by the supplied comparison screenshots | Connect cash, commitments, buffer, and allowance planning |
| Spending decisions | Do not infer absence of a feature from screenshots | Preview the effect of spending on personal runway |
| Student experience | Useful for students and other groups | Explicitly designed around student allowance and shared-living needs |

This is a positioning comparison, not a verified exhaustive feature audit of Splitwise.

Competitive claims should be checked against current official documentation before external publication.

---


## 7. Design Principles

Mesh uses a friendly but restrained fintech visual identity.

| Role | Color |
|---|---|
| Forest green | `#176B52` |
| Deep forest | `#104A3A` |
| Soft mint | `#DDF4E8` |
| App background | `#F7F8F5` |
| Main text | `#18231F` |
| Secondary text | `#68746D` |

The interface aims for mobile-first layouts, readable financial summaries, simple navigation, clear empty states, and transparent explanations of financial terms.

---


## 8. Limitations and Future Work

Potential improvements include:

- More robust multi-device synchronization and user accounts, if not already present.
- Better forecasting with explicit uncertainty and spending-history requirements.
- Clearer settlement rules, reminders, and partial repayment support.
- Stronger automated accounting and regression tests.
- Improved receipt extraction reliability and manual correction workflows.
- More explainable, data-grounded Money Coach recommendations.
- Security, privacy, and deployment hardening for use beyond a prototype.

These are areas for evaluation, not claims that every capability is currently missing.

---

## 9. Project Background

Mesh was built for **InnoSprint 2.0**, a hackathon at Chandigarh University, as a student-focused exploration of personal finance and shared expense management.

---

**Mesh — Split the bill. Protect your runway. Keep the plans.**
