import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, CheckCircle, FileText, Link2, MoreHorizontal, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockCandidates } from "@/lib/data";

const referralHistory = mockCandidates.slice(0, 3).map(c => ({
    jobTitle: c.role,
    company: c.company,
    status: c.status
}));

export function SeekerDashboard() {
  return (
    <div className="grid gap-6 auto-rows-max">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">My Profile</CardTitle>
          <CardDescription>This is how referrers will see you. Keep it up to date!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <User className="w-12 h-12 text-muted-foreground" />
            <div>
              <p className="font-semibold">Your Name</p>
              <p className="text-sm text-muted-foreground">Aspiring Product Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary"/>
            <p>resume_final_v2.pdf</p>
          </div>
           <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary"/>
            <p>1 job application link added</p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button asChild>
            <Link href="/seeker-profile">
              Edit Profile <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Referral History</CardTitle>
          <CardDescription>Track the status of your referral requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referralHistory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.jobTitle}</TableCell>
                  <TableCell>{item.company}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={item.status === 'Referred' ? 'default' : 'secondary'} className="capitalize">{item.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
