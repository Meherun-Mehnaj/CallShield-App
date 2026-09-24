# CallShield prototype app

A working mobile prototype for the CallShield HCI project. It warns bKash and Nagad users about AI voice-clone scam calls and explains *why* a call looks dangerous in plain Bangla.

It's a Progressive Web App built with plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Run it

**On this computer:** double-click `start.bat`. It starts a small local server (Python) and opens `http://localhost:8000`. On a desktop the app appears inside a phone frame.

**On a phone:** keep `start.bat` running, connect the phone to the same Wi-Fi, and open `http://<your-PC-IP>:8000` in Chrome. The window prints your PC's IP address. To make it look like a real app, use Chrome's menu and choose **Add to Home screen**.

> If the phone can't connect, allow Python through Windows Firewall on private networks.

Opening `index.html` directly (double-click) also works, but offline caching is turned off in that mode.

## Demo script

1. **Home:** tap *Start demo call*.
2. **Incoming call:** tap *Accept*.
3. **Live call:** CallShield flags scam tactics as the caller talks. *Replay demo* restarts it.
   - **Prediction (from the start):** shows which stage of the scam script the call is in (Hook → Crisis → Secrecy → Take) and **what the caller will likely ask next**. After each stage it confirms "Last prediction came true".
   - **Challenge coach (any time):** tap *What to ask them* for questions only the real Ammu could answer. Tap *Ask* and the scammer dodges ("No time for questions!"). That adds a new warning sign and raises the risk.
   - **About 12 s:** the warning banner appears.
   - **About 15 s:** a fake bKash code SMS arrives and the **code-arrival alarm** takes over the screen, with "Stop! This is the code the caller wants".
4. **Why?:** a plain-Bangla explanation with the caller's own words as evidence. If the code arrived, that is listed as the first reason. Switch between বাংলা, EN and Both, or tap *Read aloud*.
5. **Hang up** or **Call Mom's saved number**, then take the next steps and answer the two feedback questions.
6. **Calls:** the demo call now appears in the history.

## Things you can change during testing (Settings)

| Setting | What happens in the demo |
|---|---|
| App language | বাংলা (default), English, or বাংলা + EN (Bangla with a smaller English line). Changes every screen. Bangla mode also uses Bangla digits. The warning screen has its own switch for changing it mid-call. |
| Real-time call protection | Off means the call isn't checked and no warning appears (useful as a control condition) |
| AI voice-clone check | Off hides the "fake voice" sign and reason |
| Predict the next move | Off hides the stage tracker and "likely next" card |
| Code-arrival alarm | Off means the code SMS arrives silently, with no full-screen alarm |
| Challenge coach | Off hides the *What to ask them* button |
| Read warnings aloud / Strong vibration | Speaks and vibrates when the warning appears (vibration works on Android) |
| Family safe word | Once set, the warning screen reminds the user to ask for it |
| Study data | Download every feedback answer as CSV, or reset the demo |

All data stays in the browser on that device (`localStorage`). Nothing is sent anywhere.

Each feedback row in the CSV records which features were on (`prediction`, `codeAlarm`, `coach`, `voiceCheck`), whether the code arrived, and whether the participant asked a check question. That lets you compare conditions, for example the warning alone versus the warning plus prediction.

## Files

```
index.html            app shell
css/styles.css        all styling
js/i18n.js            interface text in English and Bangla
js/data.js            content: scenario script, warning text, scam tactics, sample calls
js/app.js             screens, router, call simulation, storage
manifest.webmanifest  install info (name, colours, icon)
sw.js                 offline cache
icons/                app icons
start.bat             local server launcher
```

To change the scam script, the warning wording or the tactics, edit `js/data.js`. To change button labels or other interface text, edit `js/i18n.js`. Every entry has an `en` and a `bn` version. The screens pick up the changes automatically.

## Notes

- All phone numbers, names and conversations are fictional. The app does not listen to real calls.
- Bangla read-aloud needs a Bangla voice on the device. Without one, the app shows a notice.
- Fonts (Hind Siliguri, Sora) load from Google Fonts. When offline, the app falls back to system fonts.
