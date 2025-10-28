import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function useStoreUser() {
  const { user, isLoaded } = useUser();
  const [userId, setUserId] = useState(null);
  const storeUser = useMutation(api.users.store);
  
  useEffect(() => {
    if (!user || !isLoaded) {
      setUserId(null);
      return;
    }
    
    async function createUser() {
      try {
        const id = await storeUser({
          clerkId: user.id,
          name: user.fullName || user.firstName || "Anonymous",
          email: user.primaryEmailAddress?.emailAddress || "",
          imageUrl: user.imageUrl,
        });
        setUserId(id);
      } catch (error) {
        console.error("Failed to store user:", error);
        // Still set userId to user.id so the app works
        setUserId(user.id);
      }
    }
    
    createUser();
  }, [user, isLoaded, storeUser]);
  
  return {
    isLoading: !isLoaded,
    isAuthenticated: !!user,
    userId,
  };
}
