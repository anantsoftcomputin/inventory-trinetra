# Trinetra Fashion Studio — Inventory & POS

Tech stack: React + Vite, Tailwind CSS, Firebase, React Router v6, Recharts

## Quick Start

```bash
npm install
npm run dev
```

## Firebase Setup

1. Create project at console.firebase.google.com
2. Enable Email/Password Authentication, create first admin user
3. Create Firestore database (asia-south1, production mode)
4. Enable Storage (asia-south1)
5. Add web app, copy config into src/firebase/config.js

## Firestore Security Rules

```
rules_version = "2";
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Initial Firestore Documents

### settings/store_settings
```json
{
  "storeName": "TRINETRA FASHION STUDIO",
  "tagline": "Embroidery Artist & Fashion Designer",
  "address": "Your address",
  "mobile": "+91 XXXXX XXXXX",
  "email": "trinetra@example.com",
  "website": "www.trinetra.in",
  "gstin": "24XXXXX",
  "bankName": "Bank Name",
  "accountName": "TRINETRA FASHION STUDIO",
  "accountNo": "XXXXXXXXXX",
  "ifsc": "XXXXXX",
  "upiId": "trinetra@upi",
  "termsAndConditions": "No exchange / return after leaving the shop.",
  "invoicePrefix": "TRN",
  "invoiceCounter": 0,
  "lowStockThreshold": 3
}
```

### settings/sku_counters
```json
{"KRT":0,"SAR":0,"CHC":0,"DRM":0,"LEH":0,"DUP":0,"BLS":0,"OTH":0}
```

## Firestore Indexes (firestore.indexes.json)

```json
{
  "indexes": [
    {"collectionGroup":"products","queryScope":"COLLECTION","fields":[{"fieldPath":"isDeleted","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]},
    {"collectionGroup":"products","queryScope":"COLLECTION","fields":[{"fieldPath":"isDeleted","order":"ASCENDING"},{"fieldPath":"category","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]},
    {"collectionGroup":"fabric_rolls","queryScope":"COLLECTION","fields":[{"fieldPath":"fabricType","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]},
    {"collectionGroup":"invoices","queryScope":"COLLECTION","fields":[{"fieldPath":"status","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}]},
    {"collectionGroup":"invoices","queryScope":"COLLECTION","fields":[{"fieldPath":"createdAt","order":"DESCENDING"}]}
  ],
  "fieldOverrides":[]
}
```

## Tag Code Cipher

| Digit | Code | Digit | Code |
|---|---|---|---|
| 0 | E | 5 | T |
| 1 | B | 6 | G |
| 2 | V | 7 | A |
| 3 | K | 8 | S |
| 4 | W | 9 | P |

Example: Rs.8650 -> SGTE (8=S, 6=G, 5=T, 0=E)

## Production Build

```bash
npm run build
```
