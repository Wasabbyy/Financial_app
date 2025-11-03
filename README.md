# Financial Budget Manager

Web application for personal finance management - tracking income and expenses with offline mode and automatic synchronization.

## Features

- **Income and Expense Recording** - Add, edit, and delete transactions
- **Filtering and Search** - Filter by type, category, date, and search in notes
- **Statistics and Charts** - Pie chart of expense distribution and line chart of balance over time
- **Offline Mode** - Data stored in localStorage when server is unavailable
- **Automatic Synchronization** - Data syncs after connection is restored
- **Data Export** - Export to JSON or CSV format

## Technologies

- **JavaScript (ES6+)** - Main application logic
- **jQuery 3.7.1** - AJAX requests and DOM manipulation
- **Chart.js 4.4.0** - Data visualization with charts
- **PHP** - REST API server for data storage
- **localStorage** - Offline storage
- **HTML5 + CSS3** - Application structure and styling

## Project Structure

```
financni-rozpocar/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Application styles
├── js/
│   ├── app.js         # Main application logic
│   ├── api.js         # REST API communication
│   └── storage.js     # localStorage operations
├── api/
│   ├── index.php      # REST API server
│   └── data.json      # Data file (created automatically)
└── README.md          # Documentation
```

## Installation and Running

### Local Development

1. **Clone or download the project**

2. **Start a local server**

   For PHP server you can use:
   ```bash
   php -S localhost:8000
   ```
   
   Or use any other web server (e.g., XAMPP, WAMP, or Apache/Nginx).

3. **Open the application in a browser**
   
   ```
   http://localhost:8000
   ```

### Server Deployment

1. Upload all files to a web server with PHP support (e.g., eso.vse.cz)

2. Make sure the `api/` folder has write permissions (for creating `data.json`)

3. Open the application in a browser at your server address

## Usage

### Adding a Transaction

1. Fill in the form:
   - Amount (in CZK, increments of 50)
   - Transaction Type (Income/Expense)
   - Category (Food, Transport, Entertainment, Other)
   - Date
   - Notes (optional)

2. Click "Add Transaction"

### Filtering Transactions

- **Type**: Filter by income/expense
- **Category**: Filter by category
- **Date**: Filter by date range
- **Notes**: Search for text in notes

### Offline Mode

The application automatically detects server unavailability:
- Data is saved to localStorage
- Automatically synchronizes after connection is restored
- Connection status indicator shows online/offline status

### Data Export

- **JSON**: Export all transactions to JSON format
- **CSV**: Export transactions to CSV file for opening in Excel

## API Documentation

API endpoints are available at `/api/index.php`:

### GET - Get All Transactions
```
GET /api/index.php?action=get
```

### POST - Add Transaction
```
POST /api/index.php?action=add
Content-Type: application/json

{
  "amount": 1000,
  "type": "income",
  "category": "Food",
  "date": "2024-11-03",
  "notes": "Note"
}
```

### PUT - Update Transaction
```
PUT /api/index.php?action=update&id={id}
Content-Type: application/json

{
  "amount": 1500,
  "category": "Transport",
  ...
}
```

### DELETE - Delete Transaction
```
DELETE /api/index.php?action=delete&id={id}
```

### POST - Synchronization
```
POST /api/index.php?action=sync
Content-Type: application/json

{
  "transactions": [...]
}
```

## Features

- **Responsive Design** - Works on desktop and mobile devices
- **Modern UI** - Clean and intuitive user interface
- **Automatic Synchronization** - Checks every 30 seconds
- **Error Handling** - Graceful handling of offline state
- **History API** - Functional browser history with filter state saved in URL
  - Share URL with active filters
  - Functional Back/Forward buttons in browser
  - Automatic loading of filter state from URL when opening page

## Notes

- Application requires a modern browser with ES6+ support
- localStorage is required for offline functionality
- API server requires PHP 7.0+

## Author

Project created for school assignment "Web Application in JavaScript"

## License

This project is created for educational purposes.
