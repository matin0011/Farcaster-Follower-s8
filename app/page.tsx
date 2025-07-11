"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { sdk } from "@farcaster/frame-sdk"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Coins, Users, Trophy, Gift, Bell, Moon, Sun, AlertCircle } from "lucide-react"

interface User {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  followed?: boolean
}

interface UserStats {
  coins: number
  followsGiven: number
  followersReceived: number
  referrals: number
}

export default function FarcasterFollowApp() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [context, setContext] = useState<any>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    coins: 0,
    followsGiven: 0,
    followersReceived: 0,
    referrals: 0,
  })
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [profileUrl, setProfileUrl] = useState("")
  const [followerQuantity, setFollowerQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState<Array<{ fid: number; username: string; score: number }>>([])

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize SDK and get context
        setContext(sdk.context)

        // Load user data
        await loadUserData()
        await loadSuggestedUsers()
        await loadLeaderboard()

        // Mark app as ready
        await sdk.actions.ready()
      } catch (error) {
        console.error("Failed to initialize app:", error)
        toast({
          title: "Initialization Error",
          description: "Failed to load the app. Please try again.",
          variant: "destructive",
        })
      }
    }

    initializeApp()
  }, [])

  const loadUserData = async () => {
    // In a real app, this would fetch from your backend
    // For demo purposes, we'll use mock data
    const mockStats = {
      coins: 15,
      followsGiven: 8,
      followersReceived: 12,
      referrals: 3,
    }
    setUserStats(mockStats)
  }

  const loadSuggestedUsers = async () => {
    // Mock suggested users data - sometimes empty to show empty state
    const shouldShowEmpty = Math.random() < 0.3 // 30% chance of empty state

    if (shouldShowEmpty) {
      setSuggestedUsers([])
      return
    }

    const mockUsers: User[] = [
      {
        fid: 3621,
        username: "alice",
        displayName: "Alice Johnson",
        pfpUrl: "/placeholder.svg?height=40&width=40",
        followed: false,
      },
      {
        fid: 1234,
        username: "bob",
        displayName: "Bob Smith",
        pfpUrl: "/placeholder.svg?height=40&width=40",
        followed: false,
      },
      {
        fid: 5678,
        username: "charlie",
        displayName: "Charlie Brown",
        pfpUrl: "/placeholder.svg?height=40&width=40",
        followed: false,
      },
      {
        fid: 9012,
        username: "diana",
        displayName: "Diana Prince",
        pfpUrl: "/placeholder.svg?height=40&width=40",
        followed: false,
      },
    ]
    setSuggestedUsers(mockUsers)
  }

  const loadLeaderboard = async () => {
    // Mock leaderboard data
    const mockLeaderboard = [
      { fid: 1111, username: "topuser1", score: 150 },
      { fid: 2222, username: "topuser2", score: 120 },
      { fid: 3333, username: "topuser3", score: 95 },
      { fid: 4444, username: "topuser4", score: 80 },
      { fid: 5555, username: "topuser5", score: 65 },
    ]
    setLeaderboard(mockLeaderboard)
  }

  const handleFollowUser = async (user: User) => {
    setIsLoading(true)
    try {
      // Trigger haptic feedback
      if (await sdk.getCapabilities().then((caps) => caps.includes("haptics.impactOccurred"))) {
        await sdk.haptics.impactOccurred("light")
      }

      // Simulate follow operation with chance of failure
      const followSuccess = Math.random() > 0.2 // 80% success rate

      if (!followSuccess) {
        throw new Error("Follow operation failed")
      }

      // Update local state
      setSuggestedUsers((prev) => prev.map((u) => (u.fid === user.fid ? { ...u, followed: true } : u)))

      setUserStats((prev) => ({
        ...prev,
        coins: prev.coins + 1,
        followsGiven: prev.followsGiven + 1,
      }))

      // Show success notification
      toast({
        title: "Follow Successful!",
        description: `You followed @${user.username} and earned 1 coin!`,
      })

      if (await sdk.getCapabilities().then((caps) => caps.includes("haptics.notificationOccurred"))) {
        await sdk.haptics.notificationOccurred("success")
      }
    } catch (error) {
      console.error("Failed to follow user:", error)
      toast({
        title: "Follow Failed",
        description: `Failed to follow @${user.username}. Please try again.`,
        variant: "destructive",
      })

      if (await sdk.getCapabilities().then((caps) => caps.includes("haptics.notificationOccurred"))) {
        await sdk.haptics.notificationOccurred("error")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOrderFollowers = async () => {
    const totalCost = followerQuantity * 2

    if (userStats.coins < totalCost) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${totalCost} coins to order ${followerQuantity} follower${followerQuantity > 1 ? "s" : ""}. You have ${userStats.coins} coins.`,
        variant: "destructive",
      })
      return
    }

    if (!profileUrl.trim()) {
      toast({
        title: "Profile URL Required",
        description: "Please enter your Farcaster profile URL.",
        variant: "destructive",
      })
      return
    }

    if (followerQuantity < 1 || followerQuantity > 100) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a quantity between 1 and 100.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // In a real app, you would:
      // 1. Validate the profile URL
      // 2. Add the user to the follow queue
      // 3. Deduct coins
      // 4. Process the follower order

      setUserStats((prev) => ({
        ...prev,
        coins: prev.coins - totalCost,
        followersReceived: prev.followersReceived + followerQuantity,
      }))

      setProfileUrl("")
      setFollowerQuantity(1)

      toast({
        title: "Order Successful!",
        description: `Successfully ordered ${followerQuantity} follower${followerQuantity > 1 ? "s" : ""} for ${totalCost} coins!`,
      })
    } catch (error) {
      console.error("Failed to order followers:", error)
      toast({
        title: "Order Failed",
        description: "Failed to process your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteFriend = async () => {
    try {
      const referralLink = `https://farcaster.xyz/miniapps/follow-app?ref=${context?.user?.fid}`

      await sdk.actions.composeCast({
        text: `🪙 Join me on Follow for Coins! Earn coins by following users and get followers for your profile!\n\nUse my referral link to get 5 bonus coins: ${referralLink}`,
        embeds: [referralLink],
      })
    } catch (error) {
      console.error("Failed to share referral:", error)
      toast({
        title: "Share Failed",
        description: "Failed to share referral link. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddApp = async () => {
    try {
      await sdk.actions.addMiniApp()
    } catch (error) {
      console.error("Failed to add app:", error)
      toast({
        title: "Add App Failed",
        description: "Failed to add app to your collection.",
        variant: "destructive",
      })
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!context) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 relative">
          <Button variant="outline" size="icon" onClick={toggleTheme} className="absolute right-0 top-0 bg-transparent">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">🪙 Follow for Coins</h1>
          <p className="text-gray-600 dark:text-gray-300">Follow users, earn coins, order followers!</p>
        </div>

        {/* Stats Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={context.user?.pfpUrl || "/placeholder.svg"} />
                <AvatarFallback>{context.user?.displayName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              {context.user?.displayName || context.user?.username || `FID: ${context.user?.fid}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Coins className="h-5 w-5 mr-1" />
                  <span className="text-2xl font-bold">{userStats.coins}</span>
                </div>
                <p className="text-sm opacity-90">Coins</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-5 w-5 mr-1" />
                  <span className="text-2xl font-bold">{userStats.followsGiven}</span>
                </div>
                <p className="text-sm opacity-90">Follows Given</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-5 w-5 mr-1" />
                  <span className="text-2xl font-bold">{userStats.followersReceived}</span>
                </div>
                <p className="text-sm opacity-90">Followers Received</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Gift className="h-5 w-5 mr-1" />
                  <span className="text-2xl font-bold">{userStats.referrals}</span>
                </div>
                <p className="text-sm opacity-90">Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="follow" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="follow">Follow Users</TabsTrigger>
            <TabsTrigger value="order">Order Followers</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Follow Tab */}
          <TabsContent value="follow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Suggested Users</CardTitle>
                <CardDescription>Each follow = 1 free coin!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Users Available</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      There are no suggested users to follow right now. Check back later!
                    </p>
                    <Button onClick={loadSuggestedUsers} variant="outline">
                      Refresh List
                    </Button>
                  </div>
                ) : (
                  suggestedUsers.map((user) => (
                    <div key={user.fid} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.pfpUrl || "/placeholder.svg"} />
                          <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleFollowUser(user)}
                        disabled={user.followed || isLoading}
                        variant={user.followed ? "secondary" : "default"}
                      >
                        {user.followed ? "Followed ✓" : "Follow +1🪙"}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Followers Tab */}
          <TabsContent value="order" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Followers</CardTitle>
                <CardDescription>Each follower = 2 coins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-url">Your Farcaster Profile URL</Label>
                  <Input
                    id="profile-url"
                    placeholder="https://farcaster.xyz/username"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Number of Followers (1-100)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="100"
                    value={followerQuantity}
                    onChange={(e) =>
                      setFollowerQuantity(Math.max(1, Math.min(100, Number.parseInt(e.target.value) || 1)))
                    }
                  />
                  <p className="text-sm text-gray-500">Total cost: {followerQuantity * 2} coins</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 After ordering, your profile will be added to the follow list for other users.
                  </p>
                </div>
                <Button
                  onClick={handleOrderFollowers}
                  disabled={userStats.coins < followerQuantity * 2 || isLoading || !profileUrl.trim()}
                  className="w-full"
                  size="lg"
                >
                  {userStats.coins < followerQuantity * 2
                    ? `Insufficient Coins (Need: ${followerQuantity * 2})`
                    : `Order ${followerQuantity} Follower${followerQuantity > 1 ? "s" : ""} (-${followerQuantity * 2}🪙)`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Users
                </CardTitle>
                <CardDescription>Users with the highest scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((user, index) => (
                    <div key={user.fid} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                        <span className="font-medium">@{user.username}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{user.score}</span>
                        <Coins className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Button onClick={handleInviteFriend} variant="outline" size="lg">
            <Gift className="h-4 w-4 mr-2" />
            Invite Friends (+5🪙)
          </Button>
          <Button onClick={handleAddApp} variant="outline" size="lg">
            <Bell className="h-4 w-4 mr-2" />
            Add to Apps
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Built for Farcaster • Follow for Coins</p>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
