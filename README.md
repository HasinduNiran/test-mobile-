# Agency App - Mobile Application

This is a mobile app with MongoDB backend, authentication (login/registration), and an agency dashboard with 5 tiles, built with Expo.

## Project Structure

- `/app` - React Native mobile app (Expo)
- `/backend` - Node.js and Express backend server

## Get started

1. Set up the backend server:

   ```bash
   cd backend
   npm install
   # Update .env file with your MongoDB connection
   npm run dev
   ```

2. Set up the mobile app:

   ```bash
   cd ..
   npm install
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Building Android APK

To build an Android APK file:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

3. Configure the build:
   ```bash
   eas build:configure
   ```

4. Build for Android:
   ```bash
   eas build -p android --profile preview
   ```

5. Once completed, download your APK from the Expo dashboard or the link provided in the terminal.

## Features

- User authentication (login/registration)
- JWT-based authentication
- Agency dashboard with 5 tiles
- Sri Lanka timezone display
- Responsive mobile UI

## Technologies Used

- Frontend: React Native with Expo
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT
- State Management: React Context API

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
