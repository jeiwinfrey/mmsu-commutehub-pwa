# Team assignments — UI only

Assignments follow the supplied speaker order. Everyone programs UI; infrastructure is deferred.

| Speaker / owner | Feature | TODO | Preview |
| --- | --- | --- | --- |
| 1 — Russel | [auth](../src/features/auth/) | [Checklist](todos/russel-auth.md) | `/sign-in` |
| 2 — Aira | [onboarding](../src/features/onboarding/) | [Checklist](todos/aira-onboarding.md) | `/onboarding` |
| 3 — Ashley | [routes](../src/features/routes/) | [Checklist](todos/ashley-routes.md) | `/commute` |
| 4 — Jeiwinfrey | [vehicles](../src/features/vehicles/) | [Checklist](todos/jeiwinfrey-vehicles.md) | `/commute/vehicles` |
| 5 — Kathrina | [pickup](../src/features/pickup/) | [Checklist](todos/kathrina-pickup.md) | `/commute/pickup` |
| 6 — France | [tracking](../src/features/tracking/) | [Checklist](todos/france-tracking.md) | `/commute/tracking` |
| 7 — Rocky | [trips](../src/features/trips/) | [Checklist](todos/rocky-trips.md) | `/trips` |
| 8 — Michaella | [planner](../src/features/planner/) | [Checklist](todos/michaella-planner.md) | `/planner` |
| 9 — Kacey | [community](../src/features/community/) | [Checklist](todos/kacey-community.md) | `/community` |
| 10 — Princess | [alerts](../src/features/alerts/) | [Checklist](todos/princess-alerts.md) | `/alerts` |
| 11 — Chadrick | [profile](../src/features/profile/) | [Checklist](todos/chadrick-profile.md) | `/profile` |

## Handoffs

- Auth → Onboarding → Routes → Vehicles → Pickup → Tracking → Trips. These are UI preview links, not an integrated persistent flow yet.
- Routes owns corridor/stop labels. Vehicles owns fare/occupancy presentation. Pickup owns the radius selector; Tracking consumes its presentation shape.
- Community owns report presentation; Alerts references the same sample report IDs. No duplicated report text in alert fixtures.
- Onboarding and Profile agree on preference labels. Planner uses shared route IDs.
- Shared shell, navigation, shadcn source, theme, package files, types, and fixtures require coordination. No member owns infrastructure in this milestone.

Each member's PR must include phone screenshots, local interaction steps, and verification results. Do not mark a task complete merely because its placeholder exists.
