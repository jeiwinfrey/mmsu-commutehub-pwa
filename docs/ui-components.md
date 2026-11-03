# Installed shadcn/ui components

The complete component set returned by `npx shadcn@latest add --all` for the official registry and Radix Nova preset is installed. Source is committed under `src/components/ui`; supporting hooks/highlighter utilities and npm dependencies are included. This inventory reflects the installation, not future registry releases.

## Use the shared library

Import components directly from `@/components/ui/<name>`. Reuse them before writing a custom control. Run `npx shadcn@latest docs <name>` and read the returned documentation before composing a component. Do not reinstall or overwrite shared components for each assignment. All features remain UI-only.

- Forms: Field/FieldGroup, Input, Textarea, Select, Combobox, Checkbox, RadioGroup, Switch, Slider. The current registry's `form` entry contains no source file; use `field.tsx` rather than importing a nonexistent `form.tsx`.
- Phone overlays: Drawer, Sheet, Dialog, AlertDialog; provide accessible titles and correct focus behavior.
- Feedback: Alert, Badge, Skeleton, Empty, Progress, Spinner, Sonner.
- Selection/display: ToggleGroup, Tabs, Calendar, Card, Item, Table. Date pickers and data tables are composed patterns rather than separate generated components.
- TooltipProvider and the light-themed Sonner Toaster are mounted once in the root layout. Use `toast` from `sonner` for preview feedback; do not add a Toaster to each feature.
- Most primitives use Radix `asChild`. The official Combobox implementation uses Base UI `render`; follow its actual types/docs instead of forcing Radix props onto it.
- Sidebar is available as library source but is not part of CommuteHub's phone navigation. Its upstream provider writes a preference cookie when toggled; do not mount it in this UI-only app. Installing it does not authorize a desktop sidebar or persistent settings.
- New controls retain upstream sizing; apply 44 px minimum touch areas when using them on phone screens. The shared Button already preserves its minimum 44×44 px target customization.
- Chart and sidebar semantic tokens are available in the shared light theme. Do not add feature-specific palettes.

## Local compatibility notes

Existing Alert, Badge, Button, and Card source was preserved. Carousel and the mobile media-query hook have narrowly documented lint exceptions for their initial external-API synchronization; carousel listeners are both cleaned up on unmount. No project-wide lint rules were disabled.

## Component source inventory

- [accordion](../src/components/ui/accordion.tsx)
- [alert-dialog](../src/components/ui/alert-dialog.tsx)
- [alert](../src/components/ui/alert.tsx)
- [aspect-ratio](../src/components/ui/aspect-ratio.tsx)
- [attachment](../src/components/ui/attachment.tsx)
- [avatar](../src/components/ui/avatar.tsx)
- [badge](../src/components/ui/badge.tsx)
- [breadcrumb](../src/components/ui/breadcrumb.tsx)
- [bubble](../src/components/ui/bubble.tsx)
- [button-group](../src/components/ui/button-group.tsx)
- [button](../src/components/ui/button.tsx)
- [calendar](../src/components/ui/calendar.tsx)
- [card](../src/components/ui/card.tsx)
- [carousel](../src/components/ui/carousel.tsx)
- [chart](../src/components/ui/chart.tsx)
- [checkbox](../src/components/ui/checkbox.tsx)
- [code-block](../src/components/ui/code-block.tsx)
- [collapsible](../src/components/ui/collapsible.tsx)
- [combobox](../src/components/ui/combobox.tsx)
- [command](../src/components/ui/command.tsx)
- [context-menu](../src/components/ui/context-menu.tsx)
- [dialog](../src/components/ui/dialog.tsx)
- [direction](../src/components/ui/direction.tsx)
- [drawer](../src/components/ui/drawer.tsx)
- [dropdown-menu](../src/components/ui/dropdown-menu.tsx)
- [empty](../src/components/ui/empty.tsx)
- [field](../src/components/ui/field.tsx)
- [hover-card](../src/components/ui/hover-card.tsx)
- [input-group](../src/components/ui/input-group.tsx)
- [input-otp](../src/components/ui/input-otp.tsx)
- [input](../src/components/ui/input.tsx)
- [item](../src/components/ui/item.tsx)
- [kbd](../src/components/ui/kbd.tsx)
- [label](../src/components/ui/label.tsx)
- [marker](../src/components/ui/marker.tsx)
- [menubar](../src/components/ui/menubar.tsx)
- [message-scroller](../src/components/ui/message-scroller.tsx)
- [message](../src/components/ui/message.tsx)
- [native-select](../src/components/ui/native-select.tsx)
- [navigation-menu](../src/components/ui/navigation-menu.tsx)
- [pagination](../src/components/ui/pagination.tsx)
- [popover](../src/components/ui/popover.tsx)
- [progress](../src/components/ui/progress.tsx)
- [questionnaire](../src/components/ui/questionnaire.tsx)
- [radio-group](../src/components/ui/radio-group.tsx)
- [resizable](../src/components/ui/resizable.tsx)
- [scroll-area](../src/components/ui/scroll-area.tsx)
- [select](../src/components/ui/select.tsx)
- [separator](../src/components/ui/separator.tsx)
- [sheet](../src/components/ui/sheet.tsx)
- [sidebar](../src/components/ui/sidebar.tsx)
- [skeleton](../src/components/ui/skeleton.tsx)
- [slider](../src/components/ui/slider.tsx)
- [sonner](../src/components/ui/sonner.tsx)
- [spinner](../src/components/ui/spinner.tsx)
- [switch](../src/components/ui/switch.tsx)
- [table](../src/components/ui/table.tsx)
- [tabs](../src/components/ui/tabs.tsx)
- [textarea](../src/components/ui/textarea.tsx)
- [toggle-group](../src/components/ui/toggle-group.tsx)
- [toggle](../src/components/ui/toggle.tsx)
- [tooltip](../src/components/ui/tooltip.tsx)
- [trace](../src/components/ui/trace.tsx)
