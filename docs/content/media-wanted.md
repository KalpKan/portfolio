# Media wanted from Kalp (2026-09-20, updated after the first batch the same evening)

One row per project. Drop files in `~/projects/portfolio/media-inbox/<slug>/` (git-ignored; iPhone HEIC and screen recordings are fine, Claude converts) and tell Claude, or send YouTube links for video. The case-study rows mirror each content file's `wanted` list (`content/projects/<slug>.ts`); the app rows fill the tile heroes on the desk; the desk row fills the photo widget and the Résumé pill (`lib/site.ts`). Nothing below blocks anything: every page already shows a labelled placeholder where a file is missing.

Received 2026-09-20 from `~/Desktop/For Website/` (read-only, copied): two photos of Kalp (desk widget + About portrait), the RC car chassis photo and the 77 s driving video (Supabase Storage `portfolio-media/rc-car/drive.mp4`), the UnPark MedSprint pitch deck (`public/docs/unpark-medsprint-pitch.pdf`; its CAD renders, whiteboard, demo frame and two iPad screenshots are on the page), and three KiCad screenshots of the Porsche board.

| slug | what to send | why |
|---|---|---|
| unpark | 1 photo of the device strapped on an ankle · 1 sharp photo of the bare Pi + MPU6050 on the bench · 2 iPhone screenshots: the dashboard and the episode list · one 30–60 s video: walk, stop, feel the buzz, watch the phone log it (file or unlisted YouTube) | the hero is the CAD render and the demo frame from the deck is soft; the screens strip has only the analytics tab (iPad); the video block is still a placeholder |
| rc-car | optional: a phone photo of the finished car with the Pi and camera on | the wiring and camera frames in the gallery are still pulled from video and are soft; the chassis photo, the hero and the video are in |
| porsche-pcb-keychain | 1 photo of the board plugged into a phone with the Porsche glowing (dim room) · 1 photo of the underside showing the three LEDs, and one on the keychain · one line: which LED colour(s), and whether Yash has it | the page only has KiCad renders; a lit photo becomes the hero, the colour goes in the text |
| eeg | 1 screenshot of the LTspice plot of `V(ain0)` and `V(ad_out)` from `EEG_Simulation.cir` · 1 breadboard photo once parts arrive · yes/no: may the 17-page plan PDF go public | the gallery is a placeholder for exactly these two images; the PDF would be linked from the status line |
| flashcards | nothing yet (under construction, your words 2026-09-20); later: 5 iPhone screenshots (sign-in, sets list, one set, the study card, the widget) · decide H4 (make the repo public after removing `GoogleService-Info.plist` from its history) | the page stays the short placeholder until you say otherwise |
| promptflip | 1 screenshot of a live coin flip (both prompts in, the flip deciding), or a 10 s screen recording of one round | the desk tile has no hero image (`hero: null`) |
| basketball | 1 screenshot of the hoops dashboard with real makes/misses/streak numbers, or a 5 s clip of a shot registering | tile hero; a real-data screen shows what "counts makes and misses" means |
| plato | 1 screenshot: outlines uploaded and the calendar file downloaded, or a screenshot of the resulting events in your calendar app | tile hero; the calendar view is the payoff |
| plantit | 1 photo of the physical waterer on a plant (with the ESP8266 if visible) · 1 screenshot of a plant identified with its care numbers | tile hero; it is the only app with hardware, so a photo beats a screen |
| pushups | 1 screenshot of the skeleton overlay mid-rep with the counter and a form verdict visible, or a 10 s screen recording of 3 reps | tile hero; the overlay is the whole demo |
| emotes | 1 screenshot or 5 s screen recording of a gesture firing an emote (flex, yawn or thumbs-up) | tile hero |
| microtubules | 1 screenshot of a sample cell analysed with the percentage result visible | tile hero |
| desk | your résumé as a PDF (goes at `public/`, shows the Résumé pill and the PDF dock tile) · optional: email / GitHub handle / LinkedIn URL for the contact row | `lib/site.ts` `resumeUrl` and `contact` are empty, so the pill is hidden; the photo widget and the About portrait are in (`photo`, `portrait`) |
