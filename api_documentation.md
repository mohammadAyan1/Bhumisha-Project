# API Documentation: Batches & Demands

Yaha un teeno APIs ki detail hai jo aapne puchi thi. Inko frontend se call karke aap active batches la sakte hain, kisi batch ki daily demand nikal sakte hain, aur item processing logs ko save kar sakte hain.

---

## 1. Get Active Batches (User/Admin)
Ye API system me maujood saare **Active** batches ki list deti hai. Ise frontend me dropdown me batches dikhane ke liye use kiya ja sakta hai.

**Method:** `GET`  
**URL:** `/api/user/batches` (Note: `batch.route.js` me iska path `/user/batches` set hai, par ye app.use ke zariye mount hota hai toh full URL `/api/user/batches` ya similar ho sakta hai.)

### Payload (Body):
- Isme **koi body/payload nahi bhejna** hota.

### Response Example:
```json
{
    "success": true,
    "batches": [
        {
            "id": 1,
            "name": "Morning Batch",
            "status": "active",
            "is_deleted": false,
            "created_at": "2026-07-20T10:00:00.000Z",
            "updated_at": "2026-07-20T10:00:00.000Z"
        },
        {
            "id": 2,
            "name": "Evening Batch",
            "status": "active",
            "is_deleted": false,
            "created_at": "2026-07-20T10:05:00.000Z",
            "updated_at": "2026-07-20T10:05:00.000Z"
        }
    ]
}
```

---

## 2. Get Batch Demands (Admin)
Ye API ek specific date aur batch ke liye sabhi items ki required quantity aur bachi hui (remaining) quantity laati hai. Sath hi, ye alag-alag processes (soaking, drying etc.) ke time calculations bhi deti hai.

**Method:** `GET`  
**URL:** `/api/admin/batches/:id/demands?date=YYYY-MM-DD`

### URL Params & Query:
- **`:id` (URL Parameter):** Batch ka ID (maslan `1`, `2`).
- **`date` (Query Parameter):** Kis date ki demand chahiye, ex: `2026-07-27`.

### Payload (Body):
- Isme bhi **koi body nahi bhejna**.

### Response Example:
```json
{
    "success": true,
    "date": "2026-07-27",
    "batch_id": 2,
    "demands": [
        {
            "product_id": 18,
            "product_name": "Potato",
            "total_demand": 1000,
            "processed_qty": 0,
            "remaining_quantity": 1000,
            "unit": "gm",
            "total_soaking_time": 10,
            "total_cleaning_time": 10,
            "total_cutting_time": 10,
            "total_drying_time": 10,
            "total_weighting_time": 5,
            "total_time_minutes": 45
        }
    ]
}
```

---

## 3. Process Batch Demand (Admin)
Ye API item ke processing record (kaam) ko save karti hai jab worker quantity "start" ya process karta hai.

**Method:** `POST`  
**URL:** `/api/admin/batches/:id/demands/process`

### URL Params:
- **`:id` (URL Parameter):** Batch ka ID jiska item process ho raha hai.

### Payload (Request Body):
Frontend se ye JSON data POST request ki body me bhejna zaroori hai:
```json
{
    "date": "2026-07-27",          // Aaj ki date (YYYY-MM-DD)
    "product_id": 18,              // Product (jaise Potato) ka ID
    "process_type": "soaking",     // Process ('soaking', 'cleaning', 'cutting', 'drying', 'weighting')
    "processed_qty": 5000          // Kitna gram (gm) process karne ke liye gaya hai
}
```

### Response Example:
Data save hone par backend uski report wapas dega jisme `time_taken_minutes` automatically calculated hoga:
```json
{
    "success": true,
    "message": "Processed quantity logged",
    "log": {
        "id": 15,
        "batch_id": "2",
        "date": "2026-07-27",
        "product_id": 18,
        "process_type": "soaking",
        "processed_qty_gm": 5000,
        "time_taken_minutes": 50,
        "updated_at": "2026-07-27T10:15:00.000Z",
        "created_at": "2026-07-27T10:15:00.000Z"
    }
}
```
