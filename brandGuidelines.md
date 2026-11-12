# MESH — Brand Guidelines, Visual Identity & Complete UI/UX Design System

## 1. THE DESIGN VISION

### Product Name
Mesh

### Brand Essence
Money, without the awkwardness.

### Product Positioning
Mesh is a modern, student-first personal finance and group-expense application. It helps users understand how long their money will last, track shared expenses, manage small debts among friends and split bills without unnecessary friction.

The interface must make financial information feel clear, approachable and manageable. It should make students feel informed rather than judged, and organized rather than overwhelmed.

### The Visual Direction

Design Mesh as a premium consumer fintech product with a friendly social personality.

The visual language should combine:

- The clarity and trustworthiness of a well-designed financial application.
- The simplicity and responsiveness of a modern mobile consumer app.
- The warmth and approachability of a product made for university students.
- The precision of a serious tool that handles real financial information.
- The distinctive personality of a brand that understands how students share money with friends.

The overall interface should be visually distinctive, but never at the expense of readability or financial accuracy.

### The Desired Feeling

When users open Mesh, they should feel:

- Calm about their finances.
- Confident that the numbers are understandable.
- Motivated to keep track of spending without feeling monitored.
- Comfortable managing debts with friends.
- Able to complete common actions quickly.
- Interested in returning to the product because it feels pleasant to use.

### The Main Design Principle

**Make money feel simple. Make shared expenses feel natural. Make every screen feel intentional.**

Every visual element must support a real product purpose. Avoid decorative elements that add complexity without helping the user understand or complete an action.

---

## 2. BRAND PERSONALITY

Mesh should have five defining characteristics.

### 2.1 Clear

Financial information must be immediately understandable. Use meaningful labels, well-aligned currency figures, concise explanations and clear visual hierarchy.

Avoid unexplained financial terminology, excessive charts and decorative metrics.

### 2.2 Friendly

Use natural language and occasional light-hearted copy. The app should sound like a helpful friend who understands budgeting, not an accountant or a bank.

Examples:

- "Your money, at a glance."
- "Looking good. You've got room to spend."
- "Keep a little aside for later."
- "Everyone's share is sorted."
- "Small debts, one less thing to think about."

Keep personality subtle. Do not make serious financial warnings sound like jokes.

### 2.3 Trustworthy

The product must look credible enough for users to rely on when reviewing their money.

Use consistent spacing, precise numbers, clear confirmation states and transparent explanations.

Never use visual effects that make estimated information look more certain than it is.

### 2.4 Social

Group expenses should feel like something friends coordinate together rather than a formal accounting process.

Use member avatars, initials, friendly Circle identities and clear explanations of who paid and who owes whom.

Avoid creating social pressure through leaderboards, public spending rankings or shaming language.

### 2.5 Modern

Use clean typography, purposeful negative space, restrained colour, smooth interaction and polished responsive layouts.

Modern does not mean adding gradients to every card, putting everything inside a floating panel or animating every element.

---

## 3. LOGO AND BRAND IDENTITY

### Wordmark

The product name is `Mesh`.

Use a clean, contemporary sans-serif wordmark with medium or semibold weight. The typography should feel approachable and slightly distinctive without relying on novelty fonts.

Use the wordmark in the application shell, onboarding and loading states.

### Logo Concept

Use a simple, geometric symbol inspired by connected points or interwoven paths. The concept should communicate connection, shared money and the relationship between individual finances and group expenses.

The icon should be simple enough to work at 20–32 pixels.

Preferred direction: a compact geometric mark made from interconnected rounded shapes or a continuous, woven line. Avoid complicated illustrations, coins, rupee symbols used as the entire logo, literal mesh fences or generic wallet clip art.

The logo should work in:

- A mint or forest-green version on light backgrounds.
- A white version on the primary brand colour.
- A monochrome version for small utility contexts.

Do not use different logo treatments across screens.

If a finished logo asset is not available, create a simple, original SVG mark and pair it with the wordmark. Do not rely on random emoji as the permanent logo.

### Brand Usage

Use the symbol sparingly. Do not place a large logo on every dashboard card or repeat the brand name unnecessarily throughout the interface.

---

## 4. COLOUR SYSTEM

Mesh should use a light, warm-neutral foundation with a rich green primary colour and a soft mint accent.

The palette must be implemented through reusable design tokens rather than individually hard-coded colours throughout components.

### 4.1 Primary Brand Colours

**Forest Green — `#176B52`**

Use for:
- Primary buttons.
- Main navigation selection.
- Key actions.
- Active controls.
- Important positive indicators when semantically appropriate.
- Selected interactive elements.

This is the main brand colour. It should feel confident and grounded, not neon.

**Deep Forest — `#104A3A`**

Use for:
- Hover states on the primary action.
- Strong brand accents.
- Selected dark brand surfaces where appropriate.
- Occasional emphasized headings or graphic elements.

Do not use it for every heading merely because it is the brand's darkest colour.

**Soft Mint — `#DDF4E8`**

Use for:
- Subtle brand-tinted backgrounds.
- Secondary surfaces related to spending progress.
- Lightweight success or completion treatments where appropriate.
- Small branded visual accents.

Mint should support the hierarchy rather than replace the main background.

### 4.2 Neutral Colours

**App Background — `#F7F8F5`**

The default page background. Use a slightly warm off-white that is comfortable for long sessions.

**Surface — `#FFFFFF`**

Use for:
- Main cards.
- Forms.
- Dialogs.
- Dropdown menus.
- Tables and transaction lists where additional separation is needed.

**Subtle Surface — `#F0F3EF`**

Use for:
- Secondary content panels.
- Input backgrounds when appropriate.
- Muted visual sections.
- Non-selected secondary controls.

**Primary Text — `#18231F`**

Use for:
- Main headings.
- Financial amounts.
- Primary content.
- Important labels.

**Secondary Text — `#68746D`**

Use for:
- Supporting descriptions.
- Timestamps.
- Metadata.
- Explanatory captions.

**Muted Text — `#87918B`**

Use sparingly for genuinely secondary information. Never use it for essential financial information or important instructions where contrast becomes insufficient.

**Border — `#E3E9E3`**

Use for:
- Input borders.
- Subtle dividers.
- Card outlines where needed.
- Table row separation.

Borders should establish structure without making the interface feel like a spreadsheet.

### 4.3 Semantic Colours

**Success Green — `#237A52`**

Use for confirmed positive states, successful actions and completed operations.

**Success Background — `#E7F5EC`**

Use behind relevant success messages or subtle status indicators.

**Warning Amber — `#A96314`**

Use for caution states, upcoming obligations requiring attention and situations approaching a configured financial limit.

**Warning Background — `#FFF3D9`**

Use behind warning messages.

**Danger Red — `#B93838`**

Use for errors, failed operations and serious financial concerns.

**Danger Background — `#FCEAEA`**

Use behind serious warning messages and relevant destructive-action states.

**Information Blue — `#3568A8`**

Use for informational messages and neutral explanatory states, not routine decorative accents.

**Information Background — `#EAF2FC`**

Use behind informational guidance where needed.

Semantic colours must communicate actual states consistently.

For example, green should not always mean "money you receive," red should not always mean "money you spend," and yellow should not be used merely to make a card look interesting.

Always pair meaningful colours with text or icons. Do not communicate financial status through colour alone.

### 4.4 Usage Rules

- The warm off-white background should dominate the application.
- White surfaces should create clear, intentional levels of content.
- Forest green should attract attention to primary actions.
- Mint should be an accent, not the background of every card.
- Use amber and red only when something genuinely requires attention.
- Avoid random purple, neon blue and multicolour gradients.
- Do not give every dashboard metric a different colour.
- Avoid using the full semantic palette simultaneously on one screen.

The application should feel calm even when it contains a lot of financial data.

---

## 5. TYPOGRAPHY

### Preferred Font

Use **Inter** or an equivalent modern sans-serif already available in the project. A bundled or locally available font is preferable to introducing an unnecessary external dependency.

The font should be highly legible for numbers, form fields and financial data.

Use the same typography system consistently across every screen.

### Type Scale

Use the following as the default desktop scale, adjusting responsively on smaller screens.

| Role | Size | Weight |
|---|---:|---|
| Display heading | 36–44 px | 650–700 |
| Page heading | 28–32 px | 650–700 |
| Section heading | 20–24 px | 600 |
| Card heading | 16–18 px | 600 |
| Body text | 14–16 px | 400–450 |
| Small supporting text | 12–13 px | 400 |
| Compact labels | 11–12 px | 500 |
| Major financial figure | 36–48 px | 600–700 |

Use a consistent line-height and avoid squeezing text into small containers.

On mobile, reduce display and page-heading sizes enough to avoid awkward wrapping.

### Financial Numerals

Financial amounts must be easy to scan.

Use tabular numerals when supported so figures align vertically in lists and comparisons.

Examples:

- ₹4,250
- ₹250/day
- ₹1,200 reserved
- ₹480 owed to you

Do not randomly switch between formats such as `₹1,200.00`, `1200 INR` and `Rs. 1200`.

For INR, use the rupee symbol and Indian digit grouping where applicable. Show decimal paise only when relevant.

### Typography Rules

- Use boldness to create hierarchy, not to emphasize every sentence.
- Avoid all-uppercase headings except for small optional section labels.
- Do not italicize financial values.
- Avoid mixing several different typefaces.
- Avoid oversized paragraph text that makes dashboards feel like marketing pages.
- Maintain adequate contrast across all font sizes.

---

## 6. SPACING, GRID AND LAYOUT SYSTEM

Use a consistent spacing system based on multiples of 4 pixels.

Suggested spacing tokens:

- `space-1`: 4 px
- `space-2`: 8 px
- `space-3`: 12 px
- `space-4`: 16 px
- `space-5`: 20 px
- `space-6`: 24 px
- `space-8`: 32 px
- `space-10`: 40 px
- `space-12`: 48 px
- `space-16`: 64 px

Prefer 16–24 px internal padding for standard cards and 24–32 px for major dashboard sections.

Avoid both extremes: cramped layouts and huge empty areas that force users to scroll unnecessarily.

### Desktop Layout

For screens above approximately 1024 px:

- Use a fixed-width or compact collapsible sidebar.
- Use a flexible main content area.
- Add a sensible maximum content width for the principal dashboard.
- Keep major content aligned to a consistent grid.
- Avoid spreading small cards across the entire width of a large monitor.
- Use two or three columns only when the content benefits from comparison.
- Make forms readable and avoid unnecessarily long horizontal input rows.

A typical application shell should consist of:

1. Sidebar navigation.
2. Main page header.
3. Main content area.
4. Optional right-side contextual panel when there is a strong purpose for it.

Do not force every page into three columns.

### Tablet Layout

At tablet sizes:

- Collapse or simplify the sidebar.
- Use two-column layouts where space permits.
- Maintain readable card widths.
- Prevent split forms and tables from becoming cramped.

### Mobile Layout

Below approximately 768 px:

- Use a mobile-first single-column layout.
- Replace the persistent desktop sidebar with a compact bottom navigation bar.
- Keep major actions easily reachable.
- Use full-width primary buttons when appropriate.
- Stack cards logically.
- Keep page padding around 16–20 px.
- Ensure dialogs and sheets fit within the viewport.
- Avoid horizontal overflow.
- Prefer bottom sheets for short actions that benefit from remaining in context.
- Ensure the virtual keyboard does not obscure essential form controls.

The application must feel designed for mobile, not merely shrunk from a desktop dashboard.

---

## 7. SHAPE LANGUAGE, CARDS AND SURFACES

### Corner Radius

Use a coherent radius system:

- Small controls: 8 px.
- Inputs and standard buttons: 10–12 px.
- Standard cards: 14–16 px.
- Large feature cards: 18–22 px.
- Avatars and circular indicators: fully rounded.

Avoid making every component excessively pill-shaped. Reserve pill shapes for compact filters, status indicators and selected chips.

### Card Design

Cards should primarily use white backgrounds on the warm app background.

Use subtle borders to define edges. Shadows should be rare and soft, primarily for elevated popovers, dropdowns and dialogs.

A standard card should generally contain:

- A meaningful title or label.
- Its main content.
- Supporting information if required.
- A clear action where applicable.

Not every card needs an icon, badge, subtitle and button simultaneously.

### Surface Hierarchy

Maintain three clear levels:

1. App background.
2. Main white surfaces.
3. Elevated interactive elements such as dialogs and menus.

A light green panel may be used for the main Runway Meter visualization, but do not turn every card into a coloured block.

### Dividers

Use subtle dividers within transaction lists, menus and grouped settings.

Avoid heavy borders around every list row.

### Shadows

Use a near-invisible shadow only when necessary to create depth.

Do not apply large shadows to all cards. The design should feel crisp and grounded.

---

## 8. ICONOGRAPHY AND ILLUSTRATIONS

Use a consistent line-icon library such as Lucide.

Recommended icons:

- Home: `house`
- Expenses: `receipt-text`
- Add expense: `plus`
- Circles: `users`
- Runway or spending: `wallet` or `gauge`
- Upcoming commitments: `calendar-clock`
- Receipt scanner: `scan-line`
- Vibe Ledger: `hand-coins`
- Settlement: `arrow-left-right`
- Settings: `settings`
- Notifications: `bell`
- Search: `search`
- Edit: `pencil`
- Delete: `trash-2`
- Confirmation: `check-circle`
- Warning: `triangle-alert`
- Error: `circle-alert`
- More options: `ellipsis`

If a named icon does not exist in the chosen library version, use a valid equivalent rather than drawing a random replacement.

Keep icon stroke weight and visual scale consistent.

Most standard icons should be around 18–22 px. Larger icons may be used for empty states and onboarding illustrations.

Do not use emoji as the primary icon system.

### Illustrations

Use a restrained illustration style for empty states and onboarding. Prefer simple vector illustrations based on geometric shapes, friendly abstract objects and the Mesh brand colours.

Illustrations should clarify an empty state or help introduce a concept. Do not scatter decorative illustrations throughout the dashboard.

Do not use random stock photography as a substitute for product UI design.

---

## 9. APPLICATION SHELL AND NAVIGATION

### Desktop Sidebar

The sidebar should feel compact, elegant and functional.

At the top:
- Mesh logo and wordmark.

Main navigation:
- Home
- Expenses
- Circles
- Activity

Lower section:
- Settings
- User profile and account controls

Use a subtle mint or pale green background for the selected navigation item, with dark forest-green text and icon.

Unselected items should use a neutral text colour.

Selected states must remain apparent without huge icons or aggressive colour blocks.

The sidebar should be consistent across the application's primary screens.

### Mobile Navigation

Use a bottom navigation bar with four primary destinations:

- Home
- Expenses
- Circles
- Activity

Settings can be accessed through the profile/avatar menu.

Add Expense should be available through a prominent action on relevant screens, rather than duplicating a fifth equally weighted navigation destination if that makes the bar crowded.

The bottom bar should:

- Respect safe-area insets.
- Remain visually lightweight.
- Clearly identify the active destination.
- Avoid obscuring scrollable content.
- Use appropriate active and inactive icon states.

### Page Headers

Every primary page should have a clear heading and one concise line of context where useful.

Secondary actions such as filters, settings and date selection can appear to the right on desktop or in a compact menu on mobile.

Do not repeat the logo or greeting at the top of every section within the same page.

---

## 10. ONBOARDING AND FIRST-TIME EXPERIENCE

The onboarding experience should feel personal, fast and reassuring.

Avoid a long enterprise-style wizard.

### Onboarding Screen 1: Welcome

Show the Mesh logo, a strong headline and a short explanation.

Suggested copy:

"Your money, minus the stress."

Supporting line:

"Know your spending runway, split bills with friends and keep small debts from becoming a big deal."

Primary button:
"Get started"

Secondary option:
"Explore demo"

Use a calm, spacious composition with an understated brand illustration. Avoid full-screen gradients and oversized decorative graphics.

### Onboarding Screen 2: Current Balance

Headline:
"How much money do you have right now?"

Use a prominent currency input with ₹ as the default currency.

Provide a short explanation that the figure represents the cash balance the user wants to track, not necessarily a live bank balance.

Primary button:
"Continue"

### Onboarding Screen 3: Next Allowance

Headline:
"When does your money come in?"

Options:
- I know the date.
- Give me a number of days to budget for.
- I'm not sure yet.

Show only the fields relevant to the selected mode.

Use a clear date picker or number input. Explain that the estimate will adjust as the user records spending.

### Onboarding Screen 4: Upcoming Expenses

Headline:
"Anything important coming up?"

Allow users to add essential expenses, such as hostel fees, transport, bills or groceries.

Make this step skippable.

### Onboarding Screen 5: Initial Runway

Show the computed starting runway with a transparent breakdown.

Suggested copy:

"Here's a starting point."

Explain the balance, reserved commitments, buffer and daily limit. Do not tell the user that an estimated figure is guaranteed to be safe.

Primary button:
"Go to my dashboard"

The onboarding must be functional. Saving an input must actually affect the following screen.

---

## 11. HOME DASHBOARD — THE CORE EXPERIENCE

The home dashboard is the most important screen in Mesh.

It must give users a quick, accurate picture of their current finances and make common actions easy to reach.

### 11.1 Greeting and Header

At the top of the content area, show a simple greeting.

Example:

"Hey, Alex"

Supporting text:

"Here's where your money stands."

Include a discreet profile avatar and, where implemented, a notifications entry point.

Avoid a huge marketing-style hero that consumes most of the first viewport.

### 11.2 Student Runway Meter

This is the most visually distinctive dashboard element.

It should be the primary financial summary card, with the following hierarchy:

1. Small label: "DAILY SPENDING LIMIT"
2. Large central value: "₹250/day"
3. Supporting message: "Based on your next allowance and upcoming essentials."
4. A compact visual runway indicator.
5. The number of days remaining or an estimated runway, depending on the selected income mode.
6. A small action such as "View breakdown."

Use a pale mint background and rich forest-green text. Keep the treatment refined and readable.

The large financial figure should dominate the card.

Do not use a circular gauge merely for decoration. If using a gauge, its progress must have a clearly defined meaning. A simple progress indicator or stacked breakdown is preferable when the calculation does not map naturally to a percentage.

The Runway Meter should include a clear breakdown of:

- Current tracked cash.
- Unpaid commitments.
- Safety buffer.
- Flexible balance.
- Daily limit or estimated remaining days.

The breakdown can open in an expandable section or a separate detail view.

If the income date or spending history is unknown, adapt the display. Never show a fabricated forecast just to keep the layout populated.

### 11.3 Current Cash Balance

Show the total tracked balance separately from the daily spending limit.

A user must not confuse the two values.

Use a secondary white card or a compact financial summary directly below the Runway Meter.

Example:
"Cash balance"
"₹4,000"

Optionally display the last update time or the fact that the number is manually tracked.

### 11.4 Upcoming Commitments

Create a compact section titled "Coming up."

Each item should show:

- Title.
- Due date.
- Amount.
- Paid/unpaid status.

Display only the next few items, with a link to "See all."

Use a clean vertical list. Do not place every upcoming commitment inside a separate giant card.

### 11.5 Money With Friends

Show a small summary of the user's group position.

Examples:

- "You're owed ₹400."
- "You owe ₹180."
- "All settled."

Make it obvious whether an amount represents money owed by friends or money the user owes.

Include a direct link to the relevant Circle or settlement view.

### 11.6 Recent Activity

Display the latest personal and shared financial events.

Each row should contain:

- A simple category or activity icon.
- The expense or activity name.
- A secondary description when needed.
- Date or relative time.
- Amount with an appropriate contextual label.

Use consistent alignment of amounts.

For group transactions, distinguish the amount paid from the user's share when that distinction is important.

### 11.7 Quick Actions

Include high-utility actions such as:

- Add Expense
- Scan Receipt
- Create Circle
- View Debts

Use one prominent primary action. The other actions may be lighter secondary controls.

Do not create a grid of ten colourful buttons.

### 11.8 Dashboard Responsiveness

On desktop, use a restrained two-column composition where appropriate.

On mobile, place the Runway Meter first, followed by cash and commitment summaries, group balances and recent activity.

Avoid letting secondary activity lists push the core financial summary too far down the screen.

---

## 12. EXPENSES PAGE

The Expenses page should serve as the user's transaction history and personal expense-management workspace.

### Header

Title:
"Expenses"

Supporting text:
"Keep track of where your money goes."

Primary action:
"+ Add expense"

Secondary controls:
- Search
- Date filter
- Category filter

### Expense List

Use a clean, compact list similar to a modern financial activity feed.

Each row should show:

- Category icon inside a subtle neutral background.
- Expense name.
- Category or associated Circle.
- Date.
- Amount.
- Optional status indicator.

For money leaving the user's cash balance, show the amount as a debit where appropriate. Incoming reimbursements should be clearly identified as money received.

Avoid relying exclusively on red and green text to communicate transaction types.

### Filtering

Provide simple filtering by date and category.

Use a compact popover on desktop or a bottom sheet on mobile.

### Expense Detail

Selecting an expense should open a detail view or appropriate modal.

Show its recorded amount, date, category, notes and any related Circle. Provide edit and delete actions with appropriate confirmation.

When changing an expense affects available cash or group obligations, make that effect explicit.

### Empty State

If the user has not recorded expenses, show a friendly message such as:

"Your spending story starts here."

Add a subtle illustration and the action "Add your first expense."

Do not fill a new user's account with fake transactions that appear real.

---

## 13. ADD EXPENSE EXPERIENCE

The expense form should prioritize speed.

Use a dedicated page, dialog or mobile bottom sheet, depending on context.

### Layout

At the top:
"Add expense"

Main input:
- A large, easy-to-use currency amount field.

Supporting fields:
- Expense name.
- Category.
- Date.
- Payment status.
- Optional note.
- Optional Circle.

Use clear input labels. Avoid relying solely on placeholder text.

### Interaction

When the user enters an amount, do not immediately mutate confirmed balances until the user saves.

The primary action should be:
"Save expense"

On successful save:
- Show a concise confirmation.
- Update the transaction list.
- Recalculate the user's cash balance and runway if the expense was paid from tracked cash.
- Update any linked Circle balances where relevant.

On error, preserve the user's entered information and show a clear message.

Do not simulate successful saves when a persistence operation fails.

---

## 14. CIRCLES PAGE

Circles are shared spaces for groups of friends.

The design should feel more social than the Expenses page while retaining clear financial information.

### Circles Overview

Page title:
"Your Circles"

Supporting text:
"Shared plans, sorted finances."

Primary action:
"Create a Circle"

Show a grid on desktop and stacked cards on mobile.

Each Circle card should include:

- Circle icon, image or emoji selected by the user.
- Circle name.
- Member avatars or initials, with sensible overflow handling.
- A small summary of recent activity.
- The current user's net position in the Circle.
- An indicator if there are unsettled balances.

Example:

"Hostel Room 204"
"4 members"
"You're owed ₹180"

Keep these cards consistent and avoid making them excessively colourful.

### Creating a Circle

Use a clean, short form:

- Circle name.
- Currency.
- Members.
- Optional description or image.

Provide a clear invitation workflow if real invitations are implemented.

For a demo-only participant system, make it clear that participants are sample members.

### Empty State

Use friendly copy:

"Got a group expense? Give it a home."

Primary action:
"Create your first Circle"

The empty state should explain the benefit without taking up most of the page.

---

## 15. CIRCLE DETAIL PAGE

This is the central shared-expense screen.

### Header

Show:

- Circle icon.
- Circle name.
- Member count or member avatars.
- A concise financial summary.
- A menu for Circle settings.

Primary actions:
- Add expense.
- Scan receipt.
- Settle up.

On mobile, keep these actions accessible without crowding the header.

### Summary Section

Show a clear overview of the current user's position and the Circle's unsettled balances.

Examples:

- "You're owed ₹400."
- "You owe ₹120."
- "All settled."

The screen must distinguish the current user's position from the group's total outstanding debt.

### Tab Structure

Use a simple tab system:

- Overview
- Expenses
- Vibe Ledger

If more tabs are needed, ensure they remain usable on mobile.

### Overview

Show recent activity, member balances and the most important outstanding settlement information.

### Expenses

Display a transaction list with:

- Expense title.
- Payer.
- Date.
- Total amount.
- The user's personal share, where relevant.
- Settlement status.

Selecting an expense opens its details.

### Vibe Ledger

Display running net balances, buffered small amounts and settlement suggestions.

Use concise contextual labels. Avoid unexplained technical accounting terms.

### Member List

Use small avatar groups or list rows.

Show a user's name and net position, but avoid public rankings or gamified comparisons of spending.

### Circle Detail Visual Hierarchy

The most important information is:
1. The user's net position.
2. The most recent shared expenses.
3. Actions needed to resolve outstanding balances.

Do not overwhelm the user with every member's transaction history in the first viewport.

---

## 16. GROUP EXPENSE CREATION AND SPLITTING

Group expense creation should be designed as a focused step-by-step interaction.

### Step 1: Expense Details

Collect:

- Expense title.
- Total amount.
- Payer.
- Date.
- Currency, inherited from the Circle where possible.

Use a large amount field.

### Step 2: Choose Participants

Display members as selectable avatar tiles or rows.

Each participant should have a name and a clear selected/unselected state.

Do not use colour alone to show selection. Use a checkmark, border and accessible state.

### Step 3: Choose Split Method

Offer simple options:

- Equal.
- Unequal.
- Percentage.
- Itemized.

Use accessible segmented controls or compact selection cards.

Do not present all allocation controls at once. Show the fields relevant to the chosen method.

### Step 4: Review Shares

Show each participant, their allocation and the final total.

Ensure that the individual shares add up to the expense amount.

If there is a rounding remainder, distribute it deterministically and explain it when appropriate.

### Step 5: Confirm

Use a clear summary:

- Who paid.
- What the total was.
- Each person's share.
- How the balances will change.

Primary action:
"Confirm expense"

Secondary action:
"Back to edit"

On confirmation, update the underlying ledger, linked cash balances and relevant Runway Meters correctly.

---

## 17. AI RECEIPT SCANNER

The receipt scanner is one of Mesh's key convenience features. It must feel intelligent without hiding uncertainty.

### 17.1 Entry Point

Allow users to start scanning from:

- The global Add Expense action.
- A Circle's Add Expense action.

If the user starts within a Circle, remember that context and return them to that Circle after confirming the expense.

### 17.2 Upload Screen

Title:
"Scan a receipt"

Supporting text:
"Upload a receipt and we'll help turn it into a split."

Use a clear upload area with a restrained scan icon.

Support:
- File picker.
- Camera capture where supported.
- Common image formats.
- Preview before processing.

Explain briefly that the user can review the extracted information before saving it.

### 17.3 Processing State

When the image is being processed, show a calm, purposeful loading state.

Example:
"Reading your receipt..."

Use subtle progress feedback or a small scanning animation.

Do not use an endless looping animation without status information if the request takes a while.

Handle API errors and provide a retry action. Preserve the selected image when possible.

### 17.4 Editable Receipt Review

This is the most important scanner screen.

Show:
- Merchant and date.
- Itemized list.
- Quantity and unit price.
- Item totals.
- Subtotal.
- Taxes.
- Tip or service charge.
- Grand total.
- Payer selection.
- Member assignment.

Extracted fields must remain editable.

If a field is uncertain, mark it discreetly and ask for review. Avoid showing every field as an alarming red error.

### 17.5 Item Assignment

Make it easy to assign each receipt item to a person.

On mobile, use expandable item rows that open a participant selector.

Selected people should be represented by compact avatars or initials.

Support a shared item by allowing multiple people to be assigned.

### 17.6 Reconciliation

Display the extracted total and the calculated total.

If they disagree, show the difference clearly.

Suggested copy:
"These totals don't match yet. Review the item amounts before saving."

Never silently alter a line item's price to make the numbers agree.

### 17.7 Confirmation

Show a concise expense summary and the final amount owed by each person.

Primary action:
"Confirm and split"

On success, return the user to the Circle or expense detail screen and show a subtle success confirmation.

The confirmed expense must update the shared ledger and relevant personal financial summaries.

---

## 18. THE VIBE LEDGER

The Vibe Ledger should have a distinct personality while remaining financially clear.

### Visual Identity

Use a subtle mint accent and friendly microcopy. Keep the core design consistent with the rest of Mesh.

Do not create a completely different visual language for this feature.

### Header

Title:
"The Vibe Ledger"

Supporting text:
"Keep the small stuff from becoming a big thing."

Display the current user's net position prominently.

Examples:
- "You're owed ₹240."
- "You owe ₹90."
- "All caught up."

### Running Debt List

Each row should show:

- The relevant member's avatar.
- Their name.
- The direction and amount of the balance.
- A compact label such as "Buffered" or "Ready to settle" where applicable.

Do not imply that buffered debt has been paid or forgiven.

### Buffered Expenses

Users should be able to inspect the small expenses contributing to their balance.

Display:
- Expense name.
- Date.
- Their share.
- Payer.
- Outstanding amount.

Allow users to view the complete expense and split details.

### Settlement Threshold

Provide a compact way to view or change the group's buffering threshold.

Use text such as:
"Suggest settling when a balance reaches ₹50."

Explain that this controls settlement suggestions, not the underlying balance.

### Group Settlement Prompt

When a balance reaches the configured threshold or a scheduled settlement period arrives, show a neutral prompt.

Example:
"Some small balances have added up. Want to settle them together?"

Primary action:
"Review balances"

Never force the user to settle immediately.

### Social Tone

The Vibe Ledger can use slightly warmer language than the Runway Meter, but must not use jokes that make someone feel embarrassed about owing money.

Avoid red public debt warnings, rankings, shaming badges and aggressive reminders.

---

## 19. SMART SETTLE-UP INTERFACE

The settlement screen should turn a complex group balance into a short, understandable action list.

### Header

Title:
"Settle up"

Supporting text:
"Find a simpler way to clear outstanding balances."

### Current Balances

Show the relevant members and their net balances before proposing transfers.

Make the sign convention obvious with labels such as:
- Owes the group.
- Is owed by the group.

### Proposed Transfers

Show each suggested transfer as a clear row or card.

Example:

"Alex pays Sam"
"₹300"

Use small avatar representations on either side of an arrow.

Do not style each transfer as a payment button if Mesh cannot actually move money.

### Explanation

Include concise information about how the suggestions simplify the balances.

Example:
"These transfers settle the group's current net balances with fewer individual payments."

### Confirmation

The user should be able to:
- Review a suggestion.
- Mark a transfer as settled when it has actually occurred.
- Cancel or correct an incorrectly recorded settlement where permitted.

The UI must distinguish:
- Suggested.
- Awaiting confirmation.
- Recorded as settled.

Never show a successful payment animation unless a settlement was genuinely recorded by the application.

---

## 20. ACTIVITY PAGE

The Activity page should present an understandable timeline of financial events.

### Header

Title:
"Activity"

Supporting text:
"Everything that's changed, in one place."

### Activity Rows

Each item should have:

- An icon suited to the event.
- Event title.
- Brief context.
- Date or relative time.
- Relevant amount.
- Circle name or expense reference when appropriate.

Examples:

- "Groceries added to Hostel Room 204."
- "You paid ₹600 for a shared meal."
- "A ₹200 settlement was recorded."
- "Your hostel commitment was marked paid."
- "Receipt details confirmed."

Use simple icons and subtle row dividers.

### Filters

Offer a small filter menu for:
- All activity.
- Personal expenses.
- Circle expenses.
- Settlements.

Use an appropriate empty state when filters return no results.

---

## 21. PROFILE AND SETTINGS

The Settings area should feel lightweight and functional.

Include grouped sections for:

### Personal Details

Display name and avatar.

### Financial Preferences

Currency, income mode, target date or target days, spending estimate and safety buffer.

### Circle Preferences

Relevant membership and settlement preferences where implemented.

### Notifications

Notification settings only if the notification feature actually exists.

### Privacy and Data

Data export, account deletion and relevant privacy controls, according to the capabilities of the underlying application.

### Account

Sign-out and account-management options.

Use simple lists with clear labels and short descriptions. Avoid giant settings cards with decorative icons for every row.

When a user changes a financial preference, update the appropriate calculations and give clear confirmation.

---

## 22. FORMS, INPUTS AND CONTROLS

### Inputs

Use clean white input fields with a subtle border and a consistent radius.

Inputs should have:

- Visible labels.
- Clear placeholders where useful.
- Focus states.
- Validation messages.
- Appropriate input types.
- Readable touch targets.

For monetary inputs, show the currency context and prevent accidental entry of invalid amounts.

### Buttons

Primary button:
- Forest-green background.
- High-contrast text.
- Medium or semibold type.
- 10–12 px radius.
- Height around 44–48 px.
- Clear hover, focus, active, disabled and loading states.

Secondary button:
- Neutral or white background.
- Subtle border.
- Dark text.

Tertiary button:
- Text or icon treatment.
- Used for less important actions.

Destructive action:
- Use a clear but restrained danger treatment.
- Ask for confirmation where the action may delete transactions or affect several members.

Do not make every action a filled primary button.

### Segmented Controls

Use segmented controls for closely related choices, such as income modes or split methods.

Selected options must have strong visual distinction and accessible state information.

### Dropdowns

Use consistent menus and sufficient space between items.

### Date Pickers

Provide a usable native or well-designed date picker appropriate to the framework.

### Sliders

Only use sliders when continuous adjustment is genuinely appropriate. Do not use a slider for currency entry where an exact amount matters.

### Toasts

Use subtle toasts for concise confirmations and recoverable status updates.

Avoid stacking multiple notifications or displaying financial information in a way that disappears before a user can read it.

---

## 23. EMPTY, LOADING, SUCCESS AND ERROR STATES

A polished application must cover states beyond the main dashboard.

### Empty States

Each empty state should include:

1. A concise, friendly headline.
2. A brief explanation.
3. One relevant next action.
4. A small illustration or icon when helpful.

Examples:

Expenses:
"No expenses yet."
"Add your first expense to start seeing where your money goes."

Circles:
"Your crew starts here."
"Create a Circle to manage shared expenses with friends."

Vibe Ledger:
"All clear for now."
"Your outstanding balances will appear here."

Upcoming commitments:
"Nothing coming up."
"Add an upcoming expense to keep your runway realistic."

### Loading States

Use skeleton placeholders for dashboard cards and transaction lists when fetching real data.

For action-specific operations, show loading indicators inside the relevant button or section.

Do not block the entire application with a full-screen loading indicator when only a small component is loading.

### Success States

Provide concise feedback for:
- Expense saved.
- Circle created.
- Receipt processed.
- Split confirmed.
- Settlement recorded.
- Settings updated.

A small icon and clear message are sufficient. Avoid full-screen celebrations for routine financial events.

### Error States

Errors should explain what went wrong and how the user can proceed.

Examples:
- "Couldn't save that expense. Your entries are still here. Try again."
- "We couldn't read this receipt clearly. You can correct the details or enter them manually."
- "The totals don't match yet. Check the item amounts."

Never erase entered data because an API call failed.

---

## 24. MOTION AND MICROINTERACTIONS

Motion should make the interface feel responsive and coherent.

Use:
- Small fade-and-slide transitions when opening contextual panels.
- Quick feedback when switching tabs.
- A subtle change in the Runway Meter when its value updates.
- Smooth list insertion after an expense is saved.
- A brief confirmation animation for completed actions.
- Clear interaction states when assigning receipt items.

Keep common interactions fast and low-motion.

Most transitions should be roughly 150–250 milliseconds.

Avoid:
- Long cinematic screen transitions.
- Animated backgrounds.
- Bouncing dashboard cards.
- Constantly pulsing financial metrics.
- Excessive parallax.
- Animations that make amounts difficult to read.
- Motion that delays saving or completing an action.

Respect the system's reduced-motion preference.

---

## 25. RESPONSIVE DESIGN AND MOBILE DETAILS

Mesh must be fully usable on a mobile browser.

### Touch Interaction

Use touch targets of approximately 44 × 44 px where practical for important controls.

Ensure adjacent actions are sufficiently separated to avoid accidental taps.

### Mobile Financial Forms

When the keyboard opens, maintain access to the active input and submission action.

Use numeric keyboards for monetary inputs when supported.

### Bottom Sheets

Use bottom sheets for contextual mobile interactions such as:
- Category selection.
- Participant selection.
- Filter selection.
- Quick expense forms where appropriate.

Ensure the sheet has a clear title, close behaviour, and a layout that works on shorter screens.

### Tables

Do not force desktop tables into narrow mobile widths.

Transform simple tabular data into structured lists or compact cards. Preserve the association between each person, their share and the overall total.

### Scrolling

Keep headers compact. Avoid deeply nested scrollable regions wherever possible.

The main content should scroll naturally, and fixed navigation should not cover important controls or content.

### Mobile Performance

Avoid large decorative assets and unnecessary animation dependencies.

The initial dashboard should load quickly, particularly on ordinary mobile internet connections.

---

## 26. ACCESSIBILITY AND READABILITY

Accessibility is a core requirement, not a final polish task.

Implement:

- Semantic heading structure.
- Proper form labels.
- Keyboard navigation.
- Visible keyboard-focus states.
- Accessible names for icon-only buttons.
- Sufficient colour contrast.
- Clear error descriptions.
- Accessible dialog behaviour.
- Screen-reader announcements for important status changes.
- Reduced-motion support.
- Meaningful text alongside status colours.
- Touch-friendly controls.

Financial figures must not be presented in tiny type merely to fit more data on the screen.

Avoid using colour, position or an icon alone to communicate whether a user owes or is owed money.

---

## 27. DESIGN CONSISTENCY RULES

Across all screens:

- Use the same type scale and spacing system.
- Use the same button styles.
- Use consistent card radii.
- Use the same icon library and stroke style.
- Use consistent date and currency formats.
- Reuse transaction row, avatar, status and input components.
- Maintain a consistent brand-green interaction model.
- Keep warning and success states semantically consistent.
- Use a coherent responsive strategy.
- Keep alignment precise.

Do not create a new visual style for each feature.

The Runway Meter, Circle cards, scanner, Vibe Ledger and settlement interface should all feel like parts of the same product.

### Avoid Generic AI-Generated UI Patterns

Do not automatically place every metric in a white card.

Do not create a rainbow of card colours.

Do not use gradients as a substitute for hierarchy.

Do not add meaningless progress bars.

Do not fill every header with decorative icons.

Do not invent metrics solely to populate empty dashboard space.

Do not use fake testimonials, unverified financial statistics or claims about users.

Do not use placeholder content that looks like real financial data without clearly labelling it as sample data.

Do not implement visual controls that have no working behaviour.

Do not sacrifice usability to make a screenshot look impressive.

---

## 28. DEMO AND SAMPLE DATA PRESENTATION

During development, the application may use realistic sample information.

Examples of demo objects:
- A Circle named "Hostel Room 204."
- A shared grocery expense.
- A receipt from a fictional campus café.
- A user with a sample balance.
- A few recorded debts and a settlement suggestion.

Use realistic Indian names and INR amounts where appropriate.

Clearly distinguish demo data from real transactions. Do not represent sample bank balances, actual UPI transactions or real payments as verified financial information.

Demo data should make the product easy to explore without creating misleading financial records.

The demo experience should show how a receipt moves through review and confirmation, how a Circle balance changes and how the Runway Meter responds to a genuine cash-flow update.

---

## 29. DESIGN SYSTEM IMPLEMENTATION

Translate the visual guidelines into reusable tokens and components.

Create centrally managed tokens for:

- Brand colours.
- Semantic colours.
- Backgrounds and surfaces.
- Typography.
- Spacing.
- Border radii.
- Borders.
- Shadows.
- Transition timing.
- Layout widths.
- Responsive breakpoints.

Use reusable components for:
- Application sidebar.
- Mobile bottom navigation.
- Page headers.
- Runway Meter.
- Financial summary rows.
- Transaction rows.
- Circle cards.
- Member avatars.
- Status labels.
- Form controls.
- Currency inputs.
- Split selectors.
- Empty states.
- Confirmation dialogs.
- Toast notifications.
- Loading placeholders.

Do not duplicate component implementations across pages when the same interaction or pattern is needed.

Prefer a small, coherent design system over a large collection of unnecessary abstractions.

---

## 30. FINAL QUALITY BAR

Mesh should look and feel like a finished consumer application.

The following conditions are mandatory:

1. The dashboard has a clear visual hierarchy.
2. The Runway Meter is distinctive, readable and financially transparent.
3. The actual cash balance is clearly separated from the daily spending limit.
4. All main actions are visually obvious and operational.
5. Expense forms are quick and intuitive.
6. Group expense splitting is easy to understand.
7. The Vibe Ledger feels friendly but never hides debt.
8. Receipt scanning has a polished upload, processing, review and confirmation flow.
9. Settlement suggestions are easy to inspect and distinguish from completed payments.
10. Empty states help users discover what to do next.
11. Loading and error states are deliberately designed.
12. Mobile layouts feel native to touch interaction.
13. Desktop layouts use space intelligently.
14. Typography, spacing and components are consistent across the entire application.
15. Colours communicate meaning rather than serving as decoration.
16. No screen feels unfinished, excessively sparse or needlessly complicated.
17. There are no fake buttons or misleading loading and success states.
18. Financial information remains readable at every responsive breakpoint.
19. The application follows the same brand identity across every feature.
20. The result looks intentional and polished without feeling overdesigned.

---

## 31. INSTRUCTIONS TO ANTIGRAVITY

Treat this file as the authoritative visual and interaction design specification for Mesh.

Before creating or changing components, inspect the existing repository, identify the framework and existing design system, and determine what can be reused.

Follow these rules:

- Preserve working application logic when implementing the design.
- Do not replace real functionality with static mockups.
- Build the screens around the product specification in `gemini.md`.
- Use the design tokens defined in this document.
- Implement a responsive layout from the start.
- Reuse components wherever appropriate.
- Ensure every visible button and control performs its intended action.
- Use real application state for financial values.
- Keep sample data clearly identifiable as demo content.
- Do not make external integrations appear functional when they are not configured.
- Do not expose API keys or sensitive financial information.
- Add appropriate accessible states and keyboard interactions.
- Do not introduce unnecessary dependencies or redesign working architecture without a reason.

Implement the application in coherent stages, verifying the layout and interactions as you proceed.

After implementation, inspect the important screens at mobile and desktop sizes. Check for overflowing text, inconsistent spacing, broken navigation, cramped forms, poor contrast, incorrect currency alignment and unnecessary empty space.

Verify that the visual design works with both empty and populated data, loading and error states, and longer names or larger financial figures.

The ultimate goal is not to produce the most visually complicated interface. It is to create a consistent, calm and memorable financial product that feels genuinely useful to students.

## THE MESH DESIGN NORTH STAR

**Premium enough to trust. Friendly enough to use every day. Simple enough to understand at a glance.**

Every screen should help users manage their money with a little more confidence and a little less friction.
