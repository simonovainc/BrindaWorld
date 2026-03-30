# App Store Submission Checklist

## Pre-Submission
- [ ] Apple Developer account ($99/yr) — https://developer.apple.com
- [ ] Google Play Console ($25 one-time) — https://play.google.com/console
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged in: `eas login`

## Assets Ready
- [ ] App icon (1024x1024 PNG, no transparency for iOS)
- [ ] Splash screen (1284x2778 PNG)
- [ ] Adaptive icon for Android (1024x1024 PNG)
- [ ] Screenshots for iOS (6.7" and 6.1")
- [ ] Screenshots for Android (phone)
- [ ] Feature graphic for Google Play (1024x500)

## Build
```bash
cd mobile
eas build --platform ios
eas build --platform android
```

## Submit
```bash
eas submit --platform ios
eas submit --platform android
```

## App Store Connect (iOS)
- [ ] App name: BrindaWorld — Girls Learning
- [ ] Description filled
- [ ] Keywords added
- [ ] Screenshots uploaded
- [ ] Age rating: 4+
- [ ] Privacy policy URL: https://brindaworld.ca/privacy
- [ ] Support URL: https://brindaworld.ca/contact
- [ ] COPPA declaration: Yes, directed at children

## Google Play Console (Android)
- [ ] Store listing complete
- [ ] Screenshots uploaded
- [ ] Content rating questionnaire
- [ ] Privacy policy URL
- [ ] Target audience: 6-14
- [ ] Designed for Families program
- [ ] Data safety section filled
