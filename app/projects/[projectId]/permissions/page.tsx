"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronRight, Loader2 } from "lucide-react";
import { useApi } from "@/app/hooks/useApi";

export default function PermissionsSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { get, put } = useApi();
  const [permissions, setPermissions] = useState({
    isTodosRestricted: false,
    isProjectInviteRestricted: false,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      const projectId = (await params).projectId;

      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        const response = await get(`/permissions/get/${projectId}`);
        if (response.success) {
          setPermissions(response.result || permissions);
        } else {
          console.error("Failed to fetch permissions:", response.error);
        }
      } catch (e: any) {
        setErrorMessage(e.response.data.error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleSave = async () => {
    const projectId = (await params).projectId;

    if (!projectId) return;

    try {
      const response = await put(
        `/permissions/update/${projectId}`,
        permissions
      );
      if (response.success) {
        alert("Permissions updated successfully");
      } else {
        alert(response.error || "Failed to update permissions");
      }
    } catch (e: any) {
      console.log(e.response.data.error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        <p>{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-muted min-h-screen">
      <div className="flex items-center justify-between max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-semibold text-slate-800">Permissions</h1>
        <Button
          onClick={handleSave}
          className="bg-[#005a92] hover:bg-[#004a79] h-11 px-8 text-base text-white transition-colors shadow-md">
          Save changes
        </Button>
      </div>

      <div className="space-y-6 max-w-[1400px] mx-auto">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="col-span-1">
                <h2 className="text-lg font-bold text-slate-800">
                  ToDo visibility
                </h2>
                <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                  Choose how project users will see ToDos.
                </p>
              </div>
              <div className="col-span-2">
                <RadioGroup
                  value={
                    permissions.isTodosRestricted ? "restricted" : "shared"
                  }
                  onValueChange={(v) =>
                    setPermissions({
                      ...permissions,
                      isTodosRestricted: v === "restricted",
                    })
                  }
                  className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <RadioGroupItem
                      value="shared"
                      id="v-shared"
                      className="mt-1.5 w-5 h-5 border-[#005a92] text-[#005a92]"
                    />
                    <div className="grid gap-2">
                      <Label
                        htmlFor="v-shared"
                        className="text-base font-semibold leading-none cursor-pointer">
                        Shared ToDo visibility (Default)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        ToDos will be visible to all users in the project.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <RadioGroupItem
                      value="restricted"
                      id="v-restricted"
                      className="mt-1.5 w-5 h-5 border-gray-400"
                    />
                    <div className="grid gap-2">
                      <Label
                        htmlFor="v-restricted"
                        className="text-base font-semibold leading-none cursor-pointer">
                        Restricted ToDo visibility
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        ToDos will be visible to project administrators, ToDo
                        creator and assignees in the project.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Project member invitations */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="col-span-1">
                <h2 className="text-lg font-bold text-slate-800">
                  Project member invitations
                </h2>
                <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                  Choose who can invite others to this project.
                </p>
              </div>
              <div className="col-span-2">
                <RadioGroup
                  value={
                    permissions.isProjectInviteRestricted ? "admin" : "all"
                  }
                  onValueChange={(v) =>
                    setPermissions({
                      ...permissions,
                      isProjectInviteRestricted: v === "admin",
                    })
                  }
                  className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <RadioGroupItem
                      value="all"
                      id="inv-all"
                      className="w-5 h-5 border-[#005a92] text-[#005a92]"
                    />
                    <Label
                      htmlFor="inv-all"
                      className="text-base font-semibold cursor-pointer">
                      Allow all users to invite new project members
                    </Label>
                  </div>
                  <div className="flex items-center space-x-4">
                    <RadioGroupItem
                      value="admin"
                      id="inv-admin"
                      className="w-5 h-5 border-gray-400"
                    />
                    <Label
                      htmlFor="inv-admin"
                      className="text-base font-semibold cursor-pointer">
                      Allow only project administrators to invite new project
                      members
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Organizer access control */}
        <Card className="border-none shadow-sm cursor-pointer hover:bg-slate-50 transition-all group">
          <CardContent className="p-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-800">
                  Organizer access control
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Use Connect Groups to define access control for Organizer
                  groups in the 3D application.
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-[#005a92] transition-colors" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
