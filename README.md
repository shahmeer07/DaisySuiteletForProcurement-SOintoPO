# SuiteletForProcurement-SOintoPO

## 📦 Overview
![Banner](https://dummyimage.com/1100x220/1d1d1d/ffffff&text=Suitelet+For+Procurement+Directly+From+Sales+Order+lines)

This repository contains a complete NetSuite **Procurement Automation Suitelet** that allows project and sales teams to:

* Convert **Sales Order (SO) lines** directly into **Purchase Orders (POs)**.
* Create **one PO per vendor** automatically.
* Combine SO lines with **same item + same rate** into single PO lines.
* Automatically update the originating Sales Order with the **Linked PO**.
* Add custom buttons on SO, Project, BOM, and PO forms that redirect users to this Suitelet.
* Provide a UI to **filter SO lines**, select items for procurement, and generate POs.

This system is designed to streamline procurement workflows for organizations working with project-based sales, engineering BOMs, or custom equipment orders.

---

## 🚀 Key Features

### ✔ 1. Suitelet UI (tpc_sl_createPO.js)

* Customer selection.
* Dynamic Sales Order dropdown (filtered by customer).
* Automatic retrieval of SO lines eligible for procurement.
* Displays:

  * Item name, description
  * Quantity
  * Estimated cost & extended cost
  * Location
  * Vendor (from item record)
  * Class
  * RFP flag
  * Activity Code (custom segment)
  * Internal SO line ID & unique key

### ✔ 2. Procurement Logic

When the user selects lines and submits:

* Lines are **grouped by vendor**.
* Each vendor group becomes **one Purchase Order**.
* PO lines are combined by:

  ```
  item + rate + activityCode
  ```
* Additional fields copied:

  * Class
  * Location
  * Job/Project
  * Activity Code → `cseg_paactivitycode`
* Purchase Order header values set automatically:

  * Vendor
  * Subsidiary
  * Location
  * Custom "Created From" field

### ✔ 3. Updates Back to Sales Order

After creating the PO:

* SO line is updated with **Linked PO (custcol_tpc_linked_po)**
* This gives full traceability between SO → PO.

### ✔ 4. Client Scripts

Multiple Client Scripts support the Suitelet UI:

* Loading SO lines when customer/SO changes.
* Handling filters (phase, room, system, activity code).
* Validating selections.
* Submitting SO line updates through HTTPS.

### ✔ 5. User Event Scripts

Scripts add buttons to:

* Sales Order
* BOM record
* Project record
* Purchase Order

These redirect users to the Suitelet with prefilled parameters.

---

## 📁 File Structure

```
SuiteletForProcurement-SOintoPO/
│
├── Suitelets/
│   ├── tpc_sl_createPO.js
│   ├── tpc_sl_SetReadyToPurchase.js
│   ├── tpc_sl_so_lines_procurement.js
│
├── ClientScripts/
│   ├── tpc_cs_createPO.js
│   ├── tpc_cs_so_createPOBtnRedirect.js
│   ├── tpc_cs_bomBtnRedirect.js
│   ├── tpc_cs_projBtnRedirect.js
│   ├── tpc_cl_so_lines_procurement.js
│   ├── tpc_cs_SetReadyToPurchase.js
│
├── UserEvents/
│   ├── tpc_ue_so_createPOBtnRedirect.js
│   ├── tpc_ue_addBtnToBom.js
│   ├── tpc_ue_addBtnToProj.js
│
└── README.md  ← (This file)
```

---

## 🧠 How the Suitelet Works (High-Level)

### **Step 1 — User Opens Suitelet**

The UI loads all SO lines eligible for procurement using filters:

* RFP = True
* Linked PO is empty
* Non-mainline
* Non-tax lines
* Matches selected customer & SO

### **Step 2 — User Selects Lines**

Checkboxes allow marking multiple items for procurement.

### **Step 3 — Grouping**

Backend groups selected lines by:

```
vendor → [ { item, quantity, rate, activityCode } ]
```

### **Step 4 — Create PO per Vendor**

One PO is created for each vendor with combined PO lines.

### **Step 5 — Link POs Back**

Each SO line is updated with the generated PO.

---

## 🛠 Example: PO Line Combination Logic

If SO lines are:

```
Item A | Qty 5 | Rate 10 | AC: 123
Item A | Qty 3 | Rate 10 | AC: 123
```

They become one PO line:

```
Item A | Qty 8 | Rate 10 | AC: 123
```

If AC differs:

```
Item A | Qty 5 | Rate 10 | AC: 123
Item A | Qty 3 | Rate 10 | AC: 777
```

Two different PO lines.

---

## 🧩 Custom Fields Used

| Field                              | Type        | Purpose                         |
| ---------------------------------- | ----------- | ------------------------------- |
| `custcol_tpc_rfp`                  | Checkbox    | Identifies RFP-approved items   |
| `custcol_tpc_linked_po`            | List/Record | Links SO → PO                   |
| `cseg_paactivitycode`              | Segment     | Activity code on items/PO lines |
| `custbody_tpc_custom_created_from` | Body Field  | Saves SO internal ID            |

---

## 🔗 Buttons Added on Records

### **Sales Order Form**

* "Create Procurement PO"
* Redirects to Suitelet with:

  * Customer
  * SO ID
  * Phase / Room / System filters

### **Project Form**

* Button redirects to Suitelet with project filter.

### **BOM Record**

* Button loads Suitelet showing only BOM-related SO lines.

### **Purchase Order Form**

* Redirect back to related SO.

---

## 💡 Installation & Deployment

1. Upload all scripts to **File Cabinet** in correct folders.
2. Create script records for:

   * Suitelets
   * Client Scripts
   * User Events
3. Assign **Script IDs** and **Deployment IDs**.
4. Ensure custom fields exist.
5. Add buttons via User Events.

---

## 🧪 Testing Checklist

* [ ] Suitelet loads correct SO lines
* [ ] Vendor grouping works
* [ ] PO creation works
* [ ] PO lines combine correctly
* [ ] Activity Code copies properly
* [ ] SO lines update with Linked PO
* [ ] Redirect buttons work

---

## 📞 Support

For enhancements or integration needs, contact the development team.

---

## 🏁 Final Notes

This Suitelet significantly improves procurement workflows and ensures:

* Accuracy
* Speed
* Full traceability
* Vendor consolidation
* Reduced manual entry

### Author

Shahmeer Khan 
