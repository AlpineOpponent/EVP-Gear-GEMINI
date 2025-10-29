
# EVP-Gear: AI Backpacking Assistant 🎒

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB"/>
  <img alt="TypeScript" src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img alt="TailwindCSS" src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
  <img alt="Gemini" src="https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white"/>
</p>

<p align="center">
  <em>An intelligent web application for backpackers to organize, analyze, and pack their outdoor gear with the help of AI.</em>
</p>

<br/>

EVP-Gear transforms the tedious task of managing backpacking gear from messy spreadsheets into a streamlined, visual, and intelligent experience. It allows users to input, tag, and view their entire gear locker, but its real power lies in its AI-assisted features, powered by the Google Gemini API, which make categorization and analysis effortless.

---

## ✨ Key Features

### 1. Comprehensive Gear Management
<p align="center">
  <img src="https://storage.googleapis.com/aistudio-hosting/readme-assets/evp-gear/view-mode.png" alt="View Mode Screenshot" width="800">
  <em>Organize and browse your entire gear inventory in a clean, hierarchical view.</em>
</p>

- **Add, Edit & Delete:** Full CRUD functionality for your gear items, including name, brand, weight, and notes.
- **Hierarchical Tagging:** A powerful three-level tagging system (Top > Middle > Base) lets you organize gear with ultimate precision (e.g., `Shelter > Tent > 2-Person Tent`).
- **Interactive Browser:** Easily navigate your inventory with collapsible sections for each category.
- **Persistent Local Storage:** Your gear list is saved directly in your browser, ensuring your data is always available.

### 2. AI-Powered Categorization
<p align="center">
  <img src="https://storage.googleapis.com/aistudio-hosting/readme-assets/evp-gear/edit-mode-ai.png" alt="AI Tag Suggestions Screenshot" width="800">
  <em>Effortlessly categorize new items with intelligent tag suggestions powered by Google Gemini.</em>
</p>

- **🧠 Smart Tag Suggestions:** When adding new gear, Gemini analyzes its details to suggest relevant tags, complete with a "match percentage." It intelligently prioritizes reusing existing tags to keep your hierarchy clean and consistent.
- **🎨 Automatic Visuals:** New tags are automatically assigned a unique hex color and a relevant emoji, making your gear list visually intuitive and beautiful.
- **🌐 Brand Recognition:** The app automatically fetches brand logos to create a polished, professional-looking inventory.

### 3. Intelligent Pack Planning
<p align="center">
  <img src="https://storage.googleapis.com/aistudio-hosting/readme-assets/evp-gear/pack-mode.png" alt="Packing Mode Screenshot" width="800">
  <em>Plan your next trip, calculate your total pack weight, and visualize weight distribution.</em>
</p>

- **✅ Interactive Checklist:** Select items from your gear locker to build your pack list for an upcoming trip.
- **⚖️ Real-Time Weight Calculation:** Your total pack weight is calculated instantly as you add or remove items.
- **📊 Weight Distribution Chart:** A dynamic pie chart visualizes how your pack weight is distributed across your main categories, helping you identify areas to lighten your load.
- **🖨️ Printable Pack List:** Generate a clean, formatted list of your packed items to print or save as a PDF.

---

## 🚀 Getting Started

This project is a client-side application that runs entirely in the browser.

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge).
- A **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the Application

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/evp-gear.git
   ```

2. **Set up the API Key:**
   The application is designed to use an environment variable `process.env.API_KEY` to securely access the Gemini API. When running locally or deploying, you must ensure this variable is available to the application.
   
   For local development, the easiest way is to use a tool that injects environment variables, or to temporarily hardcode it for testing purposes (not recommended for production).

3. **Open in Browser:**
   Simply open the `index.html` file in your web browser to run the application.

---

## 🛠️ Tech Stack

- **Frontend:** [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **AI Model:** [Google Gemini API](https://ai.google.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **Icons & Logos:** [Clearbit Logo API](https://clearbit.com/logo)

---
## 📂 Project Structure

The project is organized with a focus on modularity and separation of concerns.

```
/
├── public/
│   └── logos/              # (Deprecated) Static assets
├── components/
│   ├── modals/             # Reusable modal components
│   ├── ActionsMenu.tsx     # Edit/Delete menu for items and tags
│   ├── BrandLogo.tsx       # Component to display brand logos
│   ├── EditView.tsx        # Add/Edit gear form view
│   ├── Header.tsx          # Main application header and navigation
│   ├── PackView.tsx        # Packing list and analysis view
│   └── ViewView.tsx        # Hierarchical gear browsing view
├── services/
│   └── geminiService.ts    # All Gemini API calls and prompt logic
├── utils/
│   ├── brandData.ts        # List of known outdoor brands
│   └── initialData.ts      # Default gear items for a new user
├── App.tsx                 # Main application component and state management
├── index.html              # The entry point of the application
├── index.tsx               # React root renderer
└── README.md               # You are here!
```

Happy hiking! 🌲

