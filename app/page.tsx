"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Coins, Users, Gift, Bell, Moon, Sun, AlertCircle } from "lucide-react"

// Define User interface to match database and API responses
interface User {
  fid: number
  username: string
  display_name: string // Matches DB column name
  pfp_url: string // Matches DB column name
  followed?: boolean
}

interface UserStats {
  coins: number
  follows_given: number
  followers_received: number
  referrals: number
}

// Define FarcasterContext to match SDK structure
interface FarcasterContext {
  user?: {
    fid: number
    username: string
    displayName: string // Matches SDK property name
    pfpUrl: string // Matches SDK property name
  }
}

export default function FarcasterFollowApp() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [context, setContext] = useState<FarcasterContext | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    coins: 0,
    follows_given: 0,
    followers_received: 0,
    referrals: 0,
  })
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [profileUrl, setProfileUrl] = useState("")
  const [followerQuantity, setFollowerQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        let sdkContext: any = null
        let sdkInstance: any = null

        try {
          // Try new SDK
          const { sdk: newSdk } = await import("@farcaster/miniapp-sdk")
          sdkContext = newSdk.context
          sdkInstance = newSdk
          console.log("Using new miniapp SDK")
        } catch (newSdkError) {
          try {
            // Fallback to old SDK
            const { sdk: oldSdk } = await import("@farcaster/frame-sdk")
            sdkContext = oldSdk.context
            sdkInstance = oldSdk
            console.log("Using legacy frame SDK")
          } catch (oldSdkError) {
            console.log("No Farcaster SDK available, using demo mode")
          }
        }

        let currentUser: FarcasterContext["user"] | null = null
        let isDemoUser = false // Flag to track if it's a demo user

        if (sdkContext?.user) {
          try {
            // Attempt to get a plain object representation of sdkContext.user
            // This helps if sdkContext.user is a Proxy or has non-serializable properties
            const rawSdkContextUser = JSON.parse(JSON.stringify(sdkContext.user))

            const userFid = Number(rawSdkContextUser.fid)
            const username = String(rawSdkContextUser.username || `user_${userFid}`)
            const displayName = String(rawSdkContextUser.displayName || `User ${userFid}`)
            const pfpUrl = String(rawSdkContextUser.pfpUrl || "/placeholder.svg")

            if (isNaN(userFid) || userFid === 0) {
              console.warn("Invalid FID received from SDK context, falling back to demo user.")
              currentUser = {
                fid: 12345,
                username: "demouser",
                displayName: "Demo User",
                pfpUrl: "/placeholder.svg",
              }
              isDemoUser = true
            } else {
              currentUser = {
                fid: userFid,
                username: username,
                displayName: displayName,
                pfpUrl: pfpUrl,
              }
            }
          } catch (e) {
            console.warn("Could not process sdkContext.user, falling back to demo user.", e)
            currentUser = {
              fid: 12345,
              username: "demouser",
              displayName: "Demo User",
              pfpUrl: "/placeholder.svg",
            }
            isDemoUser = true
          }
        } else {
          // Demo context if no SDK user is available
          currentUser = {
            fid: 12345,
            username: "demouser",
            displayName: "Demo User",
            pfpUrl: "/placeholder.svg",
          }
          isDemoUser = true
        }

        setContext({ user: currentUser })

        // Initialize user in database and load stats
        if (currentUser?.fid) {
          await fetch("/api/users/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fid: currentUser.fid,
              username: currentUser.username,
              displayName: currentUser.displayName,
              pfpUrl: currentUser.pfpUrl,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                console.log("User initialized in DB:", data.user)
                setUserStats({
                  coins: Number(data.stats.coins) || 0,
                  follows_given: Number(data.stats.follows_given) || 0,
                  followers_received: Number(data.stats.followers_received) || 0,
                  referrals: Number(data.stats.referrals) || 0,
                })
              } else {
                console.error("Failed to initialize user in DB:", data.error)
                toast({
                  title: "Database Error",
                  description: "Failed to load user data from database. Using default stats.",
                  variant: "destructive",
                })
                // Fallback to default stats if DB init fails
                setUserStats({ coins: 10, follows_given: 0, followers_received: 0, referrals: 0 })
              }
            })
            .catch((err) => {
              console.error("Error calling /api/users/init:", err)
              toast({
                title: "Network Error",
                description: "Could not connect to user data service. Using default stats.",
                variant: "destructive",
              })
              // Fallback to default stats if API call fails
              setUserStats({ coins: 10, follows_given: 0, followers_received: 0, referrals: 0 })
            })
        } else {
          // If no valid FID even after fallbacks, use default demo stats
          setUserStats({ coins: 10, follows_given: 0, followers_received: 0, referrals: 0 })
          toast({
            title: "Demo Mode",
            description: "Running in demo mode. Connect your Farcaster account for full features.",
          })
        }

        await loadSuggestedUsers()

        if (sdkInstance && sdkInstance.actions && sdkInstance.actions.ready) {
          await sdkInstance.actions.ready()
        }
        setIsInitialized(true)
      } catch (error) {
        console.error("Failed to initialize app:", error)
        // Ensure context and initialized state are set even on error
        setContext({
          user: {
            fid: 12345,
            username: "demouser",
            displayName: "Demo User",
            pfpUrl: "/placeholder.svg",
          },
        })
        setUserStats({ coins: 10, follows_given: 0, followers_received: 0, referrals: 0 })
        setIsInitialized(true)
        toast({
          title: "Initialization Error",
          description: "Failed to load the app. Please try again.",
          variant: "destructive",
        })
      }
    }

    initializeApp()
  }, [])

  // loadUserData is now called once during initialization via /api/users/init
  // and updates userStats directly from the response.
  // This function is kept for potential future direct calls if needed, but not used in useEffect anymore.
  const loadUserData = async (fid: number) => {
    try {
      const response = await fetch(`/api/users/stats?fid=${fid}`)
      if (response.ok) {
        const stats = await response.json()
        setUserStats({
          coins: Number(stats.coins) || 0,
          follows_given: Number(stats.follows_given) || 0,
          followers_received: Number(stats.followers_received) || 0,
          referrals: Number(stats.referrals) || 0,
        })
      } else {
        console.error("Failed to load user stats:", response.status, response.statusText)
        toast({
          title: "Data Load Error",
          description: "Failed to load your Farcaster stats.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load user data:", error)
      toast({
        title: "Network Error",
        description: "Could not fetch user data. Please check your connection.",
        variant: "destructive",
      })
    }
  }

  const loadSuggestedUsers = async () => {
    try {
      const response = await fetch("/api/orders")
      if (response.ok) {
        const orders = await response.json()
        const users = orders.map((order: any) => ({
          fid: order.target_fid,
          username: order.username,
          display_name: order.display_name,
          pfp_url: order.pfp_url,
          followed: false, // Will be updated after actual follow
        }))
        setSuggestedUsers(users)
      }
    } catch (error) {
      console.error("Failed to load suggested users:", error)
      setSuggestedUsers([])
      toast({
        title: "Suggested Users Error",
        description: "Failed to load suggested users. Please try refreshing.",
        variant: "destructive",
      })
    }
  }

  const handleFollowUser = async (user: User) => {
    if (!context?.user?.fid) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Farcaster account.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Trigger haptic feedback
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk")
        const capabilities = await sdk.getCapabilities()
        if (capabilities.includes("haptics.impactOccurred")) {
          await sdk.haptics.impactOccurred("light")
        }
      } catch (hapticError) {
        console.log("Haptic feedback not available or SDK not loaded for haptics.")
      }

      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followerFid: context.user.fid,
          targetFid: user.fid,
          followerUsername: context.user.username,
          followerDisplayName: context.user.displayName,
          followerPfpUrl: context.user.pfpUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Follow operation failed")
      }

      const result = await response.json()

      // Update local state
      setSuggestedUsers((prev) => prev.map((u) => (u.fid === user.fid ? { ...u, followed: true } : u)))

      // Only update coins if coins were actually earned (not already followed)
      if (result.coinsEarned > 0) {
        setUserStats((prev) => ({
          ...prev,
          coins: prev.coins + result.coinsEarned,
          follows_given: prev.follows_given + 1,
        }))
      }

      // Show success notification
      toast({
        title: "Follow Successful!",
        description:
          result.coinsEarned > 0
            ? `You followed @${user.username} and earned ${result.coinsEarned} coin${result.coinsEarned > 1 ? "s" : ""}!`
            : `You are already following @${user.username}.`,
      })

      try {
        const { sdk } = await import("@farcaster/miniapp-sdk")
        const capabilities = await sdk.getCapabilities()
        if (capabilities.includes("haptics.notificationOccurred")) {
          await sdk.haptics.notificationOccurred("success")
        }
      } catch (hapticError) {
        console.log("Haptic feedback not available or SDK not loaded for haptics.")
      }
    } catch (error: any) {
      console.error("Failed to follow user:", error)
      toast({
        title: "Follow Failed",
        description: error.message || `Failed to follow @${user.username}. Please try again.`,
        variant: "destructive",
      })

      try {
        const { sdk } = await import("@farcaster/miniapp-sdk")
        const capabilities = await sdk.getCapabilities()
        if (capabilities.includes("haptics.notificationOccurred")) {
          await sdk.haptics.notificationOccurred("error")
        }
      } catch (hapticError) {
        console.log("Haptic feedback not available or SDK not loaded for haptics.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOrderFollowers = async () => {
    if (!context?.user?.fid) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Farcaster account.",
        variant: "destructive",
      })
      return
    }

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
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requesterFid: context.user.fid,
          requesterUsername: context.user.username,
          requesterDisplayName: context.user.displayName,
          requesterPfpUrl: context.user.pfpUrl,
          profileUrl,
          quantity: followerQuantity,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Order failed")
      }

      const result = await response.json()

      // Add the validated user to suggested users list
      const newUser: User = {
        fid: result.targetUser.fid,
        username: result.targetUser.username,
        display_name: result.targetUser.displayName, // Use displayName from API response
        pfp_url: result.targetUser.pfpUrl, // Use pfpUrl from API response
        followed: false,
      }

      setSuggestedUsers((prev) => [newUser, ...prev])

      // Update user stats
      setUserStats((prev) => ({
        ...prev,
        coins: prev.coins - result.cost,
        followers_received: prev.followers_received + followerQuantity,
      }))

      setProfileUrl("")
      setFollowerQuantity(1)

      toast({
        title: "Order Successful!",
        description: `Successfully ordered ${followerQuantity} follower${followerQuantity > 1 ? "s" : ""} for ${result.cost} coins! The profile has been verified and added to the follow list.`,
      })
    } catch (error: any) {
      console.error("Failed to order followers:", error)
      toast({
        title: "Order Failed",
        description: error.message || "Failed to process your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteFriend = async () => {
    try {
      const referralLink = `${window.location.origin}?ref=${context?.user?.fid}`

      // Try to use SDK for sharing
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk")
        await sdk.actions.composeCast({
          text: `🪙 Join me on Follow for Coins! Earn coins by following users and get followers for your profile!\n\nUse my referral link to get 5 bonus coins: ${referralLink}`,
          embeds: [referralLink],
        })
      } catch (sdkError) {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(referralLink)
        toast({
          title: "Referral Link Copied!",
          description: "Share this link with your friends to earn referral bonuses.",
        })
      }
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
      const { sdk } = await import("@farcaster/miniapp-sdk")
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

  if (!isInitialized) {
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
                <AvatarImage src={context?.user?.pfpUrl || "/placeholder.svg"} />
                <AvatarFallback>{context?.user?.displayName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              {context?.user?.displayName || context?.user?.username || `FID: ${context?.user?.fid || "Demo"}`}
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
                  <span className="text-2xl font-bold">{userStats.follows_given}</span>
                </div>
                <p className="text-sm opacity-90">Follows Given</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-5 w-5 mr-1" />
                  <span className="text-2xl font-bold">{userStats.followers_received}</span>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="follow">Follow Users</TabsTrigger>
            <TabsTrigger value="order">Order Followers</TabsTrigger>
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
                      There are no suggested users to follow right now. Order followers to add users to this list!
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
                          <AvatarImage src={user.pfp_url || "/placeholder.svg"} />
                          <AvatarFallback>{user.display_name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.display_name}</p>
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
                    placeholder="https://farcaster.xyz/username or https://warpcast.com/username"
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
                    💡 Your profile will be validated and added to the follow list for other users to earn coins by
                    following you.
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
