# StoreOS Demo

Build a completely new application called StoreOS.

IMPORTANT: This is currently a CLIENT DEMO / PROTOTYPE ONLY.

Do NOT connect Supabase, cloud databases, external APIs, authentication services, or persistent backend storage at this stage.

Everything must work using frontend dummy data and local/in-memory state.

The client must be able to navigate through the entire application and demonstrate all major workflows.

BUSINESS MODEL

StoreOS is designed for a business with:

- 2–3 Stores / Warehouses

- 5 Restaurants / Outlets

- Stores supply inventory to Restaurants

- Restaurants sell to customers

- Inventory exists independently at every location

- Stock Transfers move stock between locations

- Physical Inventory Counts compare system stock against actual physical stock

- Stock Adjustments correct approved variances

- Purchasing happens primarily at Stores

- Sales happen at Restaurants

- Reports provide business-wide, store-level and restaurant-level visibility

VERY IMPORTANT ARCHITECTURAL DISTINCTION

These are three completely different processes:

1. STOCK TRANSFER

   - Moves inventory from one location to another.

2. PHYSICAL INVENTORY COUNT

   - Counts actual physical inventory and compares it with system inventory.

3. STOCK ADJUSTMENT

   - Corrects system inventory after an approved variance.

Never combine these into one feature.

DEMO-FIRST REQUIREMENT

All pages must be fully interactive using dummy data.

The demo must allow users to:

- Add

- Edit

- Delete

- View

- Search

- Filter

- Sort

- Select

- Approve

- Reject

- Dispatch

- Receive

- Count

- Adjust

- Export where appropriate

- Open detail pages

- Use forms

- Use confirmation dialogs

- Use status changes

Changes should immediately appear in the frontend.

Persistence is NOT mandatory.

If the page is refreshed, demo data may reset.

Do not waste time building backend persistence.

APPLICATION STRUCTURE

Create the following main navigation:

Dashboard

Business

Stores

Restaurants

Inventory

Stock Transfers

Purchasing

Sales

Expenses

Reports

Users

Roles & Permissions

Notifications

Audit Logs

Settings

Profile

APPLICATION SHELL

Create a professional enterprise dashboard layout with:

- Left sidebar navigation

- Top header

- Business selector area

- Current location/context indicator

- Global search

- Notifications

- User profile menu

- Breadcrumbs

- Responsive content area

The interface should feel like a modern enterprise management application.

Do NOT make it look like a POS application.

Do NOT make the POS screen the home page.

Use a clean professional design suitable for presenting to a business client.

DEMO DATA

Create realistic dummy data for:

- 1 Business

- 3 Stores

- 5 Restaurants

- 15–25 users

- Multiple roles

- 30–50 inventory items

- Categories

- Suppliers

- Purchase orders

- Purchase receipts

- Stock movements

- Stock transfers

- Physical inventory counts

- Inventory variances

- Stock adjustments

- Restaurant sales

- Expenses

- Notifications

- Audit records

Use realistic Indian business data and ₹ currency.

LOCATION MODEL

Use a common location structure:

Location

- Store

- Restaurant

Each location should have:

- ID

- Code

- Name

- Type

- Address

- Phone

- Manager

- Status

- Operating hours

INITIAL LOCATIONS

Create:

Stores:

- Central Store

- North Store

- South Store

Restaurants:

- Restaurant 1

- Restaurant 2

- Restaurant 3

- Restaurant 4

- Restaurant 5

Create realistic supply relationships between Stores and Restaurants.

Example:

Central Store → Restaurant 1

Central Store → Restaurant 2

North Store → Restaurant 3

North Store → Restaurant 4

South Store → Restaurant 5

Make this configurable in the UI.

GLOBAL UI REQUIREMENTS

All tables must support:

- Search

- Column sorting

- Filters

- Status badges

- Pagination or reasonable demo pagination

- Row actions

- View

- Edit

- Delete

- Empty states

- Loading states

- Confirmation dialogs

All forms need:

- Validation

- Required field indicators

- Cancel

- Save

- Save & Add Another where appropriate

Use toast notifications for successful actions.

For destructive actions, show confirmation dialogs.

DEMO STATE

Create a frontend demo data/state layer.

Keep all dummy data centralized rather than scattering hard-coded arrays throughout components.

Structure the demo data so it can later be replaced by Supabase repositories/services without redesigning the UI.

Do NOT build the real database yet.

IMPORTANT

Do not create database tables.

Do not create Supabase authentication.

Do not create RLS.

Do not connect cloud storage.

Do not implement production authentication.

This phase is ONLY the client-demo frontend.

Build the complete application shell and routing foundation first, then continue implementing all pages in subsequent commands.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/be2a60ee-39db-409d-a15c-8d8aa324258d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
