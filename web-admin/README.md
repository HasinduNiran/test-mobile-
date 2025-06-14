# Agency Admin Web Application

This is the admin web interface for the Agency Admin application. It provides a dashboard for administrators to manage stock inventory.

## Features

- **User Authentication**: Secure login/registration system for admins only
- **Dashboard**: Overview of stock statistics and performance metrics
- **Stock Management**:
  - Add, edit, and delete stock items
  - Filter and search functionality
  - Stock category management
- **Profile Management**: Update username and change password

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Backend API server running (included in the parent project)

### Installation

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm start
```

The application will run on [http://localhost:3000](http://localhost:3000) by default.

## Usage

1. Register as an admin user
2. Log in with your credentials
3. Navigate through the dashboard to manage stock inventory
4. Use the stock management page to add, edit, or delete items

## Tech Stack

- React.js 18
- React Router v6
- React Bootstrap
- Chart.js for data visualization
- Axios for API communication

## Backend API

The web admin console connects to the backend API at port 5001 by default. Make sure the backend server is running before using this admin interface.
