# CallShield prototype app

A working mobile prototype for the CallShield HCI project. It warns bKash and Nagad users about AI voice-clone scam calls and explains *why* a call looks dangerous in plain Bangla.

It's a Progressive Web App built with plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Run it

**On this computer:** double-click `start.bat`. It starts a small local server (Python) and opens `http://localhost:8000`. On a desktop the app appears inside a phone frame.

**On a phone:** keep `start.bat` running, connect the phone to the same Wi-Fi, and open `http://<your-PC-IP>:8000` in Chrome. The window prints your PC's IP address. To make it look like a real app, use Chrome's menu and choose **Add to Home screen**.

> If the phone can't connect, allow Python through Windows Firewall on private networks.

Opening `index.html` directly (double-click) also works, but offline caching is turned off in that mode.

## Demo calls

*Start demo call* on Home plays one of five scam callers at random, never the same one twice in a row. The app doesn't show which one it picked. Each caller has its own script, warning signs, predictions, explanation, coach questions and after-call advice. The study CSV's `scenario` column records which caller each participant heard.

| Caller | The trick | Mid-call alarm |
|---|---|---|
| নকল কণ্ঠে “আম্মু” (cloned voice of Mom) | AI-cloned voice from a new number, family emergency, secrecy, asks for the bKash code | bKash code arrives |
| ভুয়া বিকাশ এজেন্ট (fake bKash agent) | "Suspicious transactions, your account will be suspended today", asks for the OTP | bKash code arrives |
| ভুয়া পুলিশ (fake police officer) | "A case is filed against you, you could be arrested", secrecy, asks for the OTP | bKash code arrives |
| “ভুল করে টাকা পাঠিয়েছি” (sent by mistake) | Fake "money received" SMS from an ordinary number, sad story, asks you to send it back | Fake SMS is flagged |
| ভুয়া লটারি পুরস্কার (fake prize) | "You won Tk 50,000 today only", asks for a fee and the OTP | bKash code arrives |

The bKash-agent and police scripts are the survey examples from the team's Demo Guide. The others follow the tactic list in the guide.

## Demo script

1. **Home:** tap *Start demo call*. A random scam caller rings.
2. **Incoming call:** tap *Accept*.
3. **Live call:** CallShield flags scam tactics as the caller talks. *Replay demo* restarts it.
   - **Prediction (from the start):** shows which stage of the scam script the call is in and **what the caller will likely ask next**. After each stage it confirms "Last prediction came true".
   - **Challenge coach (any time):** tap *What to ask them* for questions a real caller could answer and a scammer can't. Tap *Ask* and the scammer dodges. That adds a new warning sign and raises the risk.
   - **About 12 s:** the warning banner appears.
   - **About 15 s:** the mid-call alarm takes over the screen: a bKash code arrived, or (for the "sent by mistake" call) the payment SMS is fake.
4. **Why?:** a plain-Bangla explanation with the caller's own words as evidence. Switch between বাংলা, EN and Both, or tap *Read aloud*.
5. **Hang up**, or use the check button (call Mom's saved number, call 16247, call 999, or check the bKash app), then take the next steps and answer the two feedback questions.
6. **Calls:** the demo call now appears in the history.

## Things you can change during testing (Settings)

| Setting | What happens in the demo |
|---|---|
| Real-time call protection | Off means the call isn't checked and no warning appears (useful as a control condition) |
| AI voice-clone check | Off hides the "fake voice" sign and reason |
| Predict the next move | Off hides the stage tracker and "likely next" card |
| Code-arrival alarm | Off means the code SMS arrives silently, with no full-screen alarm |
| Challenge coach | Off hides the *What to ask them* button |
| Warning language | Sets the default language of the banner and warning screen |
| Read warnings aloud / Strong vibration | Speaks and vibrates when the warning appears (vibration works on Android) |
| Family safe word | Once set, the warning screen reminds the user to ask for it |
| Study data | Download every feedback answer as CSV, or reset the demo |

All data stays in the browser on that device (`localStorage`). Nothing is sent anywhere.

Each feedback row in the CSV records which demo caller was used (`scenario`), which features were on (`prediction`, `codeAlarm`, `coach`, `voiceCheck`), whether the code arrived, and whether the participant asked a check question. That lets you compare conditions, for example the warning alone versus the warning plus prediction.

## Files

```
index.html            app shell
css/styles.css        all styling
js/scenarios.js       the five demo scam calls (script, signs, predictions, warning, coach, next steps)
js/data.js            shared content: icons, warning-screen labels, scam tactics, sample calls
js/app.js             screens, router, call simulation, storage
manifest.webmanifest  install info (name, colours, icon)
sw.js                 offline cache
icons/                app icons
start.bat             local server launcher
```

To change a caller's script or warning, or to add a new caller, edit `js/scenarios.js`. Copy one entry and change its text. To change the tactics on the Learn tab, edit `js/data.js`. The screens pick up the changes automatically.

## Notes

- All phone numbers, names and conversations are fictional. The app does not listen to real calls.
- Bangla read-aloud needs a Bangla voice on the device. Without one, the app shows a notice.
- Fonts (Hind Siliguri, Sora) load from Google Fonts. When offline, the app falls back to system fonts.
