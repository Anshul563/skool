import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { parents } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { ChangePasswordForm } from "@/components/change-password-form"; // Reuse existing component
import { User, Phone, Mail, MapPin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ParentProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "parent") return redirect("/sign-in");

  const profile = await db.query.parents.findFirst({
    where: eq(parents.userId, session.user.id),
  });

  if (!profile) return <div>Profile not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
            <AvatarFallback className="text-3xl bg-orange-100 text-orange-700">
                {profile.name.charAt(0)}
            </AvatarFallback>
        </Avatar>
        <div>
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground">Parent / Guardian Account</p>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
            <TabsTrigger value="info">Contact Information</TabsTrigger>
            <TabsTrigger value="security">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> Personal Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <span className="text-sm text-gray-500">Full Name</span>
                        <p className="font-medium">{profile.name}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm text-gray-500">Email Address</span>
                        <p className="font-medium flex items-center gap-2">
                            <Mail className="h-3 w-3" /> {profile.email}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm text-gray-500">Mobile Number</span>
                        <p className="font-medium flex items-center gap-2">
                            <Phone className="h-3 w-3" /> {profile.mobile}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm text-gray-500">Address</span>
                        <p className="font-medium flex items-center gap-2">
                            <MapPin className="h-3 w-3" /> {profile.address || "N/A"}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
            <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}