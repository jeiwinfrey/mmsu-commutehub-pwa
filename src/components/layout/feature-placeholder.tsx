import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
type Props = { title: string; member: number; description: string; nextHref: string; nextLabel: string };
export function FeaturePlaceholder({ title, member, description, nextHref, nextLabel }: Props) {
  return <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <Badge variant="secondary">Member {member} · UI assignment</Badge>
      <h1>{title}</h1>
      <p className="text-muted-foreground">MMSU CommuteHub</p>
    </div>
    <Card>
      <CardHeader><CardTitle>Ready for your UI</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
      <CardContent><p>This is a placeholder. Build this feature using your member TODO and the shared design guide.</p></CardContent>
      <CardFooter><Button asChild variant="outline"><Link href={nextHref}>{nextLabel}<ArrowRight data-icon="inline-end" aria-hidden="true" /></Link></Button></CardFooter>
    </Card>
    <Alert role="note"><Construction aria-hidden="true" /><AlertTitle>UI starter only</AlertTitle>
      <AlertDescription>Sample data only. Accounts, saved data, vehicle tracking, notifications, and installation are not connected.</AlertDescription>
    </Alert>
    <nav aria-label="Starter preview pages" className="flex flex-wrap gap-2">
      <Button asChild variant="link"><Link href="/sign-in">Sign-in placeholder</Link></Button>
      <Button asChild variant="link"><Link href="/onboarding">Onboarding placeholder</Link></Button>
    </nav>
  </div>;
}
