# 💰 Loan Simulator

**A modern Angular application for calculating and comparing loan payments with beautiful dark theme UI.**

> Built for learning Angular development, internationalization, and professional UI/UX design.

---

## 📋 Table of Contents

- [Purpose](#-purpose)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Learning Outcomes](#-learning-outcomes)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🎯 Purpose

This project was created to learn and demonstrate:

- **Angular 17+** standalone components and modern routing
- **Professional UI/UX** design with custom dark theme
- **Internationalization (i18n)** with multiple languages
- **Component architecture** and separation of concerns
- **Real-time calculations** and data visualization

---

## ✨ Features

### 💳 Loan Calculation
- Calculate monthly payments with **fixed interest rate**
- Compare **annuity** (equal payments) vs. **linear** (decreasing payments) methods
- View total payback and total interest instantly

### 📊 Amortization Schedules
- Detailed month-by-month breakdown
- Payment, principal, interest, and remaining balance
- Side-by-side comparison of both methods
- Expandable tables showing all payments

### 🎨 Modern UI
- **Dark purple theme** (#9370db, #1a1a1a)
- Collapsible sidebar navigation with Bootstrap icons
- Responsive design for all devices
- Smooth transitions and professional styling

### 🌐 Multi-language Support
- English and Romanian (Română)
- Built-in language switcher
- Angular i18n implementation

---

## 📸 Screenshots

*Add screenshots of your app here*

---

## 🛠️ Tech Stack

| Technology | Purpose |
|:-----------|:--------|
| **Angular 17+** | Frontend framework |
| **TypeScript** | Programming language |
| **Bootstrap 5** | UI components & grid |
| **Bootstrap Icons** | Icon library |
| **@angular/localize** | Internationalization |
| **SCSS/CSS** | Custom styling |

---

## 🚀 Getting Started

### Prerequisites

node >= 18.x
npm >= 9.x

### Installation

1. **Clone the repository**

git clone https://github.com/kecsetihunor/LoanSimulator.git
cd LoanSimulator/frontend


2. **Install dependencies**

npm install


3. **Run development server**

ng serve


4. **Open in browser**

http://localhost:4200


### Build for Production

Build with all locales
ng build --localize

Serve built files
cd dist/frontend/browser
npx http-server -p 8080


**English:** `http://localhost:8080/en-US/`  
**Romanian:** `http://localhost:8080/ro/`

---

## 📁 Project Structure

src/
├── app/
│ ├── components/
│ │ ├── layout/
│ │ │ └── sidebar/ # Navigation sidebar
│ │ ├── loan-input/ # Input form component
│ │ └── amortization-schedule/ # Table component
│ ├── pages/
│ │ └── simple-calculator/ # Main calculator page
│ ├── services/
│ │ └── loan-calculator.service.ts # Calculation logic
│ ├── app.component.ts # Root component
│ ├── app.config.ts # App configuration
│ └── app.routes.ts # Routing configuration
├── locale/
│ └── messages.ro.xlf # Romanian translations
├── styles.css # Global styles & theme
└── index.html


---

## 📚 Learning Outcomes

This project demonstrates:

- ✅ **Standalone components** (no NgModule)
- ✅ **Reactive forms** and two-way data binding
- ✅ **Service-based architecture** for business logic
- ✅ **Component communication** with @Input/@Output
- ✅ **Angular routing** and lazy loading
- ✅ **i18n workflow** with extraction and compilation
- ✅ **Custom theming** with CSS variables
- ✅ **Responsive design** principles

---

## 🗺️ Roadmap

Future features planned:

- [ ] **Advanced Calculator** - Fixed + variable interest rates
- [ ] **Loan Comparison** - Compare multiple loan scenarios
- [ ] **Charts & Graphs** - Visual payment breakdowns
- [ ] **PDF Export** - Download amortization schedules
- [ ] **Currency Support** - Multiple currencies (EUR, RON, USD)
- [ ] **Save Calculations** - Local storage persistence

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

This is a learning project, but suggestions are welcome! Feel free to:

- Open an issue for bugs or feature requests
- Submit a pull request with improvements
- Share feedback on code structure

---

## 👨‍💻 Author

**Hunor Kecseti**

- GitHub: [@kecsetihunor](https://github.com/kecsetihunor)

---

**⭐ If you found this helpful, please give it a star!**
