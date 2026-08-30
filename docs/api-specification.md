# API Specification & Endpoints
## Aamish (আমিষ) Platform

---

## 1. Authentication & Base URL
* **Base URL**: `https://api.aamish.com/v1`
* **Auth Scheme**: Bearer Token / Session Header
  * Super Admin Token: `Role: SUPER_ADMIN`
  * Enterprise Admin Token: `Role: ENTERPRISE_ADMIN`, Scoped to `enterprise_id`
  * Employee Session: `Role: EMPLOYEE`, Scoped to `employee_id` and `enterprise_id`

---

## 2. Super Admin API (Aamish Live Admin)

### 2.1 Enterprise Management
* `POST /admin/enterprises`
  * **Description**: Create a new enterprise client.
  * **Request Body**:
    ```json
    {
      "name": "Live Technologies",
      "slug": "live-technologies",
      "logo_url": "https://cdn.aamish.com/logos/live.png",
      "poc_name": "Rahim Ahmed",
      "poc_phone": "+8801711000000",
      "poc_email": "rahim@livetech.com",
      "poc_designation": "Head of Admin & Procurement",
      "billing_address": "House 12, Road 4, Notun Bazar, Dhaka"
    }
    ```
* `POST /admin/enterprises/:enterpriseId/locations`
  * **Description**: Define delivery locations for an enterprise.
  * **Request Body**:
    ```json
    {
      "locations": [
        { "name": "Notun Bazar Office", "code": "NB-01", "address": "Level 4, Plot 10, Notun Bazar" },
        { "name": "Uttarkhan Hub", "code": "UK-02", "address": "House 55, Uttarkhan Main Road" },
        { "name": "Baridhara Facility", "code": "BD-03", "address": "Road 8, Baridhara DOHS" }
      ]
    }
    ```
* `POST /admin/enterprises/:enterpriseId/admins`
  * **Description**: Create an enterprise admin account with pre-generated credentials.
  * **Request Body**:
    ```json
    {
      "full_name": "Sumon Ahmed",
      "email": "sumon@livetech.com",
      "phone": "+8801812000000",
      "password": "TempSecurePassword123!"
    }
    ```

### 2.2 Menu Catalog & Scheduling
* `POST /admin/menus`
  * **Description**: Create a master menu item/package.
  * **Request Body**:
    ```json
    {
      "title": "Special Bengali Polao & Sonali Roast",
      "description": "Fragrant Chinigura polao, 1/4 Sonali chicken roast, boiled egg, cucumber salad, and sweet curd.",
      "category": "REGULAR_LUNCH",
      "price": 220.00,
      "image_desktop_url": "https://cdn.aamish.com/menus/polao-roast-hd.jpg",
      "image_mobile_url": "https://cdn.aamish.com/menus/polao-roast-thumb.jpg"
    }
    ```
* `POST /admin/schedules/publish`
  * **Description**: Schedule and publish a menu for a specific date & enterprise.
  * **Request Body**:
    ```json
    {
      "enterprise_id": "8c12a84e-3995-46f0-b8d4-63cb5fb490f2",
      "menu_id": "4b6e5801-64d8-4f81-9b16-56f87498c199",
      "schedule_date": "2026-08-31",
      "meal_type": "LUNCH",
      "cutoff_time": "2026-08-31T10:00:00+06:00"
    }
    ```

### 2.3 Operations & Kitchen Matrix
* `GET /admin/operations/matrix?date=2026-08-31&enterprise_id=8c12a84e...`
  * **Description**: Fetch live tabular headcount aggregated by Location and Menu.
  * **Response**:
    ```json
    {
      "date": "2026-08-31",
      "cutoff_time": "2026-08-31T10:00:00+06:00",
      "is_cutoff_passed": true,
      "summary": {
        "total_active_meals": 38,
        "total_skipped_meals": 2
      },
      "matrix": [
        {
          "menu_title": "Special Bengali Polao & Sonali Roast",
          "locations": {
            "Notun Bazar Office": 20,
            "Uttarkhan Hub": 10,
            "Baridhara Facility": 8
          },
          "total_quantity": 38
        }
      ]
    }
    ```

### 2.4 Quality & Review Dashboard
* `GET /admin/analytics/reviews?date_from=2026-08-31&date_to=2026-09-04`
  * **Description**: Fetch enterprise CSAT trends and low-rating flags.
  * **Response**:
    ```json
    {
      "average_csat": 4.6,
      "total_reviews": 192,
      "flagged_issues_count": 8,
      "recent_reviews": [
        {
          "review_id": "...",
          "employee_code": "LIVE-1004",
          "location": "Uttarkhan Hub",
          "rating": 2,
          "comment": "Vegetable was undercooked today.",
          "photos": ["https://cdn.aamish.com/reviews/photo1.jpg"]
        }
      ]
    }
    ```

---

## 3. Enterprise Admin API

### 3.1 Employee Roster Management
* `GET /enterprise/templates/employee-upload`
  * **Description**: Download pre-formatted CSV template dynamically customized with the enterprise's valid delivery locations.
* `POST /enterprise/employees`
  * **Description**: Add a single employee.
  * **Request Body**:
    ```json
    {
      "employee_code": "LIVE-1042",
      "full_name": "Tariqul Islam",
      "email": "tariqul@livetech.com",
      "location_id": "a9e6b6fd-0103-4c91-9dc5-91db48d5c414"
    }
    ```
* `POST /enterprise/employees/bulk-upload`
  * **Description**: Upload populated CSV file for batch employee registration.
  * **Content-Type**: `multipart/form-data`
  * **Response**:
    ```json
    {
      "total_rows": 40,
      "successful_inserts": 40,
      "errors": []
    }
    ```

### 3.2 Enterprise Monitoring
* `GET /enterprise/dashboard/daily-summary?date=2026-08-31`
  * **Description**: View meal distribution by office branch for the enterprise.

---

## 4. Enterprise User (Employee) API

### 4.1 Daily Menu & Schedule
* `GET /user/schedule/today`
  * **Description**: Fetch today's menu, cutoff countdown, and employee meal preference.
  * **Response**:
    ```json
    {
      "date": "2026-08-31",
      "schedule_id": "c138fbd4-84c1-4b11-a8bb-e2bcf92d5390",
      "cutoff_time": "2026-08-31T10:00:00+06:00",
      "is_cutoff_passed": false,
      "menu": {
        "title": "Special Bengali Polao & Sonali Roast",
        "description": "Fragrant Chinigura polao, 1/4 Sonali chicken roast, boiled egg, cucumber salad, and sweet curd.",
        "image_url": "https://cdn.aamish.com/menus/polao-roast-thumb.jpg"
      },
      "user_preference": {
        "is_opted_in": true,
        "delivery_location": "Notun Bazar Office"
      }
    }
    ```

### 4.2 Meal Preference Toggle
* `PUT /user/preference/toggle`
  * **Description**: Opt-in or Opt-out (Toggle OFF) for a scheduled meal.
  * **Business Rule**: Returns `403 Forbidden` if current time $\ge$ `cutoff_time`.
  * **Request Body**:
    ```json
    {
      "schedule_id": "c138fbd4-84c1-4b11-a8bb-e2bcf92d5390",
      "is_opted_in": false
    }
    ```
  * **Cutoff Failure Response**:
    ```json
    {
      "error": "CUTOFF_TIME_EXPIRED",
      "message": "Meal modifications are locked for kitchen preparation after 10:00 AM."
    }
    ```

### 4.3 Daily Review & Photos
* `POST /user/reviews`
  * **Description**: Submit or update a CSAT rating, comment, and photo proof.
  * **Request Body**:
    ```json
    {
      "schedule_id": "c138fbd4-84c1-4b11-a8bb-e2bcf92d5390",
      "rating": 5,
      "comment": "Food was fresh, warm, and portion size was great!",
      "photos": [
        "https://cdn.aamish.com/user-uploads/live1042-meal-1.jpg"
      ]
    }
    ```
* `GET /user/reviews/history`
  * **Description**: Retrieve past 7 days review history for backdated review entry or edits.
