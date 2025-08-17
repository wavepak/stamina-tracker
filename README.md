# Stamina Tracker
Personal daily stamina tracker with visualization and custom status message for Teams using vibe coding GPT5 model.

Initial prompt
```
Create a simple and user-friendly web application supported by GitHub Pages Site for free public deployment satisfying the follow requirements
- Visualize a person's daily stamina for work as a dynamic vertical battery like progress bar with percentage range from 1% - 100%, with the default stamina to 100%.
- Stamina percentage is calculated as minutes_left_for_work / total_minutes_for_work, where variable total_minutes_for_work defaults to 500 minutes the same as total_minutes_for_work by default. 
- Plug in two buttons near the stamina tracker as "Start" to activate the stamina tracker and decrease the minutes_left_for_work by minute. "Pause" to pause tracking the stamina progress.
- When the stamina tracker is stopped as not active, enable user to edit all variables and the stamina tracker becomes draggable by mouse to sync with the minutes_left_for_work value. On the other hand, disable user access to tracker when stamina tracker is active.
- Refresh the stamina visual tracker every 1 minute, with green color filling for 25% and above, yellow for 10% - 25% and red for less than 10%.
- Also add a special Microsoft Teams status message style, a pure text formatted stamina as a horizontal progress bar, with color emoji as summary indicator, along with a random selection from a pool of short descriptions to describe the current stamina status. Provide a "Copy" button to copy the message to user system clipboard.
```
