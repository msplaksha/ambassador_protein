# The AI Era of Biology: interactive lessons (Class 11)

One static web page (`index.html`) with 11 short parts, a 3D structure viewer
(including two drug-in-pocket complexes with zoom-out / zoom-in), a live
ChEMBL lookup, and a teacher view. Host it free on GitHub Pages and collect
student results in a Google Sheet.

## 1. Put the page on GitHub Pages (5 minutes)
1. Create a GitHub repository (e.g. `ai-era-biology`). Public is fine; there are no secrets in these files.
2. Upload `index.html`, `config.js` and `.nojekyll` to the repository root. Do **not** upload `apps_script/Code.gs` with your real teacher key in it.
3. Settings > Pages > Build from branch > `main` / root > Save.
4. Your page will be at `https://<your-username>.github.io/<repo>/`.

At this point the page already works. Without step 2 below, each student's progress stays only in their own browser.

## 2. Collect results in a Google Sheet (10 minutes)
1. Create a new Google Sheet (e.g. "AI era of biology results").
2. Extensions > Apps Script. Delete the sample code and paste all of `apps_script/Code.gs`.
3. Change `TEACHER_KEY` to a secret only you know.
4. Deploy > New deployment > gear icon > **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy and approve the permissions prompt.
5. Copy the **Web app URL** (ends in `/exec`).
6. Open `config.js` on GitHub (pencil icon) and paste it:
   ```js
   window.APP_CONFIG = { endpoint: "https://script.google.com/macros/s/XXXX/exec" };
   ```
   Commit. After about a minute the page uses the Sheet.
7. If you later edit `Code.gs`, use Deploy > Manage deployments > Edit > New version, so the URL stays the same.

## 3. Seeing results
- **In the Sheet:** tab `Progress` has one row per student: name, section, activities done, right/wrong on each question, and some activity scores. Sort, filter or chart as you like. (Tab `_docs` is the raw record the page uses; leave it alone.)
- **In the page:** on the welcome screen open "Teacher sign-in", enter your teacher key. You get live completion per activity, first-try accuracy per question, and a CSV download.

## What students do
They type a name (or roll number) and section, then work through the parts. Opening the same link on another device with the same name resumes their progress.

## Things to know
- **Privacy:** ask students to use a roll number or first name plus initial rather than a full name. Anything they type goes into your Sheet.
- **Not secure against cheating:** anyone with the link can post results under any name. This is fine for a classroom, not for graded exams.
- **Teacher key:** it lives only in the Apps Script, never in the page. Students cannot list or delete records without it.
- **ChEMBL lookup (Part 9):** the page calls the open ChEMBL REST API from the student's browser (https://www.ebi.ac.uk/chembl). If a school network blocks it, the page shows saved values for six common drugs instead and the activity still works.
- **Structures:** the 3D coordinates are embedded in the page, so the viewer works offline. 1IEP (imatinib in Abl kinase) comes from the AutoDock Vina example data; secondary-structure ribbons for it are approximate.
- Apps Script free quota is ample for a class (a few hundred students).
