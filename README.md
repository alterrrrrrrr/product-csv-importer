# Agent Hub Prime

Build a modern E-commerce Agent & QC/Finds platform heavily inspired by the UI, layout, design aesthetic, and functionality of https://vectoreps.pl and https://qcitems.com (as well as Litbuy/Mulebuy spreadsheets), with a floating social/agent widget, step-by-step guide page, and a secure, hidden Admin Panel with global Supabase persistent storage.

### Visual & Color Theme Requirements

- **Design Inspiration:** Emulate the slick grid layout, card hover effects, clean typography, and UI responsiveness seen on https://vectoreps.pl and https://qcitems.com.

- **Color Palette:** Deep dark navy blue background (`#0b0f19` / `#0f172a`), with bright vibrant Cyan & Sea Green / Teal accents (`#00f2fe` / `#0d9488` / `#06b6d4`) for borders, gradients, active tab highlights, and hover states.

- **Input Fields & Cards:** Dark blue-gray container backgrounds (`#1e293b`) with subtle dark blue borders and cyan accents to create a clean, modern high-end look.

### 1. Database Integration (Supabase)

- Connect and use a Supabase database to store all products, custom dynamic categories, dynamic agents list, affiliate links, agent registration settings, and guide steps.

- Ensure all items, categories, agents, or settings added, edited, or deleted in the `/admin` panel are persisted globally in the database so that ALL visitors (including incognito mode and external devices) see them live on the public site.

### 2. Custom Agent Branding & Promo Modal / Popup

- **Global Primary Agent Logo:** Allow uploading/setting a custom primary **Agent Logo Image URL** in the Admin panel. Display this logo in the header, promo popup, and floating island.

- **Promo Popup (On Page Load):**

  - **Trigger:** Displays automatically when entering the site.

  - **Top Right Close Button:** Sleek 'X' icon with a glowing hover state.

  - **Content:**

    1. Top Banner Image or Primary Agent Logo.

    2. Headline: "Zarejestruj się, aby uzyskać $450 w kuponach oraz 40% zniżki"

    3. Sub-headline (Bold & Pulsing): "LIMITOWANA OFERTA!"

    4. Promo Code Badge: "PKMR" (with quick-copy button).

    5. Value Highlight: "$40 OFF!"

    6. Primary Button: "ZAREJESTRUJ SIĘ TERAZ" (Dynamically links to the Primary Agent Registration Link set in Admin Panel).

### 3. Dynamic Agents Management (Multi-Agent Support)

- **Admin Panel Agent Manager:** Allow adding, editing, and deleting multiple shopping agents (e.g. **Litbuy**, **Kakaobuy**, **USFans**, etc.).

- **Agent Properties:**

  - Agent Name (e.g. "Litbuy", "Kakaobuy", "USFans")

  - Mini Avatar / Logo Icon URL (displayed right next to the agent name on buttons)

  - Default Referral / Registration URL

- **Product Multi-Agent Checkout Buttons:** On every product card and detail modal, allow users to choose or click direct purchase buttons for supported agents (e.g., "KUP PRZEZ LITBUY", "KUP PRZEZ KAKAOBUY", "KUP PRZEZ USFANS"). Each button displays the agent's mini avatar icon next to the text.

### 4. Header & Main Navigation (Public View)

- Displays custom Agent Logo image at top left/center.

- **Main Header Tabs:**

  - `Product Finder`

  - `Sprzedawcy`

  - `Promocje`

  - `Poradnik` (Interactive step-by-step tutorial guide)

  - `Linki z TikToka` (Replaces former 'Produkty' label)

- **Sub-navigation Categories (under Linki z TikToka):** Dynamically rendered from the database categories configured in the Admin Panel (Default initial categories: `Buty`, `Spodnie`, `Kurtki`, `Koszulki`, `Bluzy`, `Akcesoria`, `Zegarki`).

- **Note:** Strictly DO NOT show any "Panel Admina" button or edit icons in the main header or public view.

### 5. Floating Agent & Social Island (Pływająca Wyspa po Prawej)

- A sticky floating island/dock on the right side of the screen.

- Features dynamic action/shortcut buttons with Cyan/Teal glow for:

  - **TikTok**

  - **Discord**

  - **Agents Shortcuts** (Litbuy, Kakaobuy, USFans with mini avatars and referral links)

  - Quick shortcut buttons to Telegram, WhatsApp, Instagram.

### 6. Interactive Step-by-Step Guide Section ("Poradnik")

- Layout showing ordered tutorial steps (e.g., Krok 1, Krok 2, Krok 3...).

- Each step card displays Step Number, Title, Visual Image/Graphic, and Detailed Description text.

### 7. Product Card UI & External Redirection Specification

Each product card must feature (similar to vectoreps.pl / qcitems.com grid cards):

- **Top Image Container:** Main image, Heart (Wishlist), Thumbs Up/Down, and bottom overlay with Likes/Dislikes/Views.

- **Product Information:** Title, Category badge, Green/Teal Quality badge ("Quality: Best").

- **Bottom Price & Purchase Bar:** Price in PLN, QC Photos icon, and Cyan/Teal gradient Action Button "Sprawdź →".

- **Multi-Agent Purchase Buttons:** Display buttons/links for available agents (e.g. Litbuy, Kakaobuy, USFans) featuring their mini avatar icon and redirecting directly to the product link via that agent.

### 8. Protected Hidden Admin Panel (`/admin` Route)

- **Access Control:** No link in public nav. Accessible only by typing `/admin`.

- **Login Gate:** Username: `admin` | Password: `admin` (or `admin123`).

- **Admin Dashboard Features:**

  1. **Agent Branding & Multi-Agent Manager:**

     - Add, edit, or remove agents (Name, Referral Link, Mini Avatar Image URL).

  2. **Manage Categories (Zarządzanie Kategoriami):**

     - Add new custom categories, edit, or delete existing categories.

  3. **Manage & Edit Products (Pełna edycja produktów):**

     - Add new products AND edit/update existing products.

     - Select dynamic categories and assign product links for specific agents.

     - List/table view of all active products with **"Edit"** and **"Delete"** buttons.

  4. **Manage Guide Steps:** Add, edit, or delete tutorial steps.

  5. **Live Preview Container ("Podgląd na żywo"):** Shows real-time visual card mock in Cyan/Navy theme before saving.

  6. Save all changes persistently to Supabase database.

### 9. Vercel Client-Side Routing Configuration

- Include a `vercel.json` rewrite config at root level (`{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`) to prevent 404 errors when reloading `/admin` or deep routes on Vercel.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dd95708d-9462-4c9d-9135-86d838363f34).

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
