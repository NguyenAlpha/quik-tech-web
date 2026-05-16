"use client"

import { useState } from "react"
import {
  Store,
  User,
  Users,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  Camera,
  Pencil,
  Shield,
  ShieldCheck,
  ShieldAlert,
  MoreHorizontal,
  Trash2,
  Plus,
  X,
  Check,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "manager" | "staff"
  avatar?: string
  status: "active" | "pending"
  joinedDate: string
}

const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "John Anderson",
    email: "john@stockflow.com",
    role: "owner",
    status: "active",
    joinedDate: "Jan 1, 2023",
  },
  {
    id: "2",
    name: "Sarah Mitchell",
    email: "sarah@stockflow.com",
    role: "manager",
    status: "active",
    joinedDate: "Mar 15, 2023",
  },
  {
    id: "3",
    name: "Michael Chen",
    email: "michael@stockflow.com",
    role: "manager",
    status: "active",
    joinedDate: "Jun 22, 2023",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily@stockflow.com",
    role: "staff",
    status: "active",
    joinedDate: "Sep 10, 2023",
  },
  {
    id: "5",
    name: "Alex Thompson",
    email: "alex@stockflow.com",
    role: "staff",
    status: "pending",
    joinedDate: "Jan 5, 2024",
  },
]

const roleStyles = {
  owner: {
    label: "Owner",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
    icon: Crown,
    description: "Full access to all settings and billing",
  },
  manager: {
    label: "Manager",
    className: "bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    icon: ShieldCheck,
    description: "Can manage inventory, orders, and view reports",
  },
  staff: {
    label: "Staff",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
    icon: Shield,
    description: "Can process orders and update inventory",
  },
}

const statusStyles = {
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
  },
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function SettingsPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isEditStoreOpen, setIsEditStoreOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"manager" | "staff">("staff")

  const [storeInfo, setStoreInfo] = useState({
    name: "StockFlow Store",
    email: "contact@stockflow.com",
    phone: "+1 (555) 123-4567",
    address: "123 Commerce Street",
    city: "San Francisco",
    state: "CA",
    zip: "94102",
    country: "United States",
    website: "https://stockflow.com",
    description: "Premium inventory and sales management solution for modern businesses.",
  })

  const [userProfile, setUserProfile] = useState({
    name: "John Anderson",
    email: "john@stockflow.com",
    phone: "+1 (555) 987-6543",
    role: "Owner",
    timezone: "America/Los_Angeles",
  })

  const handleInvite = () => {
    setIsInviteModalOpen(false)
    setInviteEmail("")
    setInviteRole("staff")
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 lg:p-10">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-base text-muted-foreground">
          Manage your store, profile, and team settings
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="store" className="space-y-8">
        <TabsList className="h-11 p-1">
          <TabsTrigger value="store" className="gap-2 px-4">
            <Store className="size-4" />
            <span className="hidden sm:inline">Store Info</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 px-4">
            <User className="size-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 px-4">
            <Users className="size-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
        </TabsList>

        {/* Store Info Tab */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
              <div className="space-y-1.5">
                <CardTitle className="text-xl font-semibold">Store Information</CardTitle>
                <CardDescription className="text-sm">
                  Basic information about your store
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditStoreOpen(true)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Store Logo */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="flex size-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                    <Store className="size-9 text-white" />
                  </div>
                  <button className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted shadow-sm transition-colors hover:bg-muted/80">
                    <Camera className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{storeInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">{storeInfo.description}</p>
                </div>
              </div>

              <Separator />

              {/* Store Details Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4" />
                    Email Address
                  </div>
                  <p className="text-sm font-medium">{storeInfo.email}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />
                    Phone Number
                  </div>
                  <p className="text-sm font-medium">{storeInfo.phone}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    Address
                  </div>
                  <p className="text-sm font-medium">
                    {storeInfo.address}<br />
                    {storeInfo.city}, {storeInfo.state} {storeInfo.zip}<br />
                    {storeInfo.country}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="size-4" />
                    Website
                  </div>
                  <a href={storeInfo.website} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                    {storeInfo.website}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
              <div className="space-y-1.5">
                <CardTitle className="text-xl font-semibold">User Profile</CardTitle>
                <CardDescription className="text-sm">
                  Your personal account information
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditProfileOpen(true)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="size-20 border-2 shadow-lg">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-2xl font-semibold text-white">
                      {getInitials(userProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted shadow-sm transition-colors hover:bg-muted/80">
                    <Camera className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{userProfile.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={roleStyles.owner.className}>
                      <Crown className="mr-1 size-3" />
                      {userProfile.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profile Details Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-4" />
                    Email Address
                  </div>
                  <p className="text-sm font-medium">{userProfile.email}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4" />
                    Phone Number
                  </div>
                  <p className="text-sm font-medium">{userProfile.phone}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="size-4" />
                    Timezone
                  </div>
                  <p className="text-sm font-medium">Pacific Time (PT)</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="size-4" />
                    Account Status
                  </div>
                  <Badge variant="secondary" className={statusStyles.active.className}>
                    Active
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Security Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Security</h4>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
              <div className="space-y-1.5">
                <CardTitle className="text-xl font-semibold">Team Members</CardTitle>
                <CardDescription className="text-sm">
                  Manage your team and their access levels
                </CardDescription>
              </div>
              <Button size="sm" className="gap-2 shadow-sm" onClick={() => setIsInviteModalOpen(true)}>
                <Plus className="size-4" />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role Legend */}
              <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 p-4">
                {Object.entries(roleStyles).map(([key, style]) => {
                  const RoleIcon = style.icon
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <Badge variant="secondary" className={style.className}>
                        <RoleIcon className="mr-1 size-3" />
                        {style.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{style.description}</span>
                    </div>
                  )
                })}
              </div>

              <Separator />

              {/* Team Members List */}
              <div className="space-y-2">
                {teamMembers.map((member) => {
                  const RoleIcon = roleStyles[member.role].icon
                  return (
                    <div
                      key={member.id}
                      className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="size-11 border">
                          {member.avatar ? (
                            <AvatarImage src={member.avatar} />
                          ) : null}
                          <AvatarFallback className="bg-muted text-sm font-medium">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{member.name}</span>
                            {member.status === "pending" && (
                              <Badge variant="secondary" className={statusStyles.pending.className}>
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={roleStyles[member.role].className}>
                          <RoleIcon className="mr-1 size-3" />
                          {roleStyles[member.role].label}
                        </Badge>
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          Joined {member.joinedDate}
                        </span>
                        {member.role !== "owner" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                              >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem className="gap-2">
                                <Shield className="size-4" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                                <Trash2 className="size-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Member Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "manager" | "staff")}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-blue-600" />
                      <span>Manager</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-gray-600" />
                      <span>Staff</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleStyles[inviteRole].description}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail} className="gap-2">
              <Mail className="size-4" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Store Modal */}
      <Dialog open={isEditStoreOpen} onOpenChange={setIsEditStoreOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Store Information</DialogTitle>
            <DialogDescription>
              Update your store details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-sm font-medium">
                Store Name
              </Label>
              <Input
                id="storeName"
                value={storeInfo.name}
                onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeEmail" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={storeInfo.email}
                  onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storePhone" className="text-sm font-medium">
                  Phone
                </Label>
                <Input
                  id="storePhone"
                  value={storeInfo.phone}
                  onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeAddress" className="text-sm font-medium">
                Address
              </Label>
              <Input
                id="storeAddress"
                value={storeInfo.address}
                onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="storeCity" className="text-sm font-medium">
                  City
                </Label>
                <Input
                  id="storeCity"
                  value={storeInfo.city}
                  onChange={(e) => setStoreInfo({ ...storeInfo, city: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeState" className="text-sm font-medium">
                  State
                </Label>
                <Input
                  id="storeState"
                  value={storeInfo.state}
                  onChange={(e) => setStoreInfo({ ...storeInfo, state: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeZip" className="text-sm font-medium">
                  ZIP Code
                </Label>
                <Input
                  id="storeZip"
                  value={storeInfo.zip}
                  onChange={(e) => setStoreInfo({ ...storeInfo, zip: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeWebsite" className="text-sm font-medium">
                Website
              </Label>
              <Input
                id="storeWebsite"
                value={storeInfo.website}
                onChange={(e) => setStoreInfo({ ...storeInfo, website: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeDescription" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="storeDescription"
                value={storeInfo.description}
                onChange={(e) => setStoreInfo({ ...storeInfo, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditStoreOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditStoreOpen(false)} className="gap-2">
              <Check className="size-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="profileName" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="profileName"
                value={userProfile.name}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profileEmail" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="profileEmail"
                type="email"
                value={userProfile.email}
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profilePhone" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="profilePhone"
                value={userProfile.phone}
                onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Timezone</Label>
              <Select value={userProfile.timezone} onValueChange={(v) => setUserProfile({ ...userProfile, timezone: v })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditProfileOpen(false)} className="gap-2">
              <Check className="size-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
