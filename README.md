# 🌱 KETHIVO – Smart Agriculture Assistant

**Repository Name:** `KETHIVO-Smart-Agriculture-Assistant`

KETHIVO is a bilingual (English and Kannada) smart agriculture web application designed to help farmers access useful farming information through a simple, responsive, and easy-to-use platform.

It combines weather information, irrigation estimates, crop recommendations, AI-assisted crop disease screening, fertilizer guidance, market reference prices, and farming history in one place.

---

## 🎯 Problem Statement

Farmers often face difficulties accessing timely agricultural information, weather updates, crop recommendations, and disease-related guidance. Many existing digital solutions are difficult to use, available mainly in English, or depend on expensive physical IoT devices.

This creates challenges, especially for farmers in rural areas who need simple and accessible digital support.

## 💡 Proposed Solution

KETHIVO provides a software-based smart agriculture assistant that brings essential farming information together in one platform.

It supports both English and Kannada, uses weather information to provide useful farming insights, and offers tools for irrigation estimation, crop recommendations, disease screening, and farming records.

The platform is designed to work without requiring physical sensors or other agricultural hardware.

---

## ✨ Key Features

### 1. Farmer Authentication
- Farmer registration and login.
- Firebase Email/Password authentication.
- Password reset functionality.
- Farmer-specific profiles.

### 2. Smart Irrigation Advisory
- Estimates irrigation requirements using farmer inputs.
- Considers crop type, soil type, field condition, and previous irrigation.
- Uses weather and rainfall information.
- Provides advisory estimates rather than controlling physical pumps.

### 3. Crop Recommendation
- Provides rule-based crop suggestions.
- Considers soil type, location, season, and water availability.
- Helps farmers explore suitable crop options.

### 4. Weather Information
- Current weather information.
- Temperature, humidity, wind, and rainfall.
- Weather forecasts.
- Weather-related farming suggestions.

### 5. AI Crop Disease Screening
- Allows farmers to upload crop leaf images.
- Uses Google's Gemini API through a server-side API endpoint.
- Provides AI-generated observations and suggestions.
- Offers demonstration mode when the AI API is not configured.

**Note:** AI results are preliminary guidance, not a confirmed agricultural diagnosis.

### 6. Fertilizer Advisory
- General fertilizer guidance.
- Supports soil information and NPK input analysis.
- Encourages soil testing and local agricultural expert advice.

### 7. Market Price Information
- Displays sample/reference mandi prices.
- Provides price comparison and chart visualizations.
- Sample prices must not be treated as verified live market prices.

### 8. Farming History
- Saves farming activities and records.
- Stores supported records in Cloud Firestore.
- Helps farmers review previous activities.

### 9. Bilingual Interface
- English language support.
- Kannada language support (ಕನ್ನಡ).
- Simple navigation and farmer-friendly interface.

### 10. Responsive Design
- Designed for desktop, tablet, and mobile screens.
- Simple dashboard and navigation.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive design |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Firebase Authentication | User authentication |
| Cloud Firestore | Cloud database |
| Open-Meteo API | Weather information |
| Google Gemini API | AI crop disease screening |
| Chart.js | Data visualization |
| Git & GitHub | Version control and hosting |

---

## 📁 Project Structure

```text
KETIVO-Smart-Agriculture-Assistant/
│
├── index.html
├── login.html
├── register.html
├── dashboard.html
│
├── pages/
│   ├── irrigation.html
│   ├── crop-recommendation.html
│   ├── weather.html
│   ├── disease-detection.html
│   ├── fertilizer.html
│   ├── market-prices.html
│   ├── history.html
│   ├── profile.html
│   └── settings.html
│
├── css/
│   ├── style.css
│   ├── dashboard.css
│   └── responsive.css
│
├── js/
│   ├── firebase-config.example.js
│   ├── firebase-client.js
│   ├── translations.js
│   ├── shell.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── weather.js
│   ├── irrigation.js
│   ├── crop.js
│   ├── disease.js
│   ├── fertilizer.js
│   ├── market.js
│   ├── history.js
│   └── profile.js
│
├── api/
│   └── analyze-disease.js
│
├── server.js
├── package.json
├── firestore.rules
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Installation and Setup

### Requirements

- Node.js 18 or later
- npm
- Visual Studio Code (recommended)
- Firebase account
- Google AI Studio API key (optional, for live AI disease screening)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/KETHIVO-Smart-Agriculture-Assistant.git
```

Open the project folder:

```bash
cd KETHIVO-Smart-Agriculture-Assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

1. Create a project in Firebase Console.
2. Enable Email/Password authentication.
3. Create a Cloud Firestore database.
4. Configure your Firebase Web App.
5. Copy `js/firebase-config.example.js` to `js/firebase-config.js`.
6. Add your Firebase Web App configuration to the new file.
7. Deploy the provided `firestore.rules` to your Firestore database.

**Important:** Never upload private service-account credentials to GitHub.

### 4. Configure Gemini API (Optional)

1. Copy `.env.example` to `.env`.
2. Open the `.env` file.
3. Add your Google AI Studio API key.

Example:

```env
GEMINI_API_KEY=your_actual_api_key
GEMINI_MODEL=gemini-3.8-flash
PORT=3000
```

Keep the actual `.env` file private. It is excluded through `.gitignore`.

### 5. Run the Application

Open the terminal in the project folder and execute:

```bash
npm start
```

Open your browser and visit:

```text
http://localhost:3000
```

---

## 🔐 Security

- API keys are stored in environment variables.
- The Gemini API key is handled by the backend endpoint.
- Firebase authentication is used for account access.
- Firestore security rules help protect user data.
- Secret configuration files are excluded using `.gitignore`.

---

## 📌 Important Notes

- KETHIVO is a software-based agricultural advisory platform. It does not require physical IoT sensors.
- Irrigation recommendations are estimates, not automated irrigation controls.
- Crop recommendations are general guidance and should be checked with local agricultural experts.
- Disease screening results are AI-generated suggestions and are not guaranteed diagnoses.
- Market prices are reference/sample data unless a verified live data source is integrated.
- Actual Firebase and Gemini functionality requires the relevant configuration.

---

## 🌾 Project Goal

To make useful agricultural information easier to access through a simple, bilingual, and technology-driven platform.

**KETHIVO – Smart Farming, Better Decisions!**