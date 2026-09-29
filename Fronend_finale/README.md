# Sentinel Support

What I want is that there is a user interface that will take input from the user, which is just the service ID, and we pull other things from the backend API, like the various infos like deployment duration, transfer frequency, duty schedule, past leave patterns, etc., from the HR data. Now in the next thing , 

 1. The Primary Stress Metric (Slider)

Question: "On a scale of 1 to 10, how would you rate your overall stress level today?"

Why it works: It gives your machine learning model a direct numerical value to calculate alongside the HR data.

2. The Physical Readiness Metric (Multiple Choice)

Question: "Do you feel physically and mentally recovered from your previous shift?"

Options: Yes completely / Partially / No, I am fatigued.

Why it works: Uniformed forces understand "readiness." Framing it around their shift makes it relevant to their daily routine.

3. The Operational Metric (Multiple Choice)

Question: "How manageable is your current deployment workload?"

Options: Manageable / Slightly Overwhelming / Highly Overwhelming.

Why it works: If they select "Highly Overwhelming" but have no recent transfers, the AI knows the stress is coming from their current unit, which is a great flag for the Commander.

4. The Sentiment Analysis Input (Optional Text Box)

Question: "Is there anything specific impacting your readiness today? (Optional)"

The no. 4 point is where we can use the NLP part, where our AI can read the text, detect the negative sentiment, and instantly increase the burnout risk score.

So there are two dashboards; one is for the personnel officers who will go through this whole process and then there is the commander dashboard, who will receive the scores of each person and, based on the burnout score, which, when crossed beyond a threshold, provides the possible solutions like 

1. The Duty Rotation Recommender

Instead of just saying "Officer is stressed," the AI dashboard should actively suggest a logistical change.

The Concept: The system looks at their current role. If they are in a high-intensity field deployment (like riot control, heavy traffic, or active investigation), the dashboard suggests rotating them to a lower-stress environment.

What to show on screen: A button that says "Recommend: Reassign to Station Diary / Admin Duty for 14 Days."

2. Leave Priority Escalation

You already have Leaves_Denied in your CSV dataset. The AI should use this for intervention.

The Concept: If an officer's score hits the red zone (e.g., >80) and they have previously been denied leave, the system automatically bypasses standard approval queues.

What to show on screen: A high-alert notification box: "Critical Overload: Officer has 2 denied leaves. 1 Pending Leave Request found. Action Required: Approve immediately." with a big green "Approve Leave" button next to it.

3. Shift Rebalancing (Night to Day)

Sleep disruption is a massive factor in uniformed forces stress.

The Concept: If the AI detects that poor sleep is the main driver of the high score (using the SHAP logic we talked about), the Commander Dashboard flags their schedule.

What to show on screen: A toggle switch or button that says "Action: Restrict from Night Shifts for next 3 cycles."


Currently just implement this and create the two dashboards for me in react and javascript and use beautoful css
THis  is an sih project
Currently i just need the UI with synthetic values with basic backend so that the user can just input the values as seen
I am also uploading the ppt  for your reference

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bb470479-387d-46fe-be1f-d792dbcdc00f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
