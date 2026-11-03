# Figma mobile app flow

[Open the editable CommuteHub design](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG).

44 editable phone screens (390 × 844), organized into flow sections with named owners. Use Figma Present and choose Welcome, Main commute, Departure planner, Community reports, Profile, or the all-screen index. Long content scrolls inside the phone while bottom navigation remains outside the scroll area.

Includes source-aligned light tokens and reusable buttons, cards, fields, and badges. Maps are editable schematic vectors, not geographic navigation. Arial is unavailable in the Figma environment; Arimo is used as an Arial-compatible substitute. The codebase continues using its existing system font stack.

Every operation is a UI prototype. Google sign-in, saved data, GPS, vehicle simulation, push, and PWA infrastructure are not connected. Sample fares and candidate terminal locations are not verified travel guidance. This design does not mark any member's programming assignment complete.

## Screen ownership and handoff

| Owner | Screen | Figma frame |
| --- | --- | --- |
| Russel | Welcome | [welcome](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-526) |
| Russel | Sign in | [signin](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-595) |
| Aira | Your commute | [preferences](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-628) |
| Aira | Choose your pickup | [location](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-682) |
| Aira | Stay one step ahead | [notifications](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-728) |
| Ashley | Commute | [routes](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-764) |
| Jeiwinfrey | Available vehicles | [vehicles](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-840) |
| Jeiwinfrey | Vehicle details | [vehicle-details](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-905) |
| Kathrina | Pickup point | [pickup](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1014) |
| Kathrina | Nearby alerts | [radius](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1089) |
| Kathrina | Confirm your commute | [confirm](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1162) |
| France | Your ride is on its way | [waiting](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1240) |
| France | Get ready | [approaching](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1343) |
| Rocky | Ready to board? | [boarding](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1429) |
| Rocky | On your way | [riding](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1488) |
| Rocky | Trip complete | [completed](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1572) |
| Rocky | Your trips | [trips](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1641) |
| Rocky | Trip details | [trip-detail](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1701) |
| Michaella | Departure planner | [planner](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1782) |
| Michaella | Your departure plan | [plan-result](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1860) |
| Michaella | Plan saved · preview | [saved-plan](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-1939) |
| Kacey | Community | [community](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2010) |
| Kacey | Share a commute report | [report-compose](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2070) |
| Kacey | Review your report | [report-preview](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2148) |
| Kacey | Report preview ready | [report-success](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2205) |
| Princess | Alerts | [alerts](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2264) |
| Princess | Queue at Laoag | [alert-detail](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2325) |
| Chadrick | Profile | [profile](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2391) |
| Chadrick | Preferences | [settings](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2482) |
| Chadrick | Saved routes | [saved-routes](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2560) |
| Jeiwinfrey | No vehicles available | [no-vehicles](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2616) |
| France | Tracking paused | [stale](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2692) |
| Aira | Pick a stop manually | [location-denied](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2768) |
| Rocky | Missed this vehicle? | [missed](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2805) |
| Michaella | An earlier trip is needed | [plan-late](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2861) |
| Kacey | No reports here yet | [community-empty](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2920) |
| Russel | Sign-in unavailable | [signin-error](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-2973) |
| Chadrick | Delete account? | [delete-account](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-3001) |
| Princess | Alerts on this device | [push-unavailable](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-3056) |
| France | You’re offline | [offline](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-3125) |
| Ashley | Finding your commute | [loading](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-3180) |
| Ashley | Route stops | [stops](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-3240) |
| Jeiwinfrey | Crowding information | [crowding](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-3329) |
| Kacey | Flag this report | [flag-report](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG?node-id=4-3390) |
